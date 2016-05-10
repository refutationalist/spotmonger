
var error = {

	ERRWIN_WIDTH: 500,
	ERRWIN_HEIGHT: 430,

	win:       false,          // The window, if ya got 'em.
	state:     false,         // I WILL WIN THE RACE CONDITION
	suppress:  false,        // Unless races are suppressed.  By an Error Supremacist.
	collected: new Array(), // an array of actual, no joke, errors.
	length: 0,


	/* window states: 0 closed, 1 opening, 2 opened
	 *  Do *you* trust the window object?  */

	report: function(text) { // REPORT an error
		var d = new Date();
		try {
			error.collected.push(d.toString() + " " + text);
		} catch (e) {
			error.collected = new Array();
			error.collected.push(d.toString() + " error log reinit");
			error.collected.push(d.toString() + " " + text);
		}
		error.length = error.collected.length ,
		process.stderr.write(d.toString() + " " + text + "\n");


		if (error.suppress == true) {	
			// do something there
			console.error("REPORT_ERROR", text, "suppressed");
			sm.show_info("Error suppressed.  See logs for more information.");
			
		} else {
			console.error("REPORT_ERROR", text);
			error.pop_window();
		}

	},

	note: function(text) { // NOTE a thing that may or may not be a minor error
		var d = new Date();
		try {
			error.collected.push(d.toString() + "[NOTICE] " + text);
		} catch (e) {
			error.collected = new Array();
			error.collected.push(d.toString() + " error log reinit");
			error.collected.push(d.toString() + "[NOTICE] " + text);
		}
		error.length = error.collected.length ,
		process.stderr.write(d.toString() + " " + text + "\n");
	},

	pop_window: function() { // POP open the error window
		if (error.state == 0) {
			error.state = 1;
			error.win = nw.Window.open('error_win.html',
								 {
									 width:    error.ERRWIN_WIDTH,
									 height:   error.ERRWIN_HEIGHT,
									 frame:    true,
									 position: 'mouse',
									 focus:    true
								 }, 
								 function (newwin) { // avoid something dumb
								 	newwin.on('loaded', function() {
										error.state = 2;
									});

									newwin.on('closed', function() {
										error.state = 0;
									});

								 });
		}
	}


};


