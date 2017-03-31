
var warn = {
	popped: false,

	do: function(txt) {

		if (warn.popped == true) {
			error.note("stacking in-UI warnings: "+txt);
			return;
		} 

		var info_ele = document.querySelector("#info");
		info_ele.innerHTML = txt;
		info_ele.style.opacity = 1;
		warn.popped = true;

		setTimeout(function() {
			info_ele.style.opacity = 0;
			warn.popped = false;
		}, 3000);

	}

};
