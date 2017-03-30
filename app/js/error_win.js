

document.addEventListener("DOMContentLoaded", function() {

	var curlen = 0;

	document.querySelector("#close").addEventListener("click", function() {
		window.close();
	});
	
	if (window.opener.error.suppress == true) {
		document.querySelector("#suppress").classList.add("pressed");
	}


	document.querySelector("#suppress").addEventListener("click", function(evt) {

		var new_val = (window.opener.error.suppress == true) ? false : true;

		window.opener.error.suppress = new_val;

		if (new_val == true) {
			evt.target.classList.add("pressed");
		} else {
			evt.target.classList.remove("pressed");
		}

	});

	setInterval(function() {
		if (curlen != 
			window.opener.error.length) {
			curlen = window.opener.error.length;

			var ele = document.querySelector("#err");

			ele.innerHTML = window.opener.error.collected.join("<br />\n");
			ele.scrollTop = ele.scrollHeight;

		}
	}, 250);
});


