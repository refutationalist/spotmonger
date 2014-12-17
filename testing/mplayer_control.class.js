
var MPlayerControl = function(mocp) {
	this.mocp  = mocp;
	this.state = { };

	this.report_error = function(line) {
		alert(line);
	}

	this.cp     = require('child_process');
	this.mplayer;
}
/*
MocControl.prototype.update_state = function(callback) {
	this.cp.exec(this.mocp+" --info", function(err, stdout, stderr) { 
		var newstate = { };

		if (err) { 
			var regex_off = /server is not running/;

			if (stderr.match(/server is not running/)) {
				newstate.offline = true;
			} else {
				this.report_error("mocp info exec: "+err);
				newstate = { "broken": true, "offline": true };
			}
		} else {
			if (stderr) {
				this.report_error("moc.update_state: "+stderr);
			}
			var lines = stdout.split("\n");
			lines.pop();

			for (k in lines) {
				var kv = lines[k].split(": ");
				newstate[ kv[0] ] = kv[1];
			}

		}

		this.state = newstate;
		if (typeof(callback) == "function") callback();


	}.bind(this));
}*/

MocControl.prototype.init = function(callback) {
	this.update_state(function() {

		if (this.state.offline == true) {
			this.cp.exec(this.mocp+" -S", function(err, stdout, stderr) {
				if (err) this.report_error("init 1: "+err);
				if (stderr) this.report_error("init 1 stderr: "+stderr);
				
				
				this.update_state(function() {
					if (this.state.offline == true) {
						this.report_error("init 2: Can't init MOC");
					} else {
						this.clear_playlist();
						if (typeof(callback) == "function") callback();
					}
				}.bind(this));

			}.bind(this));


		} else {
			this.stop(function() { this.clear_playlist(); }.bind(this));
			if (typeof(callback) == "function") callback();
				
		}

	}.bind(this));

}

MocControl.prototype.play = function(callback) {
	this.cp.exec(this.mocp+" --play", function(err, stdout, stderr) {
		if (err) this.report_error("play: "+err);
		if (stderr) this.report_error("play stderr: "+stderr);

		if (typeof(callback) == "function") callback();
		
	});
}

MocControl.prototype.next = function(callback) {
	this.cp.exec(this.mocp+" --next", function(err, stdout, stderr) {
		if (err) this.report_error("next: "+err);
		if (stderr) this.report_error("next stderr: "+stderr);

		if (typeof(callback) == "function") callback();
	});
}

MocControl.prototype.previous = function(callback) {
	this.cp.exec(this.mocp+" --previous", function(err, stdout, stderr) {
		if (err) this.report_error("previous: "+err);
		if (stderr) this.report_error("previous stderr: "+stderr);

		if (typeof(callback) == "function") callback();
	});
}

MocControl.prototype.stop = function(callback) {
	this.cp.exec(this.mocp+" --stop", function(err, stdout, stderr) {
		if (err) this.report_error("stop: "+err);
		if (stderr) this.report_error("stop stderr: "+stderr);

		if (typeof(callback) == "function") callback();
	});
}
/*
MocControl.prototype.pause = function(callback) {
	this.cp.exec(this.mocp+" --pause", function(err, stdout, stderr) {
		if (err) this.report_error("pause: "+err);
		if (stderr) this.report_error("pause stderr: "+stderr);

		if (typeof(callback) == "function") callback();
	});
}
*/
/*
MocControl.prototype.unpause = function(callback) {
	this.cp.exec(this.mocp+" --unpause", function(err, stdout, stderr) {
		if (err) this.report_error("unpause: "+err);
		if (stderr) this.report_error("unpause stderr: "+stderr);

		if (typeof(callback) == "function") callback();
	});
}
*/

/*
MocControl.prototype.seek = function(rate, callback) {
	this.cp.exec(this.mocp+" --seek "+rate, function(err, stdout, stderr) {
		if (err) this.report_error("seek: "+err);
		if (stderr) this.report_error("seek stderr: "+stderr);

		if (typeof(callback) == "function") callback();
	});
}
*/

/*
MocControl.prototype.jump = function(rate, callback) {
	this.cp.exec(this.mocp+" --jump "+rate, function(err, stdout, stderr) {
		if (err) this.report_error("jump: "+err);
		if (stderr) this.report_error("jump stderr: "+stderr);

		if (typeof(callback) == "function") callback();
	});
}
*/

/*
MocControl.prototype.playpause = function(callback) {
	this.cp.exec(this.mocp+" -G", function(err, stdout, stderr) {
		if (err) this.report_error("playpause: "+err);
		if (stderr) this.report_error("playpause stderr: "+stderr);

		if (typeof(callback) == "function") callback();
	});

}
*/

/*
MocControl.prototype.clear_playlist = function(callback) {
	this.cp.exec(this.mocp+" --clear", function(err, stdout, stderr) {
		if (err) this.report_error("clear_playlist: "+err);
		if (stderr) this.report_error("clear_playlist stderr: "+stderr);

		if (typeof(callback) == "function") callback();
	});
}
*/

/*
MocControl.prototype.append = function(files, callback) {

	var inf = [];
	for (f in files) {
		inf.push(this.mocp+" --append '"+files[f]+"'");
	}


	this.cp.exec(inf.join(" ; "), function(err, stdout, stderr) {
		if (err) this.report_error("append: "+err);
		if (stderr) this.report_error("append stderr: "+stderr);

		if (typeof(callback) == "function") callback();
	});
}
*/
