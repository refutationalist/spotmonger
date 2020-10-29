

var Spotmonger_Control = function(in_config) {

	// Config and Initialization
	var default_config = {
		error:        {
							report: function(str) { console.error(str); },
							note:   function(str) { console.log(str); }
					  },
		emitter:      null,
		ffprobe:      "/usr/bin/ffprobe",
		mplayer:      "/usr/bin/mplayer",
		tar:          "/usr/bin/tar",
		prefs:        { },
		silence_file: process.cwd()+'/silence.mp3',
		loopint:      100,
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

	mpl.report_error = error.note;

	var cart = new CartFiles({
								tar: config.tar,
								ffprobe: config.ffprobe,
								report_error: error.report
							 });


	mpl.init(function() {
		error.note("starting mpl");
		state.mpl_loop = setInterval(loop, config.loopint);

	});



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

						if (config.prefs.cue_command != "") {
							cue_fire(id);
						} else {
							load_cart(id, true);
						}

						delete cart.carts[id].start_at;

					} else { // otherwise, update display



						update_cartstate(id, ((state.loaded == id) ? 'Loaded &amp; Cued In: ' : 'Cued In: ')+int_to_time(diff));
					}
				} else {
					update_cartstate(id, ((state.loaded == id) ? 'Loaded &amp; Clock Stopped' : 'Clock Stopped'));
				}

			}

		}
	}

	function cue_fire(id) {
		try {
			require('child_process').exec(config.prefs.cue_command, 
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

		var do_load = function() {
			mpl.loadlist(files, function() {

				update_cartstate(id, "Loaded");
				emitter.emit('SM_load', id);
				state.loaded = id;


				if (autoplay == true) {
					mpl.playpause();
				}
			});
		};

		if (mpl.state.pause == "no") {
			mpl.stop(do_load);
		} else {
			do_load();
		}


		
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

	function get_display() {


		var display = {
			cart: 'Stopped',
			cart_length: 0,
			cart_position: 0,
			track: '',
			track_length: 0,
			track_remain: 0,
			track_remain_s: 0,
			percentage: 0,
			state: 'PAUSED'
		}

		if (state.loaded != false && mpl.state.meta_title != config.endtok) {

			display.cart = cart.getCartInfo(state.loaded).name;
			display.cart_length = cart.getCartFiles(state.loaded).length;


			var cartpos = -1;
			if (mpl.state.filename != undefined) {
				cartpos = cart.carts[state.loaded].files.indexOf( path.basename(mpl.state.filename) );
			}

			if (cartpos == -1) {
				display.percentage = 0;
				display.cart_position = 0;
				display.track = '';

			} else {
				display.cart_position = cartpos + 1;
				display.track = (cart.carts[state.loaded].single == true) ? '' : mpl.state.meta_title;


				display.track_length = int_to_time(parseInt(mpl.state.length));
				display.track_remain_s = parseInt(mpl.state.length) - parseInt(mpl.state.time_position);
				display.track_remain = int_to_time(display.track_remain_s);


				display.percentage = (mpl.state.time_position / mpl.state.length) * 100;

				if (display.percentage < 0) display.percentage = 0;
			}

			display.state = (mpl.state.pause == "no") ? 'PLAYING' : 'PAUSED';
		}


		return display;
	}

	function update_display() {


		emitter.emit('SM_display', get_display());

	}

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

	function get_state() {
		
		var dumpstate = {
			loaded: state.loaded,
			carts: cart.carts,
			mplayer: mpl.state
		};

		return dumpstate;
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
			update_cartstate(id, ((state.loaded == id) ? "Loaded" : ""));
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
			
		},

		state: function() {
			return get_state();
		},

		display: function() {
			return get_display();
		}





	};


};

