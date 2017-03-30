//
//  Ping-Pong text scroll in pure js and CSS3 animation
//
//     Uses the MutationObserver to check for changes to appropriate nodes
//
//     Uses the transform and transition CSS tags.  Waits transition seconds
//     before scrolling.
//
//  Sam Mulvey, 2017 -- MIT Licence
//


(function pingpong_text() {

	var right_padding = 10;
	var observer;
	var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
	


	function scroll_left(element) {
		element.style.transform = 'translateX(0px)';
	}

	function scroll_right(element, my_parent) {
		if (my_parent == null) my_parent = element.parentElement;

		if (element == null || my_parent == null) return;


		var my_width = element.scrollWidth;
		var p_width = my_parent.offsetWidth;
		var full_right = -( my_width - p_width + right_padding);
		full_right = (full_right < -(right_padding)) ? full_right : 0;

		element.style.transform = 'translateX('+full_right+'px)';

	}


	function to_mills(ele) {
		return parseFloat(window.getComputedStyle(ele).transitionDuration) * 1000;
	}

	function prepare(element) {

		var div = document.createElement("div");
		div.innerHTML = element.innerHTML;
		div.className = "pgpg_inner";
		element.innerHTML = '';
		element.appendChild(div);

		setTimeout(function() {
			// Apparently, when handed a div via setTimeout, I don't get the parent.
			// so, I'm explicitly handing the parent over.   scroll_right will
			// automatically look for .parentElement if I don't explicitly hand
			// it the parent.
			scroll_right(div, element);
		}, to_mills(div));

		div.addEventListener("transitionend", function(evt) {
			var translateX = window.getComputedStyle(evt.target).transform.split(', ')[4];

			if (translateX == 0) {
				setTimeout(function() { scroll_right(evt.target) }, to_mills(evt.target));
			} else {
				setTimeout(function() { scroll_left(evt.target) }, to_mills(evt.target));
			}

		});
	}


	document.addEventListener("DOMContentLoaded", function() {
		if (!MutationObserver) return; // oops, not supported;

		observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(m) {
				if (m.addedNodes.length > 0 && m.addedNodes[0].className != "pgpg_inner") {
					prepare(m.target);
				}
			});
		});

		document.querySelectorAll(".pingpong").forEach(function(element) {
			prepare(element);
			observer.observe(element, { childList: true, subtree: true });
			
		});
	});

})();
