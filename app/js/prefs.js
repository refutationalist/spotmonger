
var prefs = {
	jack_ports:     "system.*playback_[12]", // port regex to connect to.  passed to mplayer.
	jack_noconnect: false, // or, just don't connect and let something else handle it
	cue_command:    "", // command to call when countdown reaches zero
	state_file:     "", // json state file for external usage


	config_file:   process.env.HOME+"/.spotmongerrc",
	is_open: false,
	win: false,

	load: function() {

		try {
			var string = require('fs').readFileSync(this.config_file, 'utf-8');
			var tmp_config = JSON.parse(string);

			if (typeof(tmp_config) == "object") {

				for (var k in tmp_config) {
					if (tmp_config[k]) this[k] = tmp_config[k]; // is there a less stupid way to do this?
				}
		
			} // do nothing because the defaults are already set

		} catch (e) {
			error.report("Could not load config: "+e);
		}


	}, 

	save: function() {

		try {
			var cfg = {
				jack_ports:     this.jack_ports,
				jack_noconnect: this.jack_noconnect,
				cue_command:    this.cue_command,
				state_file:     this.state_file
			};

			require('fs').writeFileSync(prefs.config_file, JSON.stringify(cfg, null, 4));
		} catch (e) {
			error.report("Could not save config file: "+e);
		}

	},

	pop: function() {

		if (this.is_open == false) {
				this.is_open = true;
				this.win = nw.Window.open('prefs_win.html', 
										  {
											width: 616,
											height: 364,
											frame: true,
											position: "mouse",
											focus: true
										  }, 
										  function (win) {
											  win.on('closed', function() {
												  prefs.is_open = false;
											  });
											  
										  });



		}
	}



}
