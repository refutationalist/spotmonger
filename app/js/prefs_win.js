

document.addEventListener("DOMContentLoaded", function() {
	


	document.querySelector("#jack_ports").value =  window.opener.prefs.data.jack_ports;
	document.querySelector("#cue_command").value = window.opener.prefs.data.cue_command;
	document.querySelector("#state_file").value =  window.opener.prefs.data.state_file;

	if (window.opener.prefs.data.jack_noconnect == true) {
		document.getElementById('jack_noconnect').checked = true;
		document.getElementById('jack_ports').disabled = true;
	}

	document.getElementById('jack_noconnect').addEventListener('change', function(evt) {

		var state;

		if (evt.target.checked == true) {
			state = true;
		} else {
			state = false;
		}

		document.getElementById('jack_ports').disabled = state;

	});


	document.getElementById('show_logs').addEventListener('click', function() {
		window.opener.error.pop_window();
	});

	document.getElementById('save_prefs').addEventListener('click', function() {


		window.opener.prefs.data.jack_ports     = document.getElementById("jack_ports").value;
		window.opener.prefs.data.cue_command    = document.getElementById("cue_command").value;
		window.opener.prefs.data.state_file     = document.getElementById("state_file").value;
		window.opener.prefs.data.jack_noconnect = document.getElementById("jack_noconnect").checked;

		window.opener.warn.do("Saved.  Restart for changes to take effect.");


		window.opener.prefs.save();
		window.close();
	});
});
