

$(document).ready(function() {

	//config.log(window.opener.sm.config);

	$("#jack_ports").val(window.opener.prefs.jack_ports);
	$("#cue_command").val(window.opener.prefs.cue_command);
	$("#state_file").val(window.opener.prefs.state_file);

	if (window.opener.prefs.jack_noconnect == true) {
		$("#jack_noconnect").prop("checked", true);
		$("#jack_ports").prop("disabled", true);
	}

	$("#jack_noconnect").change(function() {

		var state;

		if ($("#jack_noconnect").prop('checked') == true) {
			state = true;
		} else {
			state = false;
		}

		$("#jack_ports").prop("disabled", state);

	});


	$("#show_logs").click(function() {
		window.opener.error.pop_window();
	});

	$("#save_prefs").click(function () {


		window.opener.prefs.jack_ports     = $("#jack_ports").val();
		window.opener.prefs.cue_command    = $("#cue_command").val();
		window.opener.prefs.state_file     = $("#state_file").val();
		window.opener.prefs.jack_noconnect = $("#jack_noconnect").prop("checked");

		window.opener.sm.show_info("Saved.  Restart for changes to take effect.");


		window.opener.prefs.save();
		window.close();
	});
});
