const UP   = false;
const DOWN = true;

document.addEventListener("DOMContentLoaded", function() {

	/* A WHOLE bunch of button bindings */

	document.querySelector(".hour .up").addEventListener('click', function() {
		settime.hour(document.getElementById("hour"), UP);
	});

	document.querySelector(".hour .down").addEventListener('click', function() {
		settime.hour(document.getElementById("hour"), DOWN);
	});

	document.querySelector(".minute .up").addEventListener('click', function() {
		settime.minute(document.getElementById("minute"), UP);
	});

	document.querySelector(".minute .down").addEventListener('click', function() {
		settime.minute(document.getElementById("minute"), DOWN);
	});

	document.querySelector(".second .up").addEventListener('click', function() {
		settime.second(document.getElementById("second"), UP);
	});

	document.querySelector(".second .down").addEventListener('click', function() {
		settime.second(document.getElementById("second"), DOWN);
	});


	/* bindings and initial state for the quick select */
	document.getElementById("qs_minute").classList.add('pressed');

	document.querySelectorAll(".quick_select .type_select div").forEach(function(ele) {
		ele.addEventListener('click', function() {
			console.log("toggle quickselect");
			document.getElementById('qs_minute').classList.toggle('pressed');
			document.getElementById('qs_second').classList.toggle('pressed');
		});
	});


	document.querySelectorAll(".quick_select button").forEach(function(ele) {
	
		ele.addEventListener('click', function(evt) {
			console.log("quickselect button pressed");
			var time      = evt.target.id.substr(1,2);


			if (document.getElementById('qs_minute').classList.contains('pressed')) {
				settime.minute_set(document.getElementById("minute"), time);
			} else {
				settime.second_set(document.getElementById("second"), time);
			}
		});
	});

	
	document.getElementById("set").addEventListener('click', function() {
		if (settime.id == 0) return;
		window.opener.cart.carts[settime.id].start_at = settime.stamp;
		window.close();
	});

	document.getElementById("close").addEventListener('click', function() {
		if (settime.id == 0) return;
		window.opener.cart.carts[settime.id].start_at = 0;
		window.close();
	});


});

function setup(ti, tn) {
	settime.id = ti;
	document.getElementById("cart_name").innerHTML = tn;

	window.opener.error.note("start time: "+
							 window.opener.cart.carts[ti].start_at);

	if (window.opener.cart.carts[ti].start_at != undefined &&
		window.opener.cart.carts[ti].start_at != 0) {
		settime.stamp = window.opener.cart.carts[ti].start_at;
	} else {
		settime.stamp = settime.now_stamp();
	}
	settime.stamp_to_parts();

	document.getElementById("hour").value = settime.st_hour;
	document.getElementById("minute").value = settime.st_minute;
	document.getElementById("second").value = settime.st_second;

}

var settime = {
	id:        0,
	stamp:     0,
	st_hour:   0,
	st_minute: 0,
	st_second: 0,

	hour: function(ele, direction) {
		this.st_hour = this.increment(ele, direction, 23);
		this.compute_stamp();
	},
	hour_set: function(ele, val) {
		this.st_minute = this.directset(ele, val, 23);
		this.compute_stamp();
	},

	minute: function(ele, direction) {
		this.st_minute = this.increment(ele, direction, 59);
		this.compute_stamp();
	},
	minute_set: function(ele, val) {
		this.st_minute = this.directset(ele, val, 59);
		this.compute_stamp();
	},

	second: function(ele, direction) {
		this.st_second = this.increment(ele, direction, 59);
		this.compute_stamp();
	},
	second_set: function(ele, val) {
		this.st_second = this.directset(ele, val, 59);
		this.compute_stamp();
	},

	stamp_to_parts: function() {
		var time       = new Date(this.stamp * 1000);
		this.st_hour   = this.pad(time.getHours(), 2);
		this.st_minute = this.pad(time.getMinutes(), 2);
		this.st_second = this.pad(time.getSeconds(), 2);
	},

	increment: function(ele, direction, up_limit) {
		console.log(ele.value);
		var val = parseInt(ele.value);
		val = (direction == DOWN) ? val - 1 : val + 1;

		if (val > up_limit) val = 0;
		if (val < 0) val = up_limit;

		ele.value = this.pad(val, 2);

		//process.stdout.write(val + "\n");
		console.log(val);
		return val;

	},

	directset: function(ele, value, up_limit) {
		var val = parseInt(value) % up_limit;
		ele.value = this.pad(val, 2);
		return val;

	},



	today_stamp: function() { // deconfusion function
		var now = new Date();

		var sod = new Date(now.getFullYear(),
						   now.getMonth(),
						   now.getDate());

		return sod / 1000;
	},

	now_stamp: function() { // same.
		return Math.floor(Date.now() / 1000);
	},


	compute_stamp: function() {
		var time   = new Date();

		var total_seconds = (parseInt(this.st_hour) * 3600) +
							(parseInt(this.st_minute) * 60) +
							 parseInt(this.st_second);

		var picked_stamp = total_seconds + this.today_stamp();

		if (picked_stamp < this.now_stamp()) {
			picked_stamp + 86400;
		}

		this.stamp = picked_stamp;
		console.log(total_seconds, picked_stamp);

	},

	pad: function(n, width, z) {
		z = z || '0';
		n = n + '';
		return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
	}

};
