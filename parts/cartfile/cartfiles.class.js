

var CartFiles = function() {
	this.carts      = { };
	this.tmpdir     = "/tmp";
	this.fileprefix = 'cartamoc.'+process.pid;
	this.tar        = "/usr/bin/tar";

	this.fs         = require('fs');
	this.cp         = require('child_process');
}

CartFiles.prototype.uniqid = function() {
    return Math.random().toString(36).substr(2,9);
}


CartFiles.prototype.load        = function(file, callback) {

	if (!this.fs.statSync(file).isFile()) return false;
	var id     = this.uniqid();
	var newdir = this.tmpdir + "/" + this.fileprefix + "." + id;
	this.fs.mkdirSync(newdir);
	if (!this.fs.statSync(newdir).isDirectory()) return false;

	this.cp.exec("tar -C "+newdir+" -xf "+file, function(err, stdout, stderr) {
		if (err) {
			console.error("Error", err);
			return;
		}
		if (stderr) console.error(stderr);

		var cart_data = JSON.parse(this.fs.readFileSync(newdir+"/cart.json"));

		if (typeof(cart_data) != "object"  ||
			cart_data.name    == undefined ||
			cart_data.files   == undefined ||
			typeof(callback)  != "function") {
			this.ditch(id);
			return;
		}

		cart_data.file = file;
		this.carts[id] = cart_data;
		callback(id);


	}.bind(this));





}

CartFiles.prototype.getCartInfo = function(id) {

	if (typeof(this.carts[id]) == 'object') {
		return this.carts[id];
	} else {
		return undefined;
	}
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
	var dir = this.tmpdir + "/" + this.fileprefix + "." + id;
	
	var files = this.fs.readdirSync(dir);

	for (f in files) {
		this.fs.unlinkSync(dir + '/' + files[f]);
	}

	this.fs.rmdirSync(dir);
}




