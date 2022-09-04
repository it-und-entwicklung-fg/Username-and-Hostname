// Imports
const Main = imports.ui.main;
const Util = imports.misc.util;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const { AccountsService, Clutter, GLib, St } = imports.gi;
const { Avatar } = imports.ui.userWidget;
const GObject = imports.gi.GObject;

// Imports for system-menu and actions
const System = Main.panel.statusArea.aggregateMenu._system;
const SystemMenu = System.menu;

// Imports for settings
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;

// Create variables
var SETTINGS_SCHEMA = "org.gnome.shell.extensions.username-and-hostname";
var iconMenuItem = null;
let hostname_btn = null;
let extensionSettings = null;

// Initialize the extension
function init() {}

function recreate() {
    // Destroy everything
    iconMenuItem.destroy();
    Main.panel._leftBox.remove_child(hostname_btn);
    hostname_btn.destroy();
    hostname_btn = null;
    // Recreate everything
    // Create the Avatar
    createAvatar();
    // Check if menu should be displayed and show
    if (extensionSettings.get_boolean('show-menu')) {
        hostname_btn = new btn();
        Main.panel.addToStatusArea('HostnameButton', hostname_btn, 0, 'left')
    } else {
        hostname_btn = new St.Button({style_class: 'hostname',
                                reactive: false,
                                can_focus: false,
                                track_hover: false,
                                label: GLib.get_host_name()});
        Main.panel._leftBox.insert_child_at_index(hostname_btn, 0);
    }
}

// Enable the extension
function enable() {
    // Read the settings
    extensionSettings = Lib.getSettings(SETTINGS_SCHEMA);
    // Connect to gsettings and wait for the extension's settings to change
    _settingsChangedSignal = extensionSettings.connect('changed', () => {
        recreate()
    });
    // Create the Avatar
    createAvatar();
    // Check if menu should be displayed and show
    if (extensionSettings.get_boolean('show-menu')) {
        hostname_btn = new btn();
        Main.panel.addToStatusArea('HostnameButton', hostname_btn, 0, 'left')
    } else {
        hostname_btn = new St.Button({style_class: 'hostname',
                                reactive: false,
                                can_focus: false,
                                track_hover: false,
                                label: GLib.get_host_name()});
        Main.panel._leftBox.insert_child_at_index(hostname_btn, 0);
    }
}

// Disable the extension
function disable() {
    //Disconnects systemMenu
    if (this._menuOpenStateChangedId) {
        this.systemMenu.menu.disconnect(this._menuOpenStateChangedId);
        this._menuOpenStateChangedId = 0;
    }
    //Destroys iconMenuItem (basically removes the option from the menu)
    iconMenuItem.destroy();
    Main.panel._leftBox.remove_child(hostname_btn);
    hostname_btn.destroy();
    hostname_btn = null;
    _settingsChangedSignal = null;
}

