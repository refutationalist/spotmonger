

var CartFiles = function() {
	this.carts      = { };
	this.tmpdir     = "/tmp";
	this.fileprefix = 'spotmonger.'+process.pid;
	this.tar        = "/usr/bin/tar";
	this.ffprobe    = "/usr/bin/ffprobe";

	this.report_error = function(line) {
		alert(line);
	}

	this.ffprobe_flags = '-v quiet -print_format json -show_format';

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

		this.cp.exec(this.tar+" -C "+newdir+" -xf '"+file+"'", function(err, stdout, stderr) {
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

		var match   = /(\..+)$/.exec(file);
		var newfile = this.uniqid() + match[0];

		console.log("file ext", match, newfile);

		this.fs.createReadStream(file).pipe(this.fs.createWriteStream(newdir + '/' + newfile));

		
		var cmd = this.ffprobe + " " +
				  this.ffprobe_flags + " '"+
				  newdir + '/' + newfile+"'";


		this.cp.exec(cmd, function(err, stdout, stderr) {

			console.log(typeof(this.report_error));
			if (stderr) this.report_error("CF runtime stderr: "+stderr);
			if (err) this.report_error("CF runtime: "+err);

					
			var ffjson = JSON.parse(stdout);

			if (ffjson.format) {

				var cart_data      = {};

				/*
				cart_data.name     = (typeof(ffjson.format.tags.title) != 'undefined') ? 
										ffjson.format.tags.title : require('path').basename(file);
										*/
				cart_data.name = require('path').basename(file);
				for (var k in ffjson.format.tags) {

					if (k.toLowerCase() == "title") 
						cart_data.name = ffjson.format.tags[k];


				}


				cart_data.files    = new Array(newfile);
				cart_data.runtime  = parseFloat(ffjson.format.duration);
				cart_data.single   = true;

				this.carts[id] = cart_data;

				console.log("fake cart data", cart_data);
				console.log("duration", ffjson.format.duration, cart_data.runtime);
			
				callback(id);
				



			} else {
				this.ditch(id);
			}


		}.bind(this));


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
	return this.tmpdir + "/" + this.fileprefix + "." + id;
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

		var cmd = this.ffprobe + " " +
				  this.ffprobe_flags + " '"+
				  this.getdir(id)+'/'+
				  this.carts[id].files[fidx]+"'";

		this.cp.exec(cmd,
					function(err, stdout, stderr) {

						if (stderr) this.report_error("CF runtime stderr: "+stderr);
						if (err) this.report_error("CF runtime: "+err);

					
						var ffjson = JSON.parse(stdout);
						var fidx = this.carts[id].files.indexOf(this.path.basename(ffjson.format.filename));
					

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


