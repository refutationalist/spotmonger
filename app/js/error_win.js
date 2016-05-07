

$(document).ready(function() {

	var curlen = 0;

	$("#close").click(function() {
		window.close();
	});
	
	if (window.opener.error.suppress == true) {
		$("#suppress").addClass("pressed");
	}

	$("#suppress").click(function() {


		$(this).toggleClass("pressed");
		window.opener.error.suppress = 
			(window.opener.error.suppress == true) ? false : true;

	});

	setInterval(function() {
		count++;
		if (curlen != 
			window.opener.error.length) {
			curlen = window.opener.error.length;
			$("#err").html(window.opener.error.collected.join("<br />\n"));
			$("#err").scrollTop($("#err")[0].scrollHeight);
		}
	}, 250);
});


