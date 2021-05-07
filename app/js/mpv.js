

class mpv  {


	flags = [ 
		'--no-video',
		'-term-status-msg=',
		'--no-input-terminal',
		'--idle',
		'--no-video',
		'--audio-channels=stereo',
		'--ao=jack'
	];

	/* flags specified per instance 
		--jack-name=%s
		--jack-port=%s
		--input-ipc-server=
	*/

	// State data
	state = {
		calc: { },
		metadata: { },
		statistics: { },
		playlist: { },
		percent: 0,
		timePos: 0
	};

	// callback registrations
	callBacks = { };
	idlePause = false;


	// Connections
	child = null;
	socket = null;
	socketName = null;

	error(txt) {
		console.error("mpv ERROR:", txt);
	}

	// these functions populate state information regarding the player
	// we set these up as observable properties, and MPV uses the
	// int IDs to associate changes with events
	observables = {
		20563: {
			name: "metadata",
			action: function(json) {
				// metadata_prop
				let newmeta = { };

				for (const x in json.data) {
					newmeta[x.toLowerCase()] = json.data[x];
				}

				if (typeof newmeta.disc != 'undefined') {
					newmeta.disc = parseInt(newmeta.disc);
				}

				if (typeof newmeta.track != 'undefined' && newmeta.track.includes('/')) {
					let newtrack = newmeta.track.split('/');
					newmeta.track = parseInt(newtrack[0]);
					newmeta.disc = parseInt(newtrack[1]);
				}

				if (typeof newmeta.date != 'undefined') {
					newmeta.date = parseInt(newmeta.date);
				}



				this.state.metadata = newmeta;
				this.callBacks.metadata(this.state);
			}.bind(this)

		},
		21081: {
			name: "stream-open-filename",
			action: function(json) {
				// filename_prophttps://www.google.com/search?client=firefox-b-1-d&q=javascript+explode
				this.state.filename = json.data;
			}.bind(this)
		},
		34739: {
			name: "file-format",
			action: function(json) {
				// fileformat_prop
				this.state.statistics.fileFormat = json.data;
			}.bind(this)
		},
		24066: {
			name: "audio-codec",
			action: function(json) {
				// codec_prop
				this.state.statistics.codec = json.data;
			}.bind(this)
		},
		39292: {
			name: "audio-codec-name",
			action: function(json) {
				// codecname_prop
				this.state.statistics.codecName = json.data;
			}.bind(this)
		},
		29685: {
			name: "audio-params",
			action: function(json) {
				// audioparams_prop
				this.state.statistics.sampleRate = json.data.samplerate;
				this.state.statistics.channels = json.data["channel-count"];
				this.state.statistics.layout = json.data.channels;
				this.state.statistics.format = json.data.format;
			}.bind(this)
		},
		21232: {
			name: "audio-bitrate",
			action: function(json) {
				// bitrate_prop
				
				if (typeof this.state.calc.total == 'undefined')
					this.state.calc.total = this.state.calc.count = 0;

				this.state.calc.count++;
				this.state.calc.total += json.data;

				this.state.avg_bitrate = Math.ceil(this.state.calc.total / this.state.calc.count);
				this.state.bitrate = json.data;

			}.bind(this)
		},
		29846: {
			name: "duration",
			action: function(json) {
				// duration_prop
				this.state.statistics.duration = json.data;
			}.bind(this)
		},
		22719: {
			name: "playlist",
			action: function(json) {
				// playlist_prop
				this.state.playlist = json.data;
				this.callBacks.statistics(this.state);
			}.bind(this)
		},
		23992: {
			name: "percent-pos",
			action: function(json) {
				// percent_prop
				this.state.percent = parseFloat(json.data);
			}.bind(this)
		},
		39218: {
			name: "audio-pts",
			action: function(json) {
				// timepos_prop
				this.state.timePos = parseFloat(json.data);
			}.bind(this)
		},
		39754: {
			name: "playtime-remaining",
			action: function(json) {
				// playtime_prop
				this.state.remaining = parseFloat(json.data);
			}.bind(this)
		}
	};


