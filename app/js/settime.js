
var cart;
var cart_id;

$(document).ready(function() {

	var time = new Date();

	$("#hour").val(pad(time.getHours(), 2));
	$("#minute").val(pad(time.getMinutes(), 2));
	$("#second").val("00");

	$(".hour .up").click(function() { change_hour(); });
	$(".hour .down").click(function() { change_hour(true); });


	$(".minute .up").click(function()   { change_ms('#minute'); });
	$(".minute .down").click(function() { change_ms('#minute',true); });



	$(".second .up").click(function()   { change_ms('#second'); });
	$(".second .down").click(function() { change_ms('#second',true); });


	$("#qs_minute").addClass('pressed');


	$(".quick_select button").click(function() {
		var time      = $(this).attr('id').substr(1,2);
		var change = ($("#qs_minute").hasClass('pressed')) ? "#minute" : "#second";
		console.log(time, change);
		$(change).val(time);
	});

	$(".quick_select .type_select div").click(function() {
		$("#qs_minute").toggleClass("pressed");
		$("#qs_second").toggleClass("pressed");
	});


	$("#set").click(function() {

		var time   = new Date();

		var hour   = $("#hour").val();
		var minute = $("#minute").val();
		var second = $("#second").val();


		var total_seconds = (parseInt(hour) * 3600) + 
							(parseInt(minute) * 60) + 
							parseInt(second);

		var time_string   = hour+':'+minute+':'+second;

		var now_int  = parseInt(pad(time.getHours(),   2) + 
								pad(time.getMinutes(), 2) + 
								pad(time.getSeconds(), 2));
		var pick_int = parseInt(hour + minute + second);

		var start_of_day = get_today_stamp();

		if (pick_int < now_int) {
			start_of_day = start_of_day + 86400;
		}

		var picked_stamp = start_of_day + total_seconds;

		console.log("timeset", total_seconds, 
					time_string, picked_stamp);

		cart.settime(cart_id, picked_stamp);


		window.close();





	});


	$("#close").click(function() {
		cart.carts[cart_id].start_at = 0;
		window.close();

	});



});


function get_today_stamp() {
	var now = new Date();

	var sod = new Date(now.getFullYear(),
					   now.getMonth(),
					   now.getDate());

	return sod / 1000;
}


function change_hour(sub) {
	var val = parseInt($("#hour").val());
	val = (sub == true) ?  (val - 1) : (val + 1);

	if (val > 23) {
		val = 0;
	} else if (val < 0) {
		val = 23;
	}

	$("#hour").val(pad(val, 2));
}

function change_ms(id, sub) {
	var val = parseInt($(id).val());
	val = (sub == true) ?  (val - 1) : (val + 1);

	if (val > 59) {
		val = 0;
	} else if (val < 0) {
		val = 59;
	}

	$(id).val(pad(val, 2));
}



function set_info(id, name, in_cart) {
	$("#cart_name").html(name);
	cart = in_cart;
	cart_id = id;
	console.log("settime info", id, name, in_cart, in_cart.carts);
}

function set_time(in_stamp) {

	var time = new Date(in_stamp * 1000);

	var hour = pad(time.getHours(), 2);
	var minute = pad(time.getMinutes(), 2);
	var second = pad(time.getSeconds(), 2);

	$("#hour").val(hour);
	$("#minute").val(minute);
	$("#second").val(second);

	console.log("set_time", hour, minute, second);

}




function pad(n, width, z) {
	z = z || '0';
	n = n + '';
	return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

