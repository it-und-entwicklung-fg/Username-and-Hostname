const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const SignalManager = Lib.SignalManager;

var SETTINGS_SCHEMA = "org.gnome.shell.extensions.username-and-hostname";
var SHOW_MENU = 'show-menu';
var HIDE_SYSTEM_KEYS = 'hide-system-keys';

function init() {
}

const UsernameHostnameSettingsWidget = new GObject.Class({
    Name : 'Username-and-Hostname.Prefs.Widget',
    GTypeName : 'UsernameHostnameSettingsWidget',
    Extends : Gtk.Box,

    _init : function(params) {
        this.parent(params);
        let uiFileSuffix = "";
        if (Gtk.get_major_version() >= "4") {
            uiFileSuffix = "-gtk4";
            this.__addFn = this.append;
            this.__showFn = this.show;
        }
        else {
            this.__addFn = x => this.pack_start(x, true, true, 0);
            this.__showFn = this.show_all;
        }
        this.orientation = Gtk.Orientation.VERTICAL;
        this.spacing = 0;

        // creates the settings
        this._settings = Lib.getSettings(SETTINGS_SCHEMA);

        // creates the ui builder and add the main resource file
        let uiFilePath = Me.path + "/ui/prefs" +uiFileSuffix +".glade";
        let builder = new Gtk.Builder();

        if (builder.add_from_file(uiFilePath) == 0) {

            let label = new Gtk.Label({
                label : _("Could not load the preferences UI file"),
                vexpand : true
            });

            this.__addFn(label);
        } else {
            let mainContainer = builder.get_object("main-container");

            this.__addFn(mainContainer);

            this._signalManager = new SignalManager();

            let showMenuSwitch = builder
                    .get_object("show-menu");

            this._settings.bind(SHOW_MENU,
                    showMenuSwitch, "active",
                    Gio.SettingsBindFlags.DEFAULT);
            
            let hideButtonsSwitch = builder
                    .get_object("hide-system-keys");

            this._settings.bind(HIDE_SYSTEM_KEYS,
                    hideButtonsSwitch, "active",
                    Gio.SettingsBindFlags.DEFAULT);
        }
    }
});

function buildPrefsWidget() {
    let _settingsWidget = new UsernameHostnameSettingsWidget();
    _settingsWidget.__showFn();

    return _settingsWidget;
}