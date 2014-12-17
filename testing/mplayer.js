

var cp = require('child_process');


var thing = cp.exec("mplayer -quiet -slave nib.mp3", function (err, stdout, stderr) {
	console.log("STDOUT", stdout);
	console.log("STDERR", stderr);
	console.log("in exec");	

});


console.log("out of exec");

setTimeout(function() {
	console.log("I AM A TIMER");
}, 10000);

/*
setInterval(function() {
	var stuff = thing.stdout;
	console.log("STDOUT AGAIN", stuff);
}, 1000);
*/

thing.stdout.on('data', function (data) {
    //var buff = new Buffer(data);

	var incoming = Buffer(data).toString('utf8');
	var lines = incoming.split('\n');

	var regex = /^(ANS_\S+)=(.*)$/;

	for (l in lines) {
		var res = lines[l].match(regex);
		//console.log(res);
		if (res != null) {
			console.log("NAME: ", res[1], "VAL: ", res[2]);
		}

	}

});

setInterval(function() {
	//thing.stdin.write("get_meta_title\n");
	thing.stdin.write("get_file_name\n"+
					  "get_percent_pos\n"+
					  "get_property length\n"+
					  "get_property pause\n");
}, 1000);
