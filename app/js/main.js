


const PAUSE        = "&#xf04c;",
	  PLAY         = "&#xf04b;",
	  SILENCE_FILE = 'CARTAMOC.SILENCE'; // convenience defines



const overflow_opts = {
						animation: 'pingpong',
						step_speed: 20,
						delay:      5000
				    }; // overflow display options

var errors = new Array(); // errors from mplayer
var errors_suppress = false;


$(document).ready(function() {


	// subsystems
	var mpl;     			    // media player control object
	var cart = new CartFiles(); // cart file manager object
	var path = require('path'); // node path object
	var gui  = require('nw.gui');

	// data
	var loaded       = false;	                      // loaded cart flag
	var silence_file = process.cwd()+"/silence.mp3";
	/* The silence file is a placeholder file so I know I've reached the
	   end of a cart.   CHEEEEAP HAAAAACK! */

	console.log("silence_file", silence_file);

	// windows
	var log_window;
	var time_window;



	// setup
	mpl  = new MPlayerControl("/usr/bin/mplayer", "test.*meter_[1-2]");
	mpl.report_error  = report_error;
	cart.report_error = report_error;


	mpl.init(function() { 
		console.log("In main init");
		setInterval(loop, 100);
		loop();

		gui.Window.get(window).show();
		window.resizeTo(700, 240);
		
	});


	$("#conf").click(function() {
		show_errorwindow();
	});

	// element bindings
	$("#startload").click(function() {
		$("#file_load").trigger("click");
	});
	$("#file_load").change(add_cart);
	$("#eject").click(eject);
	$("#next").click(function() { mpl.next();      });


	$("#prev").click(function() { 
		if (loaded != false) {
		
			var pos = cart.getCartInfo(loaded).files.indexOf(mpl.state.filename);

			if (pos == 0) {
				mpl.seek(0, 1);
			} else {
				mpl.previous();  
			}
		}
	});


	$("#play").click(function() { 
		if (loaded != false &&
			mpl.state.meta_title == SILENCE_FILE) {

			load_cart_id(loaded, true);
		} else {
			mpl.playpause(); 
		}

	});


	/* FIXME shit don't work right now * /
	process.stdin.resume();
	process.on('exit',              exitHandler);
	process.on('SIGINT',            exitHandler);
	process.on('uncaughtException', exitHandler);
	// */
	gui.Window.get().on('close', function() {
		exit_handler();
		this.close(true);
	});

	//setInterval(function(){console.log(mpl.state);},1000);


	function loop() {

		// manage display

		update_cart_display();

		if (mpl.state.meta_title == SILENCE_FILE ||
			mpl.state.meta_title == undefined ||
			loaded == false) {

			clear_track_display();

		} else {
			update_track_display();
		}


		// manage scheduling


		for (id in cart.carts) {

			if (cart.carts[id].start_at == undefined) continue;

			if (cart.carts[id].start_at == 0) {

				$('#'+id+' .state').html('');
				delete cart.carts[id].start_at;

			} else {

				var diff = cart.carts[id].start_at - (Date.now() / 1000);
				if (diff <= 0) {
					load_cart_id(id, true);
					delete cart.carts[id].start_at;

				} else {
					$('#'+id+' .state').html("Cued In: "+int_to_time(diff));
				}


			}


		}

	}



	// window interactions & error handling

	function report_error(line) {
		var d = new Date();
		errors.push(d.toString() + " " + line);
		console.error("REPORT_ERROR", line);

		if (errors_suppress == true) {
			show_info("Error encountered.  Check logs for more info.");
		} else {
			show_errorwindow();
		}

	}


	function show_errorwindow() {


		if (log_window && !logs.closed) {
			log_window.put_logs();
		} else {

			var log_window = window.open('errlog.html',{
				"position": "center",
				"resizable": false,
				"focus": false,
				"toolbar": false,
				"frame": false,
				"height": 400,
				"width": 470
			  });

			log_window.onload = function() {
				log_window.resizeTo(470, 400);
			}

		}
	}


	function set_cuetime(e) {

		if (time_window == undefined ||
			time_window.closed) {

			var id = $(this).parent().attr('id');
			var name = $('#'+id+' .name').html();

			console.log("Getting Time Window", id, name);

			time_window = window.open('settime.html',
									  {
										  "resizable": false,
										  "focus":     true,
										  "toolbar":   false,
										  "frame":     false,
										  "height":    540,
										  "width":     450
									  });

			time_window.onload = function() {
				time_window.resizeTo(450, 540);
				time_window.set_info(id, name, cart);

				if (cart.carts[id].start_at) 
					time_window.set_time(cart.carts[id].start_at);
			}.bind(this);


		}

		e.stopPropagation();

	}


	function exit_handler() {
		console.log("in cleanup");
		cart.cleanup();
		mpl.quit();
	}

	// cart loading

	
	function load_cart(evt) {
		var id    = $(this).attr('id');
		load_cart_id(id, false);
	}

	function load_cart_id(id, autoplay) {
		var files = cart.getCartFiles(id);
		//files.push("silence.mp3");
		files.push(silence_file);


		$("#carts .state").html('');

		$('#'+id+' .state').html("Loading");

		mpl.loadlist(files, function() {
			$('#'+id+' .state').html("Loaded");
			$('#carts .cart').removeClass("loaded");
			$('#'+id).addClass("loaded");
			loaded = id;
			if (autoplay == true) {
				mpl.playpause();
			}
		});

	}



	function add_cart(evt) {
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
					var time = int_to_time(cart.getCartInfo(id).runtime);
					$("#"+id+" div.time").html(time);

				});

				$(".cart").unbind('click');
				$(".cart").on('click', load_cart);
				$(".cart .timeset").on('click', set_cuetime);

			});


	}

	
	function eject() {

		if (loaded == false) {
			show_info("No cart loaded.");
		} else {

			mpl.loadfile(silence_file, false, true, function() {
				$("#"+loaded).remove();
				cart.unload(loaded);
				loaded = false;
			});

		}

	}


	// display management functions

	function update_cart_display() {
		/* Cart Name Management */
		if (loaded == false) {
			$(".cartname").html("Stopped");
		} else {
			if ($(".cartname").text() != cart.getCartInfo(loaded).name) {
				$(".cartname").remove();
				$("#display").append("<p class='cartname'>"+
									 cart.getCartInfo(loaded).name+
									 "</p>");
				$(".cartname").animateOverflow(overflow_opts);
			}
		}
	}
		

	function clear_track_display() {
		$(".trackname").html("");
		$(".tracknum").css("display", "none");
		$("#display .time").html("");
		$("#display .bar .fill").css("width", "0%");
		$("#play").html(PLAY);
	}


	function update_track_display() {


		$("#play").html((mpl.state.pause == "no") ? PAUSE : PLAY);

		// determine title and show
		var trackname = (mpl.state.meta_title == "") ? 
						path.basename(mpl.state.filename) :
						mpl.state.meta_title;

		if (trackname != $("p.trackname").text()) {
			$("p.trackname").remove();
			$("#display").append("<p class='trackname'>"+
								 trackname+
								 "</p>");
			$("p.trackname").animateOverflow(overflow_opts);
		}


		// show track numbering
		$(".tracknum .t").html(cart.carts[loaded].files.indexOf(
				path.basename(mpl.state.filename)) + 1
		);
		$(".tracknum .o").html(cart.getCartFiles(loaded).length);
		$(".tracknum").css("display", "block");


		// time remaining // FIXME min/secify
		$("#display .time").html(int_to_time(parseInt(mpl.state.length) - 
											 parseInt(mpl.state.time_position)));


		// fill bar
		var myperc = (mpl.state.time_position / mpl.state.length) * 100;
		$("#display .bar .fill").css("width", myperc+"%");


	}



	// helper functions

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
		var thing = str.split(":");
		return (parseInt(thing[0]) * 60) + parseInt(thing[1]);
	}


	function width_over(ele) {

		if (ele.prop('scrollWidth') > ele.width()) {
			return true;
		} else {
			return false;
		}
	}

	function show_info(str) {

		$("#info").html(str);

		$("#info").fadeIn(500, function() {
			setTimeout(function() {
							$("#info").fadeOut(500);
			}, 3000);
		});
	}





});
 
