<?php
$url = $_SERVER["REQUEST_URI"];
$img_root = $_SERVER["DOCUMENT_ROOT"];

$pieces = explode("/", $url);
$filename = $pieces[sizeof($pieces) - 1];

$bits = explode(".", $filename);

$values = json_decode(file_get_contents($bits[0]));

$css = file_get_contents("raw.css");

foreach ($values as $key => $value) {
	if (substr($value, 0, 1) != "#")
		$value = "#" . $value;
	$css = str_replace("--" . $key . "--", $value, $css);
}

http_response_code(200);
header("Content-type: text/css");

echo $css;
