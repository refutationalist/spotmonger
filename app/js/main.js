
const PAUSE        = "&#xf04c;",
	  PLAY         = "&#xf04b;",
	  SILENCE_FILE = 'CARTAMOC.SILENCE',
	  CONFIG_FILE  = process.env.HOME+"/.spotmongerrc"; // convenience defines



const overflow_opts = {
						animation: 'pingpong',
						step_speed: 20,
						delay:      5000
				    }; // overflow display options





// instances
var cart = new CartFiles();
var mpl  = false; // needs to be instanced after reading prefs

var sm = { };

sm.loaded = false;

// windows
sm.time_window  = false;

// window open flags -- detecting windows in NW is non-obvious, so here's Yet Another Hack.
sm.time_open  = false;


// data
sm.silence_file = process.cwd()+'/silence.mp3';
/* The silence file is a placeholder file so I know I've reached the
   end of a cart.   CHEEEEAP HAAAAACK! */

// nw bits
sm.path = require('path');



sm.init = function() {


	var ports = (prefs.jack_noconnect) ? "noconnect" : prefs.jack_ports;

	mpl  = new MPlayerControl("/usr/bin/mplayer", ports);
	mpl.report_error  = error.report;
	cart.report_error = error.report;


	mpl.init(function() { 
		error.note("In main init");
		setInterval(sm.loop, 500);
		sm.loop();
		nw.Window.get().show();
		
	});



	// element bindings
	$("#startload").click(function() {
		$("#file_load").trigger("click");
	});
	$("#file_load").change(sm.add_cart);
	$("#eject").click(sm.eject);
	$("#next").click(function() { mpl.next();      });


	$("#prev").click(function() { 
		if (sm.loaded != false) {
		
			var pos = cart.getCartInfo(sm.loaded).files.indexOf(mpl.state.filename);

			if (pos == 0) {
				mpl.seek(0, 1);
			} else {
				mpl.previous();  
			}
		}
	});


	$("#play").click(function() { 
		if (sm.loaded != false &&
			mpl.state.meta_title == SILENCE_FILE) {

			sm.load_cart_id(sm.loaded, true);
		} else {
			mpl.playpause(); 
		}

	});


	/* FIXME: reimplement statefile
	if (sm.config.state_file != "") {

		setInterval(function() {

			try {
				var dumpstate = mpl.state;

				dumpstate.loaded = sm.loaded
				dumpstate.carts  = cart.carts;

				

				require('fs').writeFileSync(sm.config.state_file,
											JSON.stringify(dumpstate, null, 4));
			} catch (e) {
				error.report("State File Error: "+e);
			}
		}, 500);


	}
	*/



	process.on('uncaughtException', error.report);
	nw.Window.get().on('close', function() {
		sm.exit_handler();
		this.close(true);
	});



}


sm.loop = function() {


	// manage display

	sm.update_cart_display();

	if (mpl.state.meta_title == SILENCE_FILE ||
		mpl.state.meta_title == undefined ||
		sm.loaded == false) {

		sm.clear_track_display();

	} else {
		sm.update_track_display();
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

				if (prefs.cue_command != "") {

					sm.do_cue_fire(id);

				} else {
					sm.load_cart_id(id, true);
				}



				delete cart.carts[id].start_at;

			} else {
				$('#'+id+' .state').html("Cued In: "+sm.int_to_time(diff));
			}


		}


	}

}

sm.do_cue_fire = function(id) {
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
}


sm.set_cuetime = function(e) {


	if (sm.time_open == false) {

		var id = $(this).parent().attr('id');
		var name = $('#'+id+' .name').html();

		error.note("Getting Time Window", id, name);

		//sm.time_window = sm.gui.Window.open('settime.html',
		sm.time_window = nw.Window.open('settime.html', 
										  {
											  width: 450,
											  height: 540,
											  focus: true,
											  frame: true,
											  position: 'mouse'
										  }
										 );

		//sm.time_window.on('loaded', function() {
		nw.Window.get(sm.time_window).on('loaded', function() {
			sm.time_window.window.set_info(id, name, cart);
			if (cart.carts[id].start_at) 
				sm.time_window.window.set_time(cart.carts[id].start_at);

		});

		//sm.time_window.on('close', function() {
		nw.Window.get(sm.time_window).on('close', function() {
			sm.time_open = false;
			this.close(true);
		});



	}

	e.stopPropagation();

}

// subsystem management

sm.exit_handler = function() {
	error.note("in cleanup");
	cart.cleanup();
	mpl.quit();
}

sm.load_cart = function(evt) {
	var id    = $(this).attr('id');
	sm.load_cart_id(id, false);
}

sm.load_cart_id = function(id, autoplay) {

	var files = cart.getCartFiles(id);
	files.push(sm.silence_file);


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


}


sm.add_cart = function(evt) {

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

}


sm.eject = function() {

	if (sm.loaded == false) {
		sm.show_info("No cart loaded.");
	} else {

		mpl.loadfile(sm.silence_file, false, true, function() {
			$("#"+sm.loaded).remove();
			cart.unload(sm.loaded);
			sm.loaded = false;
		});

	}

}

sm.update_cart_display = function() {

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

}

sm.clear_track_display = function() {

	$(".trackname").html("");
	$(".tracknum").css("display", "none");
	$("#display .time").html("");
	$("#display .bar .fill").css("width", "0%");
	$("#play").html(PLAY);

}

sm.update_track_display = function() {

	$("#play").html((mpl.state.pause == "no") ? PAUSE : PLAY);

	// determine title and show

	var trackname = mpl.state.filename;

	if (cart.carts[sm.loaded].single == true) {
		trackname = '';
	} else if (mpl.state.meta_title != "") {
		trackname = mpl.state.meta_title;
	}
	/*
	var trackname = (mpl.state.meta_title == "") ? 
					sm.path.basename(mpl.state.filename) :
					mpl.state.meta_title;
					*/

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

}


sm.show_info = function(str) {

	$("#info").html(str);

	$("#info").fadeIn(500, function() {
		setTimeout(function() {
						$("#info").fadeOut(500);
		}, 3000);
	});

}

// helper functions

sm.int_to_time = function(str) {

	var rawsecs = parseInt(str);

	var minutes = Math.floor(rawsecs / 60);
	var seconds = Math.ceil(rawsecs % 60);

	if (seconds < 10) {
		seconds = '0' + seconds;
	}

	return minutes+":"+seconds;

}

sm.time_to_int = function(str) {
	var thing = str.split(":");
	return (parseInt(thing[0]) * 60) + parseInt(thing[1]);
}

sm.width_over = function(ele) {
	if (ele.prop('scrollWidth') > ele.width()) {
		return true;
	} else {
		return false;
	}
}	




// now, talk to jquery.

$(document).ready(function() {
	// bind prefs
	prefs.load();
	$("#conf").click(function() { prefs.pop(); error.report("calling prefs"); });


	sm.init();


	
	$("#flog").click(function () {
		error.note("note FLOG!");
		process.stdout.write("WOOOOO\n");
		error.report("report Flog!");

	});


	nw.Window.get().show();
	


});