	constructor(userOptions = {}) {

		let options = Object.assign(
			{ },
			{	
				bin:  "/usr/bin/mpv",
				name: "nodempv",
				ports: "system:playback.*",
				noconnect: false,
				idlePause: false,
				metadata: function() {
					console.log("mpv: metadata updated");
				},
				statistics: function() {
					console.log("mpv: statistics updated");
				}
			},
			userOptions
		);

		

		this.callBacks.metadata = options.metadata;
		this.callBacks.statistics = options.statistics;
		this.idlePause = options.idlePause;

		console.debug("mpv: starting");

		// MAKE SOCKET NAME
		const process = require('process');
		const os = require('os');
		let pid = process.pid;
		this.socketName = os.tmpdir() + `/.mpv-${options.name}-${pid}.socket`;
		console.debug(`mpv: socket: ${this.socketName}`);

		// CALL THE DESTRUCTOR ON EXIT
		process.on('exit', function() {
			this.destructor();
		}.bind(this));

		// MAKE USEFUL FLAGS
		let f = this.flags;
		f.push(
			`--jack-name=${options.name}`,
			`--jack-port=${options.ports}`,
			`--input-ipc-server=${this.socketName}`
		);

		if (options.noconnect) {
			f.push("--jack-connect=no");
		}
		console.debug("mpv: flags", f);


		// START MPV
		const cp = require('child_process');
		this.child = cp.spawn(
			options.bin,
			f,
			{ }
		)
			.on('error', function(data) {
				this.error("mpv likely fatal error: "+ Buffer.from(data).toString('utf8'));
			}.bind(this))

			.on('exit', function() {
				console.debug("mpv: mpv exited");
				// don't know yet.
			}.bind(this));


		this.child.stdout.on('data', function(data) {
			console.info("mpv stdout: " + Buffer.from(data).toString('utf8'));
		}.bind(this));
		this.child.stderr.on('data', function(data) {
			this.error("mpv stderr: " + Buffer.from(data).toString('utf8'));
		}.bind(this));

		// WAIT FOR SOCKET
		// FIXME some sort of timeout is in order here
		const fs = require('fs');
		let exists = false;
		do {
			exists = fs.existsSync(this.socketName);
		} while (exists == false);

			


		// CONNECT TO SOCKET
		const net = require('net');
		this.socket = net.createConnection(this.socketName)
			.on('connect', function(stuff) {
				this.setupObservables();
				//if (this.idlePause) this.pause(null);
			}.bind(this))
			.on('data', function(data) {
				let lines = data.toString().trim().split("\n");
				for (const x in lines) {
					this.incoming(JSON.parse(lines[x]));
				}
			}.bind(this))
			.on('error', function(data) {
				console.error("mpv socket error!");
				this.destructor();
			}.bind(this));


	}

	destructor() {

		const fs = require('fs');
		console.debug("mpv: ending");
		this.child.kill('SIGINT');
		// disconnect socket here
		this.socket.dd

		fs.unlinkSync(this.socketName);
	}


	// setup the observable properties
	setupObservables() {
		console.debug("mpv: setting up observables");

		for (const x in this.observables) {


			let tosend = JSON.stringify({
				command: [
					"observe_property", parseInt(x), this.observables[x].name
				]
			}) + "\n";
			this.socket.write(tosend);10000 + Math.floor(Math.random(10000) * 10000)

		}

	}


	incoming(json) {
		//console.debug("incoming", json);

		if (typeof json.event != 'undefined') {
			if (json.event == "property-change") {
				if (typeof this.observables[json.id].action == "function" && typeof json.data != 'undefined')
					this.observables[json.id].action(json);
			} else {

				switch (json.event) {
					case "idle":
						this.state = {
							calc: { },
							metadata: { },
							statistics: { },
							playlist: { },
							percent: 0,
							timePos: 0
						};

						if (this.idlePause) this.pause(null);

						break;

					case "pause":
						this.state.paused = true;
						break;

					case "start-file":
					case "unpause":
						this.state.paused = false;
						break;

					default:
						console.debug("unhandled mpv event:", json);
						break;



				}
			}

		} else if (typeof json.request_id != 'undefined' 
			&& typeof this.callBacks[json.request_id] == 'function') {
			this.callBacks[json.request_id](this.state, json);
			delete this.callBacks[json.request_id];
		}
	}

	command(callback, ...args) {

		let id;
		do {
			id = 10000 + Math.floor(Math.random(10000) * 10000);
		} while (typeof this.callBacks[id] != 'undefined');

		if (typeof callback == 'function') {
			this.callBacks[id] = callback;
		}

		let cmd = JSON.stringify({
			command: args,
			request_id: id
		}) + "\n"
		console.log("mpv command:", cmd);
		console.debug("mpv send:", cmd);

		this.socket.write(cmd);

	}

	// no restart, just remake object

	pause(callback = null) {
		this.command(callback, "cycle", "pause");
	}

	// no stop in PHP version, there is "clear"
	clear(callback = null) {
		this.command(callback, "playlist-clear");
	}

	stop(callback = null) {
		this.command(callback, "stop");
	}
	

	next(callback = null) {
		this.command(callback, "playlist-next", "force");

	}

	previous(callback = null) {
		this.command(callback, "playlist-prev", "force");
	}


	load(file, callback = null, append = true) {

		if (append == true) {
		
		this.command(
			callback,
			"loadfile",
			file,
			"append"
		);

		} else {
			this.command(
				callback,
				"loadfile",
				file
			);


		}


	}

	playlist(files, callback = null) {

		if (files.length == 1) {
			this.load(files.shift(), callback, false);
		} else {
			this.load(files.shift(), null, false);
			let last = files.pop();
			for (const x in files) {
				this.load(files[x]);
			}
			this.load(last, callback);
		}
	}

	quit() {
		this.command(null, "quit");
		this.destructor();
	}

	seek(position, callback = null, type = "absolute") {
		this.command(
			callback,
			"seek",
			position,
			type
		);
	}




	

}


/*
console.log("hello.");
let player = new mpv({
	metadata: function(data) {
		console.log("MY METADATA", data);
	}
});
console.log("firing load");
//player.load("drunk.flac", function(data, json) { console.log("load callback worked", data, json); });

player.playlist(['drunk.flac', 'ostinato.flac'], function(data, json) { console.log("playlist loaded", data, json); });
console.log("load fired");

setInterval(function() {
	console.info(player.state);
	console.info(player.state.playlist);
}, 1000);

setTimeout(function() {
	console.log("exiting");
	process.exit(0);
}, 300000);


*/
