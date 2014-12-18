

$(document).ready(function() {
	put_logs();

	$("#close").click(function() {
		window.close();
	});

	
	console.log("suppress", window.opener.sm.errors_suppress);
	if (window.opener.sm.errors_suppress == true) {
		$("#suppress").addClass("pressed");
		console.error("is suppressed");

	}

	$("#suppress").click(function() {

		if (window.opener.sm.errors_suppress == true) {
			$(this).removeClass("pressed");
			window.opener.sm.errors_suppress = false;
		} else {
			$("#suppress").addClass("pressed");
			window.opener.sm.errors_suppress = true;
		}

	});
});


function put_logs() {
	$("#err").html(window.opener.sm.errors.join("<br />\n"));
	$("#err").scrollTop($("#err")[0].scrollHeight);
}
