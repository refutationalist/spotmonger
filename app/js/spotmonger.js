
var sm = {
	
	PAUSE:        "&#xf04c;",
	PLAY:         "&#xf04b;",
	SILENCE_FILE: 'CARTAMOC.SILENCE',

	loaded: false,
	stopclock: 0,
	silence_file: process.cwd()+'/silence.mp3',
	/* The silence file is a placeholder file so I know I've reached the
	   end of a cart.   CHEEEEAP HAAAAACK! */

	path: require('path'),


	init: function() {

		if (prefs.state_file != "") { // set up state file 

			setInterval(function() {

				try {
					var dumpstate = mpl.state;

					dumpstate.loaded = sm.loaded
					dumpstate.carts  = cart.carts;

					

					require('fs').writeFileSync(prefs.state_file,
												JSON.stringify(dumpstate, null, 4));
				} catch (e) {
					error.report("State File Error: "+e);
				}
			}, 500);
		}

	},


	loop: function() {  

		// manage display
		sm.update_cart_display();


		if (mpl.state.meta_title == sm.SILENCE_FILE ||
			mpl.state.meta_title == undefined ||
			sm.loaded == false) {

			sm.clear_track_display();

		} else {
			sm.update_track_display();
		}


		// manage scheduler
		
		for (id in cart.carts) {

			// if no cue, do nothing.
			if (cart.carts[id].start_at == undefined) continue;

			if (cart.carts[id].start_at == 0) { // if cue is at 0, clear display
				sm.update_cartstate(id, '');
				delete cart.carts[id].start_at;
			} else {

				if (sm.stopclock == 0) {
					var diff = cart.carts[id].start_at - (Date.now() / 1000);


					if (diff <= 0) { // if we're past cue time, fire cue

						if (prefs.cue_command != "") {
							sm.do_cue_fire(id);
						} else {
							sm.load_cart_id(id, true);
						}

						delete cart.carts[id].start_at;

					} else { // otherwise, update display
						sm.update_cartstate(id, 'Cued In: '+sm.int_to_time(diff));
					}
				} else {
					sm.update_cartstate(id, 'Clock Stopped');
				}


			}


		}

	},


	do_cue_fire: function(id) {
		try {
			require('child_process').exec(prefs.cue_command, 
										  function(err, stdout, stderr) {

				if (err)    error.report("Cue Command Err: "+err);
				if (stderr) error.report("Cue Command STDERR: "+stderr);

				sm.load_cart_id(id, true);


			});
		} catch (e) {
			error.report("Cue Command Exec Failure: "+e);
			sm.load_cart_id(id, true);
		}
	},


	load_cart: function(evt) {
		//var id    = $(this).attr('id');
		var id = evt.target.id;
		sm.load_cart_id(id, false);
	},

	load_cart_id: function(id, autoplay) {

		var files = cart.getCartFiles(id);
		files.push(sm.silence_file); // add slience file to detect end of cart

		sm.update_cartstate(false, '');
		sm.update_cartstate(id, "Loading");

		mpl.stop(function() {
			mpl.loadlist(files, function() {
				sm.update_cartstate(id, "Loaded");

				document.querySelectorAll("#carts .cart").forEach(function (e) { e.classList.remove("loaded"); });
				document.querySelector('#'+id).classList.add("loaded");

				sm.loaded = id;
				if (autoplay == true) {
					mpl.playpause();
				}
			});
		});



	},

	add_cart: function(evt) {


		//var file_ui = $(this).val();
		//$(this).val('');
		var file_ui = evt.target.value;
		evt.target.value = '';


		cart.load(file_ui, function(id) {

			var info = cart.getCartInfo(id);

			var new_div = document.createElement('div');
			new_div.className = 'cart';
			new_div.id = id;

			new_div.insertAdjacentHTML('afterbegin', sprintf("<div class='name'>%s</div>"+
															 "<div class='state'></div>"+
															 "<div class='time'></div>"+
															 "<div class='timeset icon'>&#xf017;</div>", info.name));



			cart.runtime(id, function(id) {
				var time = sm.int_to_time(cart.getCartInfo(id).runtime);
				new_div.querySelector('div.time').innerHTML = time;

			});



			new_div.addEventListener('click', sm.load_cart);
			new_div.querySelector('div.timeset').addEventListener('click', sm.set_cuetime);

			document.querySelector("#carts > div").appendChild(new_div);
		});

	},

	eject: function() {

		if (sm.loaded == false) {
			sm.show_info("No cart loaded.");
		} else {

			mpl.loadfile(sm.silence_file, false, true, function() {
				var element = document.querySelector('#'+sm.loaded);
				element.parentNode.removeChild(element);

				cart.unload(sm.loaded);
				sm.loaded = false;
			});

		}
	},

	update_cart_display: function() {

		/* Cart Name Management */
		if (sm.loaded == false) {
			document.querySelector(".cartname").innerHTML = "Stopped";
		} else {
			var element = document.querySelector(".cartname");

			if (element.innerText != cart.getCartInfo(sm.loaded).name) 
				element.innerHTML = cart.getCartInfo(sm.loaded).name;

		}
	},

	clear_track_display: function() {

		document.querySelector(".trackname").innerHTML = "";
		document.querySelector(".tracknum").style.display = "none";
		document.querySelector("#display .time").innerHTML = "";
		document.querySelector("#display .bar .fill").style.width = "0%";
		document.querySelector("#play").innerHTML = sm.PLAY;

	},

	update_track_display: function() {

		var trackname_ele  = document.querySelector("p.trackname");
		var tracknum_ele   = document.querySelector(".tracknum");
		var tracknum_t_ele = document.querySelector(".tracknum .t");
		var tracknum_o_ele = document.querySelector(".tracknum .o");
		var time_ele       = document.querySelector("#display .time");
		var fill_ele       = document.querySelector("#display .bar .fill");

		document.querySelector("#play").innerHTML = (mpl.state.pause == "no") ? sm.PAUSE : sm.PLAY;

		// determine title and show

		var trackname = mpl.state.filename;

		if (cart.carts[sm.loaded].single == true) {
			trackname = '';
		} else if (mpl.state.meta_title != "") {
			trackname = mpl.state.meta_title;
		}

		if (trackname != trackname_ele.innerText)
			trackname_ele.innerHTML = trackname;



		// show track numbering

		tracknum_t_ele.innerHTML = cart.carts[sm.loaded].files.indexOf( sm.path.basename(mpl.state.filename) ) + 1;
		tracknum_o_ele.innerHTML = cart.getCartFiles(sm.loaded).length;
		tracknum_ele.style.display = "block";

		// time remaining // FIXME min/secify
		time_ele.innerHTML = sm.int_to_time(parseInt(mpl.state.length) - 
											parseInt(mpl.state.time_position));


		// fill bar
		var myperc = (mpl.state.time_position / mpl.state.length) * 100;
		fill_ele.style.width = myperc+"%";

	},


	show_info: function(str) {

		var info_ele = document.querySelector("#info");

		info_ele.innerHTML = str;
		info_ele.style.display = 'block';

		setTimeout(function() {
			info_ele.style.display = 'none';
			info_ele.innerHTML = '';
		}, 3000);

	},

	// helper functions

	int_to_time: function(str) {

		var rawsecs = parseInt(str);

		var minutes = Math.floor(rawsecs / 60);
		var seconds = Math.ceil(rawsecs % 60);

		if (seconds < 10) {
			seconds = '0' + seconds;
		}

		return minutes+":"+seconds;

	},

	time_to_int: function(str) {
		var thing = str.split(":");
		return (parseInt(thing[0]) * 60) + parseInt(thing[1]);
	},

	width_over: function(ele) {
		if (ele.prop('scrollWidth') > ele.width()) {
			return true;
		} else {
			return false;
		}
	},


	set_cuetime: function(evt) {
		evt.stopPropagation();

		var id = evt.target.parentNode.id;
		var name = document.querySelector('#'+id+' .name').innerHTML;

		console.log("set_cuetime", id, name);
		return;


		nw.Window.open('settime.html', 
					  {
						  width: 450,
						  height: 540,
						  focus: true,
						  frame: true,
						  position: 'mouse'
					  },
					  function (win) {
						  win.on('loaded', function() {
							error.note("getting time window: "+id+" '"+name+"'");
							win.window.setup(id, name);
						  });


					  });
		e.stopPropagation();
		


	},


	do_stopclock: function() {
		sm.stopclock = Date.now() / 1000;
	},


	undo_stopclock: function() {
		var diff = (Date.now() / 1000) - sm.stopclock;

		for (id in cart.carts) {
			if (cart.carts[id].start_at != 0 &&
				cart.carts[id].start_at != undefined) {
				cart.carts[id].start_at += diff;
			}
		}

		sm.stopclock = 0;
	
	},

	update_cartstate: function(id, txt) {
		var qs;

		if (id != false) {
			qs = '#'+id+' .state';
		} else {
			qs = "#carts .cart .state";
		}

		document.querySelector(qs).innerHTML = txt;


	}






};
