var sm; // so it can be called by settime


document.addEventListener("DOMContentLoaded", function() {


	try {
		var cp = require('child_process');

		var tar = cp.execSync('which tar', { encoding: 'utf8' }).trim();
		var mplayer = cp.execSync('which mplayer', { encoding: 'utf8' }).trim();
		var ffprobe = cp.execSync('which ffprobe', { encoding: 'utf8' }).trim();

		var data_path = nw.App.dataPath;

	} catch (e) {
		process.stderr.write(sprintf("Can't find needed binary: %s", e.message));
		nw.App.quit();
	}

	process.stderr.write(sprintf("Commands:\n\ttar: %s\n\tmplayer: %s\n\tffprobe: %s\n\tdp: %s\n\n", 
								 tar, mplayer, ffprobe, data_path));


	var emitter = new (require('events')).EventEmitter();

		
	// app initialization
	prefs.load();

	console.log(prefs.data);



	sm = Spotmonger_Control({
								tar: tar,
								mplayer: mplayer,
								ffprobe: ffprobe,
								error: error,
								emitter: emitter,
								prefs: prefs.data
	});


	if (sm == false) {
		process.stderr.write("can't init Spotmonger_Control\n");
		nw.App.quit();
	}

	require("nw.gui").Window.get().setResizable(false);

	
	process.on('uncaughtException', error.report);
	nw.Window.get().on('closed', function() {
		sm.destruct();
		error.note("exit complete.");
	});

	nw.Window.get().show();

	document.getElementById('sndboard').addEventListener("click", function() {
		var main_e = document.getElementById('main');
		var win = nw.Window.get();

		if (main_e.classList.contains('soundboard')) {
			win.hide();
			main_e.classList.remove('soundboard');
			win.unmaximize();
			this.classList.remove('pressed');
			win.resizeTo(820, 240);
			win.title = "SpotMonger";
			document.title = "SpotMonger";
			win.setResizable(false);
			win.show();

			
		} else {
			win.hide();
			main_e.classList.add('soundboard');
			this.classList.add('pressed');
			win.setResizable(true);
			win.maximize();
			win.title = "SpotMonger -- SoundBoard Mode";
			document.title = "SpotMonger -- SoundBoard Mode";
			win.show();
			
			
		}


	});
	
	
	document.querySelector("#startload").addEventListener("click", function() {
		document.querySelector("#file_load").click();
	});

	document.querySelector("#file_load").addEventListener("change", function(evt) {
		evt.target.value.split(';').forEach(function(thing) {
			sm.add(thing);
		});

		evt.target.value = '';
	});

	document.querySelector("#stopclock").addEventListener("click", function() {
		var main_e = document.getElementById('main');
		var scb_e  = document.getElementById('stopclock');

		if (main_e.classList.contains('stopclock')) {
			main_e.classList.remove('stopclock');
			sm.unpause_cue();
			scb_e.classList.remove('pressed');
		} else {
			main_e.classList.add('stopclock');
			sm.pause_cue();
			scb_e.classList.add('pressed');
		}
	
	});

	document.querySelector("#conf").addEventListener("click", function() { prefs.pop(); });
	document.querySelector("#eject").addEventListener("click", sm.eject);
	document.querySelector("#next").addEventListener("click", sm.next);
	document.querySelector("#prev").addEventListener("click", sm.prev);
	document.querySelector("#play").addEventListener("click", sm.playpause);



	emitter.on('SM_add', function(info) {
		//console.log("SM_add rx", info.id);

		var new_div = document.createElement('div');
		new_div.className = 'cart';
		new_div.id = info.id;
		new_div.insertAdjacentHTML('afterbegin', sprintf("<div class='name'>%s</div>"+
														 "<div class='state'></div>"+
														 "<div class='time'>%s</div>"+
														 "<div class='timeset icon'>&#xf017;</div>", info.name, info.runtime));


		new_div.addEventListener('click', function() { 

			var autoplay = (document.getElementById('main').classList.contains('soundboard')) ? true : false;

			sm.load(info.id, autoplay); 
			
		});



		new_div.querySelector('div.timeset').addEventListener('click', function(evt) {


			var id = evt.target.parentNode.id;
			var name = document.querySelector('#'+id+' .name').innerHTML;


			nw.Window.open('settime.html', 
						  {
							  width: 450,
							  height: 540,
							  focus: true,
							  frame: true,
							  position: 'mouse',
							  title: "SpotMonger Time Select"
						  },
						  function (win) {
							  win.on('loaded', function() {
								error.note("getting time window: "+id+" '"+name+"'");
								win.window.setup(id, name, sm.get_cue(id));
							  });


						  });
			evt.stopPropagation();

		});
		
		document.querySelector("#carts > div").appendChild(new_div);
		
	});

	emitter.on('SM_eject', function(id) {
		//console.log('SM_eject rx', id);
		var ele = document.getElementById(id);
		ele.parentNode.removeChild(ele);
	});

	emitter.on('SM_warn', function(txt) {
		//console.log('SM_warn rx', txt);
		warn.do(txt);

	});

	emitter.on('SM_load', function(id) {
		//console.log('SM_load rx', id);
		document.querySelectorAll("#carts .cart").forEach(function (e) { e.classList.remove("loaded"); });
		document.getElementById(id).classList.add("loaded");
	});


	emitter.on('SM_display', function(info) {
		//console.log('SM_display', info);
		/*
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
		*/

		//document.getElementById('play').innerHTML = (info.state == 'PAUSED') ? "&#xf04b;" : "&#xf04c;";

		var play_ele = document.getElementById('play');
		var main_ele = document.getElementById('main');

		if (info.state != 'PAUSED' && !(main_ele.classList.contains('playing')) ) {
			main_ele.classList.add('playing');
			play_ele.innerHTML = "&#xf04c;";
		} else if (info.state == 'PAUSED' && main_ele.classList.contains('playing')) {
			main_ele.classList.remove('playing');
			play_ele.innerHTML = "&#xf04b;";
		}

		var cartname_ele   = document.querySelector(".cartname");
		var trackname_ele  = document.querySelector("p.trackname");
		var tracknum_ele   = document.querySelector(".tracknum");
		var tracknum_t_ele = document.querySelector(".tracknum .t");
		var tracknum_o_ele = document.querySelector(".tracknum .o");
		var time_ele       = document.querySelector("#display .time");
		var fill_ele       = document.querySelector("#display .bar .fill");


		if (info.cart == undefined || (cartname_ele.innerText.trim() != info.cart.trim()))
			cartname_ele.innerHTML = info.cart;

		if (info.track == undefined || (trackname_ele.innerText.trim() != info.track.trim()))
			trackname_ele.innerHTML = info.track;


		if (info.cart_length == 0) {
			tracknum_ele.style.display = 'none';
		} else {
			tracknum_t_ele.innerHTML = info.cart_position;
			tracknum_o_ele.innerHTML = info.cart_length;
			tracknum_ele.style.display = 'block';
		}

		time_ele.innerHTML = (info.track_remain != 0) ? info.track_remain : '';

		if (info.percentage < 0) {
			info.percentage = 0;
		} 

		fill_ele.style.width = info.percentage + '%';


		// If Not in soundboard mode AND
		// 		if (is not single) and (non-zero track length) and ((last 20 seconds of 2nd to last track) or (is last track))
		// 		if (is single) and (last 20 seconds of track and track length non-zero)
		//
		//

		if (prefs.data.end_warning == true) {

			if (!main_ele.classList.contains('soundboard')) {

				if (  
					 ( (info.cart_length != 1) && ( info.track_remain_s != 0) &&
						(
						   (info.cart_position == (info.cart_length - 1) && info.track_remain_s <= 20) ||
						   (info.cart_position == info.cart_length)
						)
					 ) ||
					 ( (info.cart_length == 1) && ( (info.track_remain_s <= 20) && info.track_remain_s != 0 ) )
					) {


					if (!main_ele.classList.contains('ending_soon')) main_ele.classList.add('ending_soon');



				} else {

					if (main_ele.classList.contains('ending_soon')) main_ele.classList.remove('ending_soon');

				}
			} else {
				if (main_ele.classList.contains('ending_soon')) main_ele.classList.remove('ending_soon');
			}
		}


	});


	emitter.on('SM_cartstate', function(id, txt) {
		//console.log("SM_cartstate rx", id, txt);

		if (id == false) {
			document.querySelectorAll("#carts .cart .state").forEach(function(ele) {
				ele.innerHTML = txt;
			});
		} else {
			document.querySelector('#'+id+' .state').innerHTML = txt;
		}

	});



});


