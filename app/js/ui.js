


var mpl, cart; // non-static objects that require instantiation

document.addEventListener("DOMContentLoaded", function() {

	// app initialization
	prefs.load();

	// start up mplayer
	var ports = (prefs.jack_noconnect) ? "noconnect" : prefs.jack_ports;
	mpl = new MPlayerControl("/usr/bin/mplayer", ports);

	// init carthandler subsystem
	cart = new CartFiles();

	document.querySelector("#conf").addEventListener("click", function() { prefs.pop(); });


	sm.init(); // initialize UI (static)



	mpl.init(function() { 
		error.note("In main init");
		setInterval(sm.loop, 500);
		sm.loop();
		nw.Window.get().show();
	}); // start up MPlayer Interactions, which call the UI loop

	
	// UI bindings
	//
	
	document.querySelector("#startload").addEventListener("click", function() {
		document.querySelector("#file_load").click();
	});

	document.querySelector("#file_load").addEventListener("change", sm.add_cart);
	document.querySelector("#eject").addEventListener("click", sm.eject);
	document.querySelector("#next").addEventListener("click", function() { mpl.next(); });


	document.querySelector("#prev").addEventListener("click", function() {
		if (sm.loaded != false) {
		
			var pos = cart.getCartInfo(sm.loaded).files.indexOf(mpl.state.filename);
			if (pos == 0) {
				mpl.seek(0, 1);
			} else {
				mpl.previous();  
			}
		}
	});


	document.querySelector("#play").addEventListener("click", function() {
		if (sm.loaded != false &&
			mpl.state.meta_title == sm.SILENCE_FILE) {

			sm.load_cart_id(sm.loaded, true);
		} else {
			mpl.playpause(); 
		}

	});




	document.querySelector("#stopclock").addEventListener("click", function() {
		//var main_e = document.getElementById("main");
		//
		document.getElementById('main').classList.toggle('stopclock');
		var stb_e  = document.getElementById("stopclock");

		if (sm.stopclock == false) {
			//main_e.classList.add("stopclock");
			stb_e.classList.add("pressed");
			sm.do_stopclock();
		} else {
			//main_e.classList.remove("stopclock");
			stb_e.classList.remove("pressed");
			sm.undo_stopclock();
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
	//nw.Window.setResizeable(false);
	require("nw.gui").Window.get().setResizable(false);
	nw.Window.get().show();
	


});


