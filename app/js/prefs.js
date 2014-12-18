

$(document).ready(function() {

	//config.log(window.opener.sm.config);

	$("#jack_ports").val(window.opener.sm.config.jack_ports);
	$("#cue_command").val(window.opener.sm.config.cue_command);
	$("#state_file").val(window.opener.sm.config.state_file);

	if (window.opener.sm.config.jack_noconnect == true) {
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
		window.opener.sm.show_errorwindow();
	});

	$("#save_prefs").click(function () {

		window.opener.sm.config.jack_ports     = $("#jack_ports").val();
		window.opener.sm.config.cue_command    = $("#cue_command").val();
		window.opener.sm.config.state_file     = $("#state_file").val();
		window.opener.sm.config.jack_noconnect = $("#jack_noconnect").prop("checked");

		window.opener.sm.show_info("Saved.  Restart for changes to take effect.");


		window.opener.sm.save_config();
		window.close();
	});
});
