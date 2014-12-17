const gui   = require('nw.gui'),
	  fs    = require('fs'),
	  pexec = require('child_process');

var moc;

function putkeys() {


	var canvas = '';

	for (key in moc.state) {
		canvas += "<div><span>"+key+"</span><span>"+moc.state[key]+"</span></div>\n";
	}


	$("#stats div.body").html(canvas);

}


$(document).ready(function() {
	moc = new MocControl("/usr/bin/mocp");
	setInterval(function() { moc.update_state(putkeys) }, 200);

	$("#plpa").click(function() { moc.playpause(); });
	$("#prev").click(function() { moc.previous(); });
	$("#next").click(function() { moc.next(); });
});
