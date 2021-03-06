
var prefs = {

	defaults: {
		jack_ports:     "system.*playback_[12]", // port regex to connect to.  passed to mpv.
		jack_noconnect: false, // or, just don't connect and let something else handle it
		cue_command:    "", // command to call when countdown reaches zero
		http_port:     "", // json state file for external usage
		end_warning:    "" // warn on end of track
	},


	config_file:   nw.App.dataPath+"/spotmongerrc",
	is_open: false,
	win: false,

	data: {},

	load: function() {

		try {
			var string = require('fs').readFileSync(this.config_file, 'utf-8');
			var tmp_config = JSON.parse(string);

			if (typeof(tmp_config) == "object") {

				this.data = Object.assign({ }, this.defaults, tmp_config);

			} // do nothing because the defaults are already set

		} catch (e) {
			error.report("Could not load config: "+e);
			this.data = this.defaults;
		}


	}, 

	save: function() {

		try {
			require('fs').writeFileSync(prefs.config_file, JSON.stringify(this.data, null, 4));
		} catch (e) {
			error.report("Could not save config file: "+e);
		}

	},

	pop: function() {

		if (this.is_open == false) {
				this.is_open = true;
				this.win = nw.Window.open('prefs_win.html', 
										  {
										    resizable: false,
											width: 616,
											height: 520,
											frame: true,
											position: "mouse",
											focus: true,
											title: "SpotMonger Preferences"
										  }, 
										  function (win) {
											  win.setResizable(false);
											  win.on('closed', function() {
												  prefs.is_open = false;
											  });
											  
										  });



		}
	}



}
