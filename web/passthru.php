<?php

header("Content-type: application/json");
$url = sprintf("http://localhost:10101/?%s", $_SERVER["QUERY_STRING"]);

$output = file_get_contents($url);

if ($output === false) {
	echo json_encode(array("error" => 1, "text" => "Spotmonger isn't running."));

} else {
	echo $output;
}





