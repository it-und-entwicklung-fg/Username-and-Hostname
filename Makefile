# Basic Makefile

UUID = username-hotname@it-und-entwicklung-fg.de
BASE_MODULES = extension.js stylesheet.css metadata.json LICENSE README.md prefs.js convenience.js
EXTRA_MEDIA = logo.png
EXTRA_UI = prefs-gtk4.glade prefs.glade
EXTRA_SETTINGS = gschemas.compiled
ifeq ($(strip $(DESTDIR)),)
	INSTALLTYPE = local
	INSTALLBASE = $(HOME)/.local/share/gnome-shell/extensions
else
	INSTALLTYPE = system
	SHARE_PREFIX = $(DESTDIR)/usr/share
	INSTALLBASE = $(SHARE_PREFIX)/gnome-shell/extensions
endif
INSTALLNAME = username-hotname@it-und-entwicklung-fg.de

# The command line passed variable VERSION is used to set the version string
# in the metadata and in the generated zip-file. If no VERSION is passed, the
# current commit SHA1 is used as version number in the metadata while the
# generated zip file has no string attached.
ifdef VERSION
	VSTRING = _v$(VERSION)
else
	VERSION = $(shell git rev-parse HEAD)
	VSTRING =
endif

install: install-local

install-local: _build
	rm -rf $(INSTALLBASE)/$(INSTALLNAME)
	mkdir -p $(INSTALLBASE)/$(INSTALLNAME)
	cp -r ./_build/* $(INSTALLBASE)/$(INSTALLNAME)/
ifeq ($(INSTALLTYPE),system)
	# system-wide settings and locale files
	rm -r $(INSTALLBASE)/$(INSTALLNAME)/schemas $(INSTALLBASE)/$(INSTALLNAME)/locale
endif
	-rm -fR _build
	echo done

zip-file: _build
	cd _build ; \
	zip -qr "$(UUID)$(VSTRING).zip" .
	mv _build/$(UUID)$(VSTRING).zip ./
	-rm -fR _build

_build: 
	glib-compile-schemas schemas/
	-rm -fR ./_build
	mkdir -p _build
	cp $(BASE_MODULES) _build
	mkdir -p _build/media
	cd media ; cp $(EXTRA_MEDIA) ../_build/media/
	mkdir -p _build/ui
	cd ui ; cp $(EXTRA_UI) ../_build/ui/
	mkdir -p _build/schemas
	cd schemas ; cp $(EXTRA_SETTINGS) ../_build/schemas/
	sed -i 's/"version": -1/"version": "$(VERSION)"/'  _build/metadata.json;
