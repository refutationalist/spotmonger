
var MPlayerControl = function(mplayer, ports) {
	this.mplayer         = mplayer;
	this.flags           = [ '-slave', '-idle', '-noconfig', 'all',  
							 '-quiet', '-nolirc', '-vo', 'null', '-demuxer', 'lavf',
							 '-channels', '2' ];
	this.status_interval = 100;

	this.online          = false;
	this.destruct		 = false;

	this.state           = { };
	this.command_send    = null;

	this.report_error = function(line) {
		alert(line);
	}


	if (ports == "noconnect") {
		this.flags.unshift("-ao", "jack:name=spotmonger:noconnect");
	} else {
		this.flags.unshift("-ao", "jack:name=spotmonger:port="+ports);
	}


	this.cp = require('child_process');

	this.process = null;


}


MPlayerControl.prototype.process_stderr = function(data) {
	this.report_error("STDERR: "+Buffer(data).toString('utf8'));
}

MPlayerControl.prototype.send_status_cmds = function() {

	try {
		this.process.stdin.write("pausing_keep_force get_file_name\n"+
								 "pausing_keep_force get_percent_pos\n"+
								 "pausing_keep_force get_time_pos\n"+
								 "pausing_keep_force get_time_length\n"+
								 "pausing_keep_force get_property pause\n"+
								 "pausing_keep_force get_meta_title\n"+
								 "pausing_keep_force get_meta_album\n"+
								 "pausing_keep_force get_meta_artist\n");
	} catch (e) {
		this.report_error(e);
	}


}

MPlayerControl.prototype.mpwrite = function(data) {
	try {
		return this.process.stdin.write(data+"\n");
	} catch (e) {
		console.error("mpwrite error", e);
	}
}


MPlayerControl.prototype.init = function(callback) {

	if (this.online == false) {

		var to_pass = this.flags;
		console.log("mplayer flags", to_pass);
		this.process = this.cp.spawn(this.mplayer, to_pass, { });
		
		


		// Process incoming data

		this.process.stdout.on('data', function(data) {


			var lines = Buffer(data).toString('utf8').split('\n');

			var regex = /^ANS_(\S+)=(.*)$/;

			for (l in lines) {
				var m = lines[l].match(regex);
				if (m != null) {
					m[2] = m[2].replace(/\'$/g, '').replace(/^\'/g, '');
					m[1] = m[1].toLowerCase();
					this.state[m[1]] = m[2];

				}
			}


		}.bind(this));

		// Process error data
		this.process.stderr.on('data', function(data) {
			this.report_error("STDERR: "+Buffer(data).toString('utf8'));
		}.bind(this));


		this.process.on('exit', function() {
			clearInterval(this.command_send);
			console.log("going into restart");
			if (!this.destruct) this.restart();
		}.bind(this));

		this.process.on('error', function(data) {
			console.log("mplayer error", data);
			this.report_error("mplayer error:"+data);
			clearInterval(this.command_send);
			if (!this.destruct) this.restart();
		}.bind(this));




			

		this.command_send = setInterval(this.send_status_cmds.bind(this), this.status_interval);
		this.mpwrite("pause");
		this.online = true;
		if (typeof(callback) == "function") callback();




	}

}

MPlayerControl.prototype.restart = function() {
	this.online = false;
	this.init();
}


MPlayerControl.prototype.playpause = function(callback) {
	this.mpwrite("pause");
	if (typeof(callback) == "function") callback();
}



MPlayerControl.prototype.stop = function(callback) {
	this.mpwrite("stop");
	if (typeof(callback) == "function") callback();
}


MPlayerControl.prototype.next = function(pausing, callback) {
	var cmd = "pt_step 1 force";
	if (pausing == true) cmd = "pausing "+cmd;
	this.mpwrite(cmd);
	if (typeof(callback) == "function") callback();
}

MPlayerControl.prototype.previous = function(pausing, callback) {
	var cmd = "pt_step -1 force";
	if (pausing == true) cmd = "pausing "+cmd;
	this.mpwrite(cmd);
	if (typeof(callback) == "function") callback();
}


MPlayerControl.prototype.loadfile = function(file, append, pausing, callback) {

	var cmd = "loadfile '"+file+"'";

	if (append == true)  cmd = cmd + " 1";
	if (pausing == true) cmd = "pausing_keep_force "+cmd;

	this.mpwrite(cmd);
	if (typeof(callback) == "function") callback();



}

MPlayerControl.prototype.loadlist = function(list, callback) {
	
	this.loadfile(list.shift(), false, true);
	for (var i = 0 ; i < list.length ; i++) {
		this.loadfile(list[i], true, true);
	}

	if (typeof(callback) == "function") callback();
}


MPlayerControl.prototype.quit = function() {
	this.destruct = true;
	clearInterval(this.command_send);
	this.mpwrite("quit");
}

MPlayerControl.prototype.seek = function(value, type, callback) {
	this.mpwrite("seek "+parseInt(value)+" "+parseInt(type));
	if (typeof(callback) == "function") callback();
}

/*

var files = ['copy.flac'];

var mp = new MPlayerControl("/usr/bin/mplayer", "test.*meter_[1-2]");
mp.init(function() { console.log("init callback called"); });


setInterval(function() {
	console.log(mp.state);
}, 5000);

setTimeout(function() {
	mp.loadlist(files);
}, 2000);

setTimeout(function() {
	mp.playpause();
}, 3000);


setTimeout(function() {
	mp.stop();
}, 10000);
*/
