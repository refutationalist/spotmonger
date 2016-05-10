
var mpl, cart; // non-static objects that require instantiation

const overflow_opts = {
						animation: 'pingpong',
						step_speed: 20,
						delay:      5000
				    }; // overflow display options



$(document).ready(function() {

	// app initialization
	prefs.load();

	// start up mplayer
	var ports = (prefs.jack_noconnect) ? "noconnect" : prefs.jack_ports;
	mpl = new MPlayerControl("/usr/bin/mplayer", ports);

	// init carthandler subsystem
	cart = new CartFiles();

	$("#conf").click(function() { prefs.pop(); });


	sm.init(); // initialize UI (static)



	mpl.init(function() { 
		error.note("In main init");
		setInterval(sm.loop, 500);
		sm.loop();
		nw.Window.get().show();
		
	}); // start up MPlayer Interactions, which call the UI loop

	
	// UI bindings
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
			mpl.state.meta_title == sm.SILENCE_FILE) {

			sm.load_cart_id(sm.loaded, true);
		} else {
			mpl.playpause(); 
		}

	});



	process.on('uncaughtException', error.report);
	nw.Window.get().on('closed', function() {
		error.note("cart cleanup");
		cart.cleanup();
		error.note("mplayer quit");
		mpl.quit();
		error.note("exit complete.");S
	});

	// finally, display the window
	nw.Window.get().show();
	


});


