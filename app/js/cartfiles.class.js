

var CartFiles = function(in_config) {
	this.carts      = { };
	this.fileprefix = 'spotmonger.'+process.pid;

	this.config     = { },
	this.def_config = {
						tar: "/usr/bin/tarDEF",
						ffprobe: "/usr/bin/ffprobeDEF",
						ffprobe_flags: ['-v', 'quiet',
										'-print_format', 'json',
										'-show_format'],
						tmpdir: "/tmp",
						report_error: function(txt) {
							alert(txt);
						}
	},

	this.config     = Object.assign(this.config, this.def_config, in_config);
	this.report_error = this.config.report_error;
	delete(this.config.report_error);

	this.fs         = require('fs');
	this.cp         = require('child_process');
	this.path		= require('path');
}

CartFiles.prototype.uniqid = function() {
    return 'cart_'+Math.random().toString(36).substr(2,9);
}


CartFiles.prototype.load        = function(file, callback) {

	if (!this.fs.statSync(file).isFile()) return false;
	var id     = this.uniqid();
	var newdir = this.getdir(id);
	this.fs.mkdirSync(newdir);
	if (!this.fs.statSync(newdir).isDirectory()) return false;

	if (file.match(/cart$/)) { // if cart file

		this.cp.execFile(this.config.tar, 
						 ['-C', newdir, '-xf', file],
						 function (err, stdout, stderr) {
			if (err) {
				this.report_error("CF Load error: "+err);

				return;
			}
			if (stderr) this.report_error("CF Load stderr:" + stderr);

			var cart_data = JSON.parse(this.fs.readFileSync(newdir+"/cart.json"));

			if (typeof(cart_data) != "object"  ||
				cart_data.name    == undefined ||
				cart_data.files   == undefined ||
				typeof(callback)  != "function") {
				this.ditch(id);
				return;
			}


			cart_data.file    = file;
			cart_data.runtime = 0;
			this.carts[id]    = cart_data;
			callback(id);


		}.bind(this));

	} else { // if regular audio file
		console.log("this is an audio file, oddly.");

		var match   = /(\.[^\.]+)$/.exec(file);
		var newfile = this.uniqid() + match[0];
		var in_stream = this.fs.createReadStream(file);
		console.log("file ext", match, newfile);

		in_stream.on('end', () => {

			var args = this.config.ffprobe_flags.slice();
			args.push(newdir + '/' + newfile);


			this.cp.execFile(this.config.ffprobe, args, function(err, stdout, stderr) {

				if (stderr) this.report_error("CF runtime stderr: "+stderr);
				if (err) this.report_error("CF runtime: "+err);

						
				var ffjson = JSON.parse(stdout);

				if (ffjson.format) {

					var cart_data      = {};

					try {
						cart_data.name = require('path').basename(file);
					} catch (e) {
						this.report_error("cart load basename fail: %s", e.message);
					}


					for (var k in ffjson.format.tags) {

						if (k.toLowerCase() == "title") 
							cart_data.name = ffjson.format.tags[k];


					}


					cart_data.files    = new Array(newfile);
					cart_data.runtime  = parseFloat(ffjson.format.duration);
					cart_data.single   = true;

					this.carts[id] = cart_data;

				
					callback(id);

				} else {
					this.ditch(id);
				}


			}.bind(this));

		});

		in_stream.pipe(this.fs.createWriteStream(newdir + '/' + newfile));


	}





}

CartFiles.prototype.getCartInfo = function(id) {

	if (typeof(this.carts[id]) == 'object') {
		return this.carts[id];
	} else {
		return undefined;
	}
}

CartFiles.prototype.getCartFiles = function(id) {
	var ret = [];
	var dir = this.getdir(id);

	for (f in this.carts[id].files) {
		ret.push(dir+'/'+this.carts[id].files[f]);
	}

	return ret;

}

CartFiles.prototype.getCarts    = function() {
	return Object.keys(this.carts);
}

CartFiles.prototype.unload      = function(id) {
	if (typeof(this.carts[id]) == "object") {
		this.ditch(id);
		delete this.carts[id];
	}
}

CartFiles.prototype.ditch       = function(id) {
	var dir = this.getdir(id);
	var files = this.fs.readdirSync(dir);

	for (f in files) {
		this.fs.unlinkSync(dir + '/' + files[f]);
	}

	this.fs.rmdirSync(dir);
}

CartFiles.prototype.getdir      = function(id) {
	return this.config.tmpdir + "/" + this.fileprefix + "." + id;
}

CartFiles.prototype.cleanup     = function()   {

	for (id in this.carts) {
		this.ditch(id);
	}
	this.carts = { };
}


CartFiles.prototype.runtime     = function(id, callback) {

	if (typeof(this.carts[id]) != "object") return;

	if (this.carts[id].runtime != 0) {
		callback(id);
		return;
	}

	this.carts[id].rtwait  = [ ];

	for (fidx in this.carts[id].files) {
		this.carts[id].rtwait[fidx] = 0;

		var args = this.config.ffprobe_flags.slice();
		args.push(this.getdir(id)+'/'+this.carts[id].files[fidx]);

		this.cp.execFile(this.config.ffprobe, args, 
					function(err, stdout, stderr) {

						if (stderr) this.report_error("CF runtime stderr: "+stderr);
						if (err) this.report_error("CF runtime: "+err);

						var ffjson = JSON.parse(stdout);

						try {
							var basename = this.path.basename(ffjson.format.filename);

						} catch (e) {
							this.report_error(sprintf("cart runtime basename fail: %s",
													  e.message));

						}


						var fidx = this.carts[id].files.indexOf(basename);
						this.carts[id].runtime += parseFloat(ffjson.format.duration);
						this.carts[id].rtwait[fidx] = 1;


						if (this.carts[id].rtwait.indexOf(0) == -1) {
							delete this.carts[id].rtwait;
							callback(id);
						}

					}.bind(this));
	}

}




CartFiles.prototype.settime = function(id, time) {

	if (time < (Date.now() / 1000)) {
		return false;
	} else {
		this.carts[id].start_at = time;
		return true;
	}

}


