#!/usr/bin/php
<?php


if (!$tarbin = trim(`which tar`)) {
	echo basename(__FILE__).": no tar in PATH.\n";
	exit(99);
}

if (!$ffprobebin = trim(`which ffprobe`)) {
	echo basename(__FILE__).": no ffprobe found in PATH.\n";
	exit(99);
}

if (!is_writable("/tmp")) {
	echo basename(__FILE__).": /tmp directory not writable.\n";
}

$opts = getopt("n:o:", array(), $optend);


if (@trim($opts['n'] == '' && trim($opts['o']) == '')) {
	echo basename(__FILE__).": spotmaker -n <name of cart> -o <output file>  <audio file> ...\n";
	exit(1);
} else if (@trim($opts["n"]) == '') {
	echo basename(__FILE__).": no cart name specified.\n";
	exit(1);
} else if (@trim($opts["o"]) == '') {
	echo basename(__FILE__).": no output file specified.\n";
	exit(1);
}

if (substr($opts["o"], -5) != ".cart") {
	echo "Warning: 'cart' file extension added, otherwise spotmonger will be confused.\n";
	$opts["o"] .= ".cart";
}


if (!is_writable(dirname($opts["o"]))) {
	echo dirname($opts["o"])."\n";
	echo basename(__FILE__).": can't write destination directory.\n";
	exit(1);
} else if (file_exists($opts['o'])) {
	echo basename(__FILE__).": shameless refusing to overwrite existing file.\n";

	exit(1);
}

$tmpdir = '/tmp/spotmaker-'.getmypid().'-'.uniqid();
if (!mkdir($tmpdir)) {
	echo basename(__FILE__).": couldn't make assembly directory\n";
	exit(99);
}


$audio_files = array();
for ($i = $optend ; $i < count($argv) ; $i++) {
	$file = escapeshellarg($argv[$i]);

	$info = json_decode(`$ffprobebin -v quiet -print_format json -show_streams -select_streams a -show_format $file`);

	if (@count($info->streams) == 0) {
		echo "$file: not an audio file, skipping.\n";
		continue;
	}

	$tmp = sprintf('track%s.%s', uniqid(), $info->format->format_name);

	if (!copy($argv[$i], $tmpdir.'/'.$tmp)) {
		echo "$file: couldn't copy\n";
	} else {
		$audio_files[] = $tmp;
	}

}

if (!file_put_contents($tmpdir.'/cart.json', json_encode(array('name' => $opts['n'], 'files' => $audio_files)))) {
	echo basename(__FILE__).": couldn't make cart description file\n";
	exit(99);
}


$tcmd = sprintf("%s -cf %s -C %s %s cart.json", $tarbin, escapeshellarg($opts["o"]), $tmpdir, join(" ",$audio_files));
system($tcmd, $tarret);

if ($tarret != 0) {
	echo basename(__FILE__).": tar failed.\n";
	exit(90);
}

unlink($tmpdir.'/cart.json');
foreach ($audio_files as $a) unlink($tmpdir.'/'.$a);
if (!rmdir($tmpdir)) {
	echo basename(__FILE__).": couldn't remove $tmpdir directory.\n";
	exit(80);
}

