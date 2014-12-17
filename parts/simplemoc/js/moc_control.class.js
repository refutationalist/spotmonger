
var MocControl = function(mocp) {
	this.mocp  = mocp;
	this.state = { };
}

MocControl.prototype.update_state = function(callback) {
	pexec.exec(this.mocp+" --info", function(err, stdout, stderr) { 

		if (err) { 
			alert(err);
		}
		if (stderr) console.error("moc.update_state", stderr);
		var lines = stdout.split("\n");
		lines.pop();
		var newstate = { };

		for (k in lines) {
			var kv = lines[k].split(": ");
			newstate[ kv[0] ] = kv[1];
		}

		this.state = newstate;

		if (typeof(callback) == "function") callback();


	}.bind(this));
}

MocControl.prototype.play = function(callback) {
	pexec.exec(this.mocp+" --play", function(err, stdout, stderr) {
		if (err) alert(err);
		if (stderr) console.error(stderr);
		if (typeof(callback) == "function") callback();
		
	});
}

MocControl.prototype.next = function(callback) {
	pexec.exec(this.mocp+" --next", function(err, stdout, stderr) {
		if (err) alert(err);
		if (stderr) console.error(stderr);
		if (typeof(callback) == "function") callback();
	});
}

MocControl.prototype.previous = function(callback) {
	pexec.exec(this.mocp+" --previous", function(err, stdout, stderr) {
		if (err) alert(err);
		if (stderr) console.error(stderr);
		if (typeof(callback) == "function") callback();
	});
}

MocControl.prototype.stop = function(callback) {
	pexec.exec(this.mocp+" --stop", function(err, stdout, stderr) {
		if (err) alert(err);
		if (stderr) console.error(stderr);
		if (typeof(callback) == "function") callback();
	});
}

MocControl.prototype.pause = function(callback) {
	pexec.exec(this.mocp+" --pause", function(err, stdout, stderr) {
		if (err) alert(err);
		if (stderr) console.error(stderr);
		if (typeof(callback) == "function") callback();
	});
}

MocControl.prototype.unpause = function(callback) {
	pexec.exec(this.mocp+" --unpause", function(err, stdout, stderr) {
		if (err) alert(err);
		if (stderr) console.error(stderr);
		if (typeof(callback) == "function") callback();
	});
}

MocControl.prototype.seek = function(rate, callback) {
	pexec.exec(this.mocp+" --seek "+rate, function(err, stdout, stderr) {
		if (err) alert(err);
		if (stderr) console.error(stderr);
		if (typeof(callback) == "function") callback();
	});
}

MocControl.prototype.jump = function(rate, callback) {
	pexec.exec(this.mocp+" --jump "+rate, function(err, stdout, stderr) {
		if (err) alert(err);
		if (stderr) console.error(stderr);
		if (typeof(callback) == "function") callback();
	});
}

MocControl.prototype.playpause = function(callback) {
	pexec.exec(this.mocp+" -G", function(err, stdout, stderr) {
		if (err) alert(err);
		if (stderr) console.error(stderr);
		if (typeof(callback) == "function") callback();
	});

}

MocControl.prototype.clear_playlist = function(callback) {
	pexec.exec(this.mocp+" --clear", function(err, stdout, stderr) {
		if (err) alert(err);
		if (stderr) console.error(stderr);
		if (typeof(callback) == "function") callback();
	});
}


MocControl.prototype.append = function(files, callback) {
	pexec.exec(this.mocp+" --append "+files, function(err, stdout, stderr) {
		if (err) alert(err);
		if (stderr) console.error(stderr);
		if (typeof(callback) == "function") callback();
	});
}

