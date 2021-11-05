// Import nescessary libs
const Main = imports.ui.main;
const Lang = imports.lang;
const Util = imports.misc.util;
const PopupMenu = imports.ui.popupMenu;
const { AccountsService, Clutter, GLib, St } = imports.gi;
const { Avatar } = imports.ui.userWidget;
const Config = imports.misc.config;
const GObject = imports.gi.GObject;

//Import extension preferences
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

//Creates temporary iconMenuItem variable
var iconMenuItem = null;
var hostname_lbl = null;

//Creates some global variables
let shell_Version = Config.PACKAGE_VERSION;

function init() {
}

//Run when enabled
function enable() {
    //Calls the updateExtensionAppearence function to draw the first icon
    updateExtensionAppearence();
    hostname_lbl = new St.Button({style_class: 'hostname',
                           reactive: false,
                           can_focus: false,
                           track_hover: false,
                           label: GLib.get_host_name()});
    Main.panel._leftBox.insert_child_at_index(hostname_lbl, 0);
}

//Run when disabled
function disable() {
    //Disconnects systemMenu
    if (this._menuOpenStateChangedId) {
        this.systemMenu.menu.disconnect(this._menuOpenStateChangedId);
        this._menuOpenStateChangedId = 0;
    }
    //Destroys iconMenuItem (basically removes the option from the menu)
    iconMenuItem.destroy();
    Main.panel._leftBox.remove_child(hostname_lbl);
    hostname_lbl.destroy();
    hostname_lbl = null;
}

//Destroys everything and creates a new one
function resetPre() {
    //Disconnects systemMenu
    if (this._menuOpenStateChangedId) {
        this.systemMenu.menu.disconnect(this._menuOpenStateChangedId);
        this._menuOpenStateChangedId = 0;
    }
    //Destroys iconMenuItem (basically removes the option from the menu)
    iconMenuItem.destroy();
    updateExtensionAppearence()
}

function updateExtensionAppearence() {
    //Creates new PopupMenuItem
    this.iconMenuItem = new PopupMenu.PopupMenuItem('');
    //Adds a box where we are going to store picture and avatar
    this.iconMenuItem.add_child(
        new St.BoxLayout({
            x_align: Clutter.ActorAlign.START,
            x_expand: true,
          	y_expand: true,
          	vertical: false,
         })
    );

    //Adds item to menu
    Main.panel.statusArea.aggregateMenu.menu.addMenuItem(this.iconMenuItem, 0);
    this.systemMenu = Main.panel.statusArea['aggregateMenu']._system;

    //When the popup menu opens do this:
    //Check if on compact mode
    this._menuOpenStateChangedId = this.systemMenu.menu.connect('open-state-changed', Lang.bind(this,
          function(menu, open) {
              if (!open)
                  return;
	            //Get user avatar and name
              var userManager = AccountsService.UserManager.get_default();
              var user = userManager.get_user(GLib.get_user_name());
              //Get user icon
              var avatar = new Avatar(user, {
              	iconSize: 48,
              });

              //Get user name and center it vertically
              var userString = new St.Label ({
                style_class: 'userDisplaName',
              	text: "  " + GLib.get_real_name(),
                  x_align: Clutter.ActorAlign.CENTER
              });

              var usernameString = new St.Label ({
                style_class: 'userName',
                text: "  " + GLib.get_user_name(),
                x_align: Clutter.ActorAlign.CENTER
              });

              var userBox = new St.BoxLayout({
                style_class: 'userNameBox',
                y_align: Clutter.ActorAlign.CENTER,
                x_expand: false,
                y_expand: true,
                vertical: true,
              });

              userBox.add_child(userString);
              userBox.add_child(usernameString)

              avatar.update();

              //Remove all created menu itens
              this.iconMenuItem.actor.get_last_child().remove_all_children();

              //Add the avatar picture
              this.iconMenuItem.actor.get_last_child().add_child(avatar.actor);

              //Add name
              this.iconMenuItem.actor.get_last_child().add_child(userBox);
    }));
}