// Hostname Button Object
var btn = GObject.registerClass(class HostnameButton extends PanelMenu.Button {
    _init() {
        super._init(0.0, _('HostnameButton'));
        // Create and add the Label
        let label = new St.Label({
            text: _(GLib.get_host_name()),
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_actor(label);
        this.toggleOptions()
        if (extensionSettings.get_boolean('hide-system-keys')) {
            // Remove the system-menu items
            SystemMenu.actor.remove_child(System._settingsItem);
            SystemMenu.actor.remove_child(System._lockScreenItem);
            SystemMenu.actor.remove_child(System._sessionSubMenu);
        }
    }

    // Create the menu-items
    toggleOptions() {
		this.menu.removeAll()
        // Create items
		this.item1 = new PopupMenu.PopupImageMenuItem(' Über dieses System', 'preferences-system-details-symbolic');
		this.item2 = new PopupMenu.PopupSeparatorMenuItem();
		this.item3 = new PopupMenu.PopupImageMenuItem(' Einstellungen', 'system-settings-symbolic');
		this.item4 = new PopupMenu.PopupImageMenuItem(' Terminal', 'terminal-symbolic');
		this.item5 = new PopupMenu.PopupSeparatorMenuItem();
        this.item6 = new PopupMenu.PopupImageMenuItem(' Neustart ...', 'system-restart-symbolic');
        this.item7 = new PopupMenu.PopupImageMenuItem(' Ausschalten ...', 'system-shutdown-symbolic');
        this.item8 = new PopupMenu.PopupSeparatorMenuItem();
        this.item9 = new PopupMenu.PopupImageMenuItem(' Sperren', 'changes-prevent-symbolic');
        this.item10 = new PopupMenu.PopupImageMenuItem(' Abmelden', 'system-log-out-symbolic');
		
        // Set actions
		this.item1.connect('activate', () => {Util.spawn(['gnome-control-center', 'info-overview'])});
		this.item3.connect('activate', () => {Util.spawn(['gnome-control-center'])});
        this.item4.connect('activate', () => {Util.spawn(['x-terminal-emulator'])});
        this.item6.connect('activate', () => {Util.spawn(['gnome-session-quit', '--reboot'])});
        this.item7.connect('activate', () => {Util.spawn(['gnome-session-quit', '--power-off'])});
        this.item9.connect('activate', () => {Util.spawn(['loginctl', 'lock-session'])});
        this.item10.connect('activate', () => {Util.spawn(['gnome-session-quit', '--logout'])});

        // Add to menu
		this.menu.addMenuItem(this.item1);
		this.menu.addMenuItem(this.item2);
		this.menu.addMenuItem(this.item3);
		this.menu.addMenuItem(this.item4);
		this.menu.addMenuItem(this.item5);
        this.menu.addMenuItem(this.item6);
		this.menu.addMenuItem(this.item7);
		this.menu.addMenuItem(this.item8);
		this.menu.addMenuItem(this.item9);
        this.menu.addMenuItem(this.item10);
	}

    // Destroy the Button
    _onDestroy() {
        super._onDestroy();
        if (extensionSettings.get_boolean('hide-system-keys')) {
            // Recreate system-menu items
            SystemMenu.actor.insert_child_at_index(System._settingsItem, SystemMenu.numMenuItems);
            SystemMenu.actor.insert_child_at_index(System._lockScreenItem, SystemMenu.numMenuItems);
            SystemMenu.actor.insert_child_at_index(System._sessionSubMenu, SystemMenu.numMenuItems);
        }
    }
})

// Create the Avatar
function createAvatar() {
    // Create new PopupMenuItem
    this.iconMenuItem = new PopupMenu.PopupMenuItem('');
    // Add a box to store the avatar and the username
    this.iconMenuItem.add_child(new St.BoxLayout({
                                    x_align: Clutter.ActorAlign.START,
                                    x_expand: true,
                                    y_expand: true,
                                    vertical: false,
                                }));
    // Set the action
    this.iconMenuItem.connect('activate', () => {Util.spawn(['gnome-control-center', 'user-accounts'])});

    // Add item to menu
    Main.panel.statusArea.aggregateMenu.menu.addMenuItem(this.iconMenuItem, 0);
    this.systemMenu = Main.panel.statusArea['aggregateMenu']._system;

    // When the popup menu opens create the item
    this._menuOpenStateChangedId = this.systemMenu.menu.connect('open-state-changed', 
        (menu, open) => {
            if (!open)
                return;
	        // Get user
            var userManager = AccountsService.UserManager.get_default();
            var user = userManager.get_user(GLib.get_user_name());
            // Get user avatar
            var avatar = new Avatar(user, {
                iconSize: 48,
            });

            // Get user displayname and show it
            var userString = new St.Label ({
                style_class: 'userDisplaName',
              	text: GLib.get_real_name()
            });

            // Get username and show it
            var usernameString = new St.Label ({
                style_class: 'userName',
                text: GLib.get_user_name()
            });

            // Create box for username and user displayname
            var userBox = new St.BoxLayout({
                style_class: 'userNameBox',
                y_align: Clutter.ActorAlign.CENTER,
                vertical: true,
            });

            userBox.add_child(userString);
            userBox.add_child(usernameString);

            avatar.update();

            // Remove all created menu itens
            this.iconMenuItem.actor.get_last_child().remove_all_children();

            // Add the avatar picture
            this.iconMenuItem.actor.get_last_child().add_child(avatar.actor);

            // Add name-box
            this.iconMenuItem.actor.get_last_child().add_child(userBox);
    });
}