const UP   = false;
const DOWN = true;

$(document).ready(function() {
	$(".hour .up").click(function() {   settime.hour($("#hour"), UP); });
	$(".hour .down").click(function() { settime.hour($("#hour"), DOWN); });
	
	$(".minute .up").click(function() {   settime.minute($("#minute"), UP); });
	$(".minute .down").click(function() { settime.minute($("#minute"), DOWN); });


	$(".second .up").click(function() {   settime.second($("#second"), UP); });
	$(".second .down").click(function() { settime.second($("#second"), DOWN); });


	$("#qs_minute").addClass('pressed');
	$(".quick_select .type_select div").click(function() {
		$("#qs_minute").toggleClass("pressed");
		$("#qs_second").toggleClass("pressed");
	});


	$(".quick_select button").click(function() {
		var time      = $(this).attr('id').substr(1,2);
		var change = ($("#qs_minute").hasClass('pressed')) ? "#minute" : "#second";

		if ($("#qs_minute").hasClass('pressed')) {
			settime.minute_set($("#minute"), time);
		} else {
			settime.second_set($("#second"), time);
		}
	});

	$("#set").click(function() {
		if (settime.id == 0) return;
		window.opener.cart.carts[settime.id].start_at = settime.stamp;
		window.close();


	});

	$("#close").click(function() {
		if (settime.id == 0) return;
		window.opener.cart.carts[settime.id].start_at = 0;
		window.close();
	});


});

function setup(ti, tn) {
	settime.id = ti;
	$("#cart_name").html(tn);

	window.opener.error.note("start time: "+
							 window.opener.cart.carts[ti].start_at);

	if (window.opener.cart.carts[ti].start_at != undefined &&
		window.opener.cart.carts[ti].start_at != 0) {
		settime.stamp = window.opener.cart.carts[ti].start_at;
	} else {
		settime.stamp = settime.now_stamp();
	}
	settime.stamp_to_parts();
	$("#hour").val(settime.st_hour);
	$("#minute").val(settime.st_minute);
	$("#second").val(settime.st_second);

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
		console.log(ele.val());
		var val = parseInt(ele.val());
		val = (direction == DOWN) ? val - 1 : val + 1;

		if (val > up_limit) val = 0;
		if (val < 0) val = up_limit;

		ele.val(this.pad(val, 2));

		//process.stdout.write(val + "\n");
		console.log(val);
		return val;

	},

	directset: function(ele, value, up_limit) {
		var val = parseInt(value) % up_limit;
		ele.val(this.pad(val, 2));
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
