

var sm = {
	
	PAUSE:        "&#xf04c;",
	PLAY:         "&#xf04b;",
	SILENCE_FILE: 'CARTAMOC.SILENCE',

	loaded: false,
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
				$('#'+id+' .state').html('');
				delete cart.carts[id].start_at;
			} else {

				var diff = cart.carts[id].start_at - (Date.now() / 1000);


				if (diff <= 0) { // if we're past cue time, fire cue

					if (prefs.cue_command != "") {
						sm.do_cue_fire(id);
					} else {
						sm.load_cart_id(id, true);
					}

					delete cart.carts[id].start_at;

				} else { // otherwise, update display
					$('#'+id+' .state').html("Cued In: "+sm.int_to_time(diff));
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
		var id    = $(this).attr('id');
		sm.load_cart_id(id, false);
	},

	load_cart_id: function(id, autoplay) {

		var files = cart.getCartFiles(id);
		files.push(sm.silence_file); // add slience file to detect end of cart

		$("#carts .state").html('');

		$('#'+id+' .state').html("Loading");
		mpl.stop(function() {
			mpl.loadlist(files, function() {
				$('#'+id+' .state').html("Loaded");
				$('#carts .cart').removeClass("loaded");
				$('#'+id).addClass("loaded");
				sm.loaded = id;
				if (autoplay == true) {
					mpl.playpause();
				}
			});
		});



	},

	add_cart: function(evt) {


		var file_ui = $(this).val();
		$(this).val('');


		cart.load(file_ui, function(id) {

			var info = cart.getCartInfo(id);

			var canvas = "<div id='"+id+"' class='cart'>"+
						 "<div class='name'>"+info.name+"</div>"+
						 "<div class='state'></div>"+
						 "<div class='time'></div>"+
						 "<div class='timeset icon'>&#xf017;</div>"+
						 "</div>";

			$("#carts > div").append(canvas);

			cart.runtime(id, function(id) {
				var time = sm.int_to_time(cart.getCartInfo(id).runtime);
				$("#"+id+" div.time").html(time);

			});

			$("#"+id).on('click', sm.load_cart);
			$("#"+id+" .timeset").on('click', sm.set_cuetime);

		});

	},

	eject: function() {

		if (sm.loaded == false) {
			sm.show_info("No cart loaded.");
		} else {

			mpl.loadfile(sm.silence_file, false, true, function() {
				$("#"+sm.loaded).remove();
				cart.unload(sm.loaded);
				sm.loaded = false;
			});

		}
	},

	update_cart_display: function() {

		/* Cart Name Management */
		if (sm.loaded == false) {
			$(".cartname").html("Stopped");
		} else {
			if ($(".cartname").text() != cart.getCartInfo(sm.loaded).name) {
				$(".cartname").remove();
				$("#display").append("<p class='cartname'>"+
									 cart.getCartInfo(sm.loaded).name+
									 "</p>");
				$(".cartname").animateOverflow(overflow_opts);
			}
		}
	},

	clear_track_display: function() {

		$(".trackname").html("");
		$(".tracknum").css("display", "none");
		$("#display .time").html("");
		$("#display .bar .fill").css("width", "0%");
		$("#play").html(sm.PLAY);

	},

	update_track_display: function() {

		$("#play").html((mpl.state.pause == "no") ? sm.PAUSE : sm.PLAY);

		// determine title and show

		var trackname = mpl.state.filename;

		if (cart.carts[sm.loaded].single == true) {
			trackname = '';
		} else if (mpl.state.meta_title != "") {
			trackname = mpl.state.meta_title;
		}

		if (trackname != $("p.trackname").text()) {
			$("p.trackname").remove();
			$("#display").append("<p class='trackname'>"+
								 trackname+
								 "</p>");
			$("p.trackname").animateOverflow(overflow_opts);
		}


		// show track numbering
		$(".tracknum .t").html(cart.carts[sm.loaded].files.indexOf(
				sm.path.basename(mpl.state.filename)) + 1
		);
		$(".tracknum .o").html(cart.getCartFiles(sm.loaded).length);
		$(".tracknum").css("display", "block");


		// time remaining // FIXME min/secify
		$("#display .time").html(sm.int_to_time(parseInt(mpl.state.length) - 
												  parseInt(mpl.state.time_position)));


		// fill bar
		var myperc = (mpl.state.time_position / mpl.state.length) * 100;
		$("#display .bar .fill").css("width", myperc+"%");

	},


	show_info: function(str) {

		$("#info").html(str);

		$("#info").fadeIn(500, function() {
			setTimeout(function() {
							$("#info").fadeOut(500);
			}, 3000);
		});

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


	set_cuetime: function(e) {

		var id = $(this).parent().attr('id');
		var name = $('#'+id+' .name').html();

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
		


	}



};
