
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
		this.collected.push(d.toString() + " " + text);
		this.length = this.collected.length ,
		process.stderr.write(d.toString() + " " + text + "\n");


		if (this.suppress == true) {	
			// do something there
			console.error("REPORT_ERROR", text, "suppressed");
		} else {
			console.error("REPORT_ERROR", text);
			this.pop_window();
		}

	},

	note: function(text) { // NOTE a thing that may or may not be a minor error
		var d = new Date();
		this.collected.push(d.toString() + " " + text);
		this.length = this.collected.length ,
		process.stderr.write(d.toString() + " " + text + "\n");
	},

	pop_window: function() { // POP open the error window
		if (this.state == 0) {
			this.state = 1;
			this.win = nw.Window.open('errlog.html',
								 {
									 width:    this.ERRWIN_WIDTH,
									 height:   this.ERRWIN_HEIGHT,
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

	//function exit_handler() { // where the hell else do I put this?
//
	//}

};


