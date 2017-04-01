

var Spotmonger_Control = function(in_config) {

	// Config and Initialization
	var default_config = {
		error:        {
							report: function(str) { console.error(str); },
							note:   function(str) { console.log(str); }
					  },
		emitter:      null,
		ffprobe:      "/usr/bin/ffprobeDEF",
		mplayer:      "/usr/bin/mplayerDEF",
		tar:          "/usr/bin/tarDEF",
		prefs:        { },
		silence_file: process.cwd()+'/silence.mp3',
		loopint:      500,
		endtok:       'CARTAMOC.SILENCE'
	};


	var state = {
		loaded: false,
		stopclock: 0,
		mpl_loop: false,
		state_file_loop: false
	}

	// START INIT CODE

	var path         = require('path');
	var config = Object.assign({ }, default_config, in_config);

	var error   = config.error;
	var emitter = config.emitter;
	delete(config.error);
	delete(config.emitter);

	if (emitter == null) return false;



	var mpl  = new MPlayerControl(config.mplayer, 
								 (config.prefs.jack_noconnect) ? "noconnect" : config.prefs.jack_ports);
	var cart = new CartFiles();


	mpl.init(function() {
		error.note("starting mpl");
		state.mpl_loop = setInterval(loop, config.loopint);

	});


	
	if (config.prefs.state_file != "") { // set up state file 
		error.note("configuring state file");

		state.state_file_loop = setInterval(function() {

			try {
				var dumpstate = mpl.state;
				dumpstate.loaded = state.loaded
				dumpstate.carts  = cart.carts;

				require('fs').writeFileSync(config.prefs.state_file,
											JSON.stringify(dumpstate, null, 4));
			} catch (e) {
				error.report("State File Error: "+e);
			}
		}, 500);
	}


	// END INIT CODE



	// Private Methods
	
	function loop() {

		update_display();


		// manage scheduler
		
		for (id in cart.carts) {

			// if no cue, do nothing.
			if (cart.carts[id].start_at == undefined) continue;

			if (cart.carts[id].start_at == 0) { // if cue is at 0, clear display
				update_cartstate(id, '');
				delete cart.carts[id].start_at;
			} else {

				if (state.stopclock == 0) {
					var diff = cart.carts[id].start_at - (Date.now() / 1000);


					if (diff <= 0) { // if we're past cue time, fire cue

						if (prefs.cue_command != "") {
							cue_fire(id);
						} else {
							load_cart(id, true);
						}

						delete cart.carts[id].start_at;

					} else { // otherwise, update display
						update_cartstate(id, 'Cued In: '+int_to_time(diff));
					}
				} else {
					update_cartstate(id, 'Clock Stopped');
				}

			}

		}
	}

	function cue_fire(id) {
		try {
			require('child_process').exec(prefs.cue_command, 
										  function(err, stdout, stderr) {

				if (err)    error.report("Cue Command Err: "+err);
				if (stderr) error.report("Cue Command STDERR: "+stderr);

				load_cart(id, true);


			});
		} catch (e) {
			error.report("Cue Command Exec Failure: "+e);
			load_cart(id, true);
		}
	}

	function load_cart(id, autoplay) {
		var files = cart.getCartFiles(id);
		files.push(config.silence_file); // add slience file to detect end of cart

		update_cartstate(false, '');
		update_cartstate(id, "Loading");

		mpl.stop(function() {
			mpl.loadlist(files, function() {

				update_cartstate(id, "Loaded");
				emitter.emit('SM_load', id);
				state.loaded = id;


				if (autoplay == true) {
					mpl.playpause();
				}
			});
		});

		
	}

	function add_cart(file) {
		
		cart.load(file, function(id) {

			var info = cart.getCartInfo(id);
			info.id = id;

			cart.runtime(id, function(id) {
				info.runtime = int_to_time(cart.getCartInfo(id).runtime);
				emitter.emit('SM_add', info);
			});


		});
	}

	function remove_cart() {
		
		if (state.loaded == false) {
			warn("No cart loaded.");
		} else {
			mpl.loadfile(config.silence_file, false, true, function() {
				cart.unload(state.loaded);
				emitter.emit('SM_eject', state.loaded);
				state.loaded = false;
			});

		}
	}

	function update_display() {

		var display = {
			cart: 'Stopped',
			cart_length: 0,
			cart_position: 0,
			track: '',
			track_length: 0,
			track_remain: 0,
			percentage: 0,
			state: 'PAUSED'
		}

		if (state.loaded != false && mpl.state.meta_title != config.endtok) {

			display.cart = cart.getCartInfo(state.loaded).name;
			if (cart.carts[state.loaded].single != true) display.track = mpl.state.meta_title;

			display.cart_length = cart.getCartFiles(state.loaded).length;

			console.log("basename", mpl.state.filename, typeof(mpl.state.filename), path.basename(mpl.state.filename));
			display.cart_position = cart.carts[state.loaded].files.indexOf( path.basename(mpl.state.filename) ) + 1;

			display.track_length = int_to_time(parseInt(mpl.state.length));
			display.track_remain = int_to_time(parseInt(mpl.state.length) - 
											   parseInt(mpl.state.time_position));


			display.percentage = (mpl.state.time_position / mpl.state.length) * 100;

			display.state = (mpl.state.pause == "no") ? 'PLAYING' : 'PAUSED';

		}

		emitter.emit('SM_display', display);

	}

	/*
	function reset_display() {
	}
	*/

	function warn(str) {
		emitter.emit('SM_warn', str);
	}

	function int_to_time(str) {
		
		var rawsecs = parseInt(str);

		var minutes = Math.floor(rawsecs / 60);
		var seconds = Math.ceil(rawsecs % 60);

		if (seconds < 10) {
			seconds = '0' + seconds;
		}

		return minutes+":"+seconds;

	}

	function time_to_int(str) {
		return (parseInt(thing[0]) * 60) + parseInt(thing[1]);
	}


	function update_cartstate(id, txt) {
		emitter.emit('SM_cartstate', id, txt);

	}


	return {
		add: function(file) { return add_cart(file); },
		eject: function(id) { return remove_cart(id); },
		load: function(id, autoplay) { return load_cart(id, autoplay); },


		next: function() { 
			mpl.next();	
		},

		prev: function() { 
			if (state.loaded != false) {
			
				var pos = cart.getCartInfo(state.loaded).files.indexOf(mpl.state.filename);
				if (pos == 0) {
					mpl.seek(0, 1);
				} else {
					mpl.previous();  
				}

			}
		},


		playpause: function() { 
			
			if (state.loaded != false &&
				mpl.state.meta_title == config.endtok) {
				load_cart(state.loaded, true);
			} else {
				mpl.playpause(); 
			}

		},



		destruct: function() { 
			error.note("quitting mplayer");
			mpl.quit();

			error.note("cart cleanup");
			cart.cleanup();
			
		},


		get_cue: function(id) {
			return cart.getCartInfo(id).start_at;
		},

		set_cue: function(id, stamp) {
			cart.carts[id].start_at = stamp;
		}, 

		
		pause_cue: function() {
			state.stopclock = Date.now() / 1000;
		},

		unpause_cue: function() {
			var diff = (Date.now() / 1000) - state.stopclock;

			for (id in cart.carts) {
				if (cart.carts[id].start_at != 0 &&
					cart.carts[id].start_at != undefined) {
					cart.carts[id].start_at += diff;
				}
			}

			state.stopclock = 0;
			
		}



	};


};

