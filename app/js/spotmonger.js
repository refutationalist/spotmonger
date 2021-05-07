

var Spotmonger_Control = function(in_config) {

	// Config and Initialization
	var default_config = {
		error:        {
							report: function(str) { console.error(str); },
							note:   function(str) { console.log(str); }
					  },
		emitter:      null,
		ffprobe:      "/usr/bin/ffprobe",
		mpv:          "/usr/bin/mpv",
		tar:          "/usr/bin/tar",
		prefs:        { },
		loopint:      100,
	};


	var state = {
		loaded: false,
		stopclock: 0,
		loop: false,
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



	var player = new mpv({
		name: "spotmonger",
		bin: config.mpv,
		ports: config.prefs.jack_ports,
		noconnect: (config.prefs.jack_noconnect) ? true : false,
		idlePause: true
	});
	player.error = error.note;


	var cart = new CartFiles({
								tar: config.tar,
								ffprobe: config.ffprobe,
								report_error: error.report
							 });

	/*
	mpl.init(function() {
		error.note("starting mpl");
		state.mpl_loop = setInterval(loop, config.loopint);

	});
	*/
	state.loop = setInterval(loop, config.loopint);
	



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
			player.playlist(files, function() {

				update_cartstate(id, "Loaded");
				emitter.emit('SM_load', id);
				state.loaded = id;


				if (autoplay == true) {
					player.pause();
				}
			}.bind(state));
		};

		if (player.paused == false) {
			player.stop(do_load);
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
			player.stop(function() {
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

		if (state.loaded != false && typeof player.state.paused != 'undefined') {

			display.cart = cart.getCartInfo(state.loaded).name;
			display.cart_length = cart.getCartFiles(state.loaded).length;


			var cartpos = -1;
			if (typeof player.state.filename != 'undefined') {
				cartpos = cart.carts[state.loaded].files.indexOf( path.basename(player.state.filename) );
			}

			if (cartpos == -1) {
				display.percentage = 0;
				display.cart_position = 0;
				display.track = '';

			} else {
				display.cart_position = cartpos + 1;
				display.track = (cart.carts[state.loaded].single == true) ? '' : player.state.metadata.title;


				display.track_length = int_to_time(parseInt(player.state.statistics.duration));
				display.track_remain_s = player.state.remaining;
				display.track_remain = int_to_time(display.track_remain_s);


				display.percentage = player.state.percent

				if (display.percentage < 0) display.percentage = 0;
			}

			display.state = (player.state.paused) ? 'PAUSED' : 'PLAYING';
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
			mpv: player.state
		};

		return dumpstate;
	}


	return {
		add: function(file) { return add_cart(file); },
		eject: function(id) { return remove_cart(id); },
		load: function(id, autoplay) { return load_cart(id, autoplay); },

		next: function() { 
			player.next();	
		},

		prev: function() { 
			if (state.loaded != false) {
			
				var pos = cart.getCartInfo(state.loaded).files.indexOf(player.state.filename);
				console.log("POS", pos, state.loaded);
				if (pos <= 0) {
					player.seek(0);
				} else {
					player.previous();
				}

			}
		},


		playpause: function() { 

			let in_playlist = false;
			for (const x in player.state.playlist) {
				if (player.state.playlist[x].current == true) in_playlist = true;
			}

			console.log("in_playlist", in_playlist);


			if (state.loaded != false && in_playlist == false) { 
				load_cart(state.loaded, true);
			} else {
				player.pause(); 
			}

		},



		destruct: function() { 
			error.note("quittig mpv");
			player.quit();

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

