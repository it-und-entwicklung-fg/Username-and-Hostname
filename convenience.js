const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;

function getSettings(schema) {
    let extension = ExtensionUtils.getCurrentExtension();

    schema = schema || extension.metadata['settings-schema'];

    const GioSSS = Gio.SettingsSchemaSource;

    // check if this extension was built with "make zip-file", and thus
    // has the schema files in a sub-folder
    // otherwise assume that extension has been installed in the
    // same prefix as gnome-shell (and therefore schemas are available
    // in the standard folders)
    let schemaDir = extension.dir.get_child('schemas');
    let schemaSource;
    if (schemaDir.query_exists(null))
        schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),GioSSS.get_default(),false);
    else
        schemaSource = GioSSS.get_default();

    let schemaObj = schemaSource.lookup(schema, true);
    if (!schemaObj)
        throw new Error('Schema ' + schema + ' could not be found for extension '
                + extension.metadata.uuid + '. Please check your installation.');

    return new Gio.Settings({ settings_schema: schemaObj });
}

var Signal =  class Signal{

    constructor(signalSource, signalName, callback) {
        this._signalSource = signalSource;
        this._signalName = signalName;
        this._signalCallback = callback;
    }

    connect(){
        this._signalId = this._signalSource.connect(this._signalName, this._signalCallback);
    }

    disconnect() {
        if(this._signalId) {
            GObject.Object.prototype.disconnect.call(this._signalSource, this._signalId);
            this._signalId = null;
        }
    }
}

var SignalManager = class SignalManager {

    constructor() {
        this._signals = [];
        this._signalsBySource = {};
    }

    addSignal(signalSource, signalName, callback) {
        let obj = null;
        if(signalSource && signalName && callback) {
            obj = new Signal(signalSource, signalName, callback);
            obj.connect();
            this._signals.push(obj);
            if(!this._signalsBySource[signalSource]) {
                this._signalsBySource[signalSource] = [];
            }
            let item = this._signalsBySource[signalSource];
            item.push(obj);
        }
        return obj;
    }

    disconnectAll() {
        this._signals.forEach(function(obj) {obj.disconnect();});
    }

    disconnectBySource(signalSource) {
        if(this._signalsBySource[signalSource]) {
            let signalBySource = this._signalsBySource[signalSource];
            signalBySource.forEach(function(obj) {obj.disconnect();});
        }
    }
}