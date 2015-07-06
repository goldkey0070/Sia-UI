// UI.js, the first renderer process, handles loading and transitioning between
// buttons and views. Pretty much all user interaction response should go
// through here.

// Elements used across this file. GCed after file execution
'use strict';
const webFrame = require('web-frame');
const electronScreen = require('screen');
const path = require('path');
const fs = require('fs');
var daemon = require('./daemonManager');
var plugins = require('./plugins/pluginManager');

// When required, the UI initializes itself through a single call to init()
module.exports = (function UI() {
	// Encapsulated 'private' elements
	var configPath = path.join(__dirname, '../config.json');
	var config;

	// adjustZoom makes the app more readable on high dpi screens. 
	// TODO: Take better approach, resolution doesn't mean high dpi. Though
	// supposedly there's not a sure-fire way to find dpi on all platforms.
	function adjustHighResZoom() {
		// Calculated upon function call to get appropriate zoom (even if the
		// primary display were to change).
		var screenSize = electronScreen.getPrimaryDisplay().workAreaSize;
		var screenArea = screenSize.width * screenSize.height;
		if (screenArea >= 2048*1152) {
			config.zoom = 2;
			webFrame.setZoomFactor(config.zoom);
		}
	}
	
	// saveConfig writes the current config to defaultConfigPath
	function saveConfig() {
		fs.writeFile(configPath, JSON.stringify(config, null, '\t'), function(err) {
			if (err) {
				console.log(err);
			} 
		});
	}

	// getDefaultConfig returns the default settings
	function getDefaultConfig() {
		return {
			appPath: path.join(__dirname, '..'),
			autogenerated: true,
			zoom: 1,
			homePlugin: 'Overview',
			pluginsPath: path.join(__dirname, '../plugins'),
			siadCommand: process.platform === 'win32' ? './siad.exe' : './siad',
			siadPath: path.join(__dirname, '../dependencies/Sia'),
			siadAddress: 'http://localhost:9980'
		};
	}

	// loadConfig finds if a config file exists and uses default if not
	function loadConfig(callback) {
		fs.readFile(configPath, function(err, data) {
			if (err) {
				// no file found, use default config
				config = getDefaultConfig();	
			} else {
				// found config, use it
				config = JSON.parse(data);
			}
			callback();
		});
	}

	// init, called at $(window).ready, initalizes the view
	function init() {
		loadConfig(function() {
			saveConfig();
			adjustHighResZoom(config);
			plugins(config);
			// TODO: This is hardcoded. daemonManager could be a plugin, siad
			// be a plugin itself, or even have a new class of initialized
			// components called dependencies.
			daemon(config);
		});
	}

	// call init and start the UI
	init();
})();
