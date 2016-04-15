<?php 
	$url = $_SERVER["REQUEST_URI"];
	$img_root = $_SERVER["DOCUMENT_ROOT"];

	$pieces = explode("/", $url);
	$filename = $pieces[sizeof($pieces) - 1];

	$palettes = array(
		array('5DD9C1', 'ACFCD9', 'B084CC', '665687', '190933'),
		array('F9F8F8', 'CDD3CE', 'BBB5BD', 'AA6DA3', 'B118C8'),
		array('C1DBE3', 'C7DFC5', 'F6FEAA', 'FCE694', '373737'),
		array('E2EB98', '93A392', 'ADBF97', 'BAD9A2', '9DC4B5'),
		array('55DDE0', '33658A', '2F4858', 'F6AE2D', 'F26419'),
		array('384D48', '6E7271', 'ACAD94', 'D8D4D5', 'E2E2E2'),
		array('F3F9D2', 'CBEAA6', 'C0D684', '3D0B37', '63264A'),
		array('706C61', '899E8B', '99C5B5', 'AFECE7', '81F499'),
		array('CCFBFE', 'CDD6DD', 'CDCACC', 'CDACA1', 'CD8987'),
		array('FFB86F', 'E0CA3C', 'BA5C12', '3E2F5B', '261132'),
		array('A30B37', 'BD6B73', 'BBB6DF', 'C6C8EE', 'FCFCFF'),
		array('1C3144', 'D00000', 'FFBA08', 'A2AEBB', '3F88C5'),
		array('8895B3', '8E94F2', '9FA0FF', 'BBADFF', 'DAB6FC')
	);
	// got this from https://www.mathsisfun.com/combinatorics/combinations-permutations-calculator.html
	$variations = array(
		[0,1,2,3],[0,1,2,4],[0,1,3,2],[0,1,3,4],[0,1,4,2],[0,1,4,3],[0,2,1,3],[0,2,1,4],[0,2,3,1],[0,2,3,4],[0,2,4,1],[0,2,4,3],[0,3,1,2],[0,3,1,4],[0,3,2,1],[0,3,2,4],[0,3,4,1],[0,3,4,2],[0,4,1,2],[0,4,1,3],[0,4,2,1],[0,4,2,3],[0,4,3,1],[0,4,3,2],[1,0,2,3],[1,0,2,4],[1,0,3,2],[1,0,3,4],[1,0,4,2],[1,0,4,3],[1,2,0,3],[1,2,0,4],[1,2,3,0],[1,2,3,4],[1,2,4,0],[1,2,4,3],[1,3,0,2],[1,3,0,4],[1,3,2,0],[1,3,2,4],[1,3,4,0],[1,3,4,2],[1,4,0,2],[1,4,0,3],[1,4,2,0],[1,4,2,3],[1,4,3,0],[1,4,3,2],[2,0,1,3],[2,0,1,4],[2,0,3,1],[2,0,3,4],[2,0,4,1],[2,0,4,3],[2,1,0,3],[2,1,0,4],[2,1,3,0],[2,1,3,4],[2,1,4,0],[2,1,4,3],[2,3,0,1],[2,3,0,4],[2,3,1,0],[2,3,1,4],[2,3,4,0],[2,3,4,1],[2,4,0,1],[2,4,0,3],[2,4,1,0],[2,4,1,3],[2,4,3,0],[2,4,3,1],[3,0,1,2],[3,0,1,4],[3,0,2,1],[3,0,2,4],[3,0,4,1],[3,0,4,2],[3,1,0,2],[3,1,0,4],[3,1,2,0],[3,1,2,4],[3,1,4,0],[3,1,4,2],[3,2,0,1],[3,2,0,4],[3,2,1,0],[3,2,1,4],[3,2,4,0],[3,2,4,1],[3,4,0,1],[3,4,0,2],[3,4,1,0],[3,4,1,2],[3,4,2,0],[3,4,2,1],[4,0,1,2],[4,0,1,3],[4,0,2,1],[4,0,2,3],[4,0,3,1],[4,0,3,2],[4,1,0,2],[4,1,0,3],[4,1,2,0],[4,1,2,3],[4,1,3,0],[4,1,3,2],[4,2,0,1],[4,2,0,3],[4,2,1,0],[4,2,1,3],[4,2,3,0],[4,2,3,1],[4,3,0,1],[4,3,0,2],[4,3,1,0],[4,3,1,2],[4,3,2,0],[4,3,2,1]
	);


	$palette = $palettes[floor($filename / count($variations))];
	$variation = $variations[$filename % count($variations)];


	$dst_img = imagecreate(375,375);

	$c1 = hex2rgb($palette[$variation[0]]);
	$c1 = imagecolorallocate($dst_img, $c1[0], $c1[1], $c1[2]);
	$c2 = hex2rgb($palette[$variation[1]]);
	$c2 = imagecolorallocate($dst_img, $c2[0], $c2[1], $c2[2]);
	$c3 = hex2rgb($palette[$variation[2]]);
	$c3 = imagecolorallocate($dst_img, $c3[0], $c3[1], $c3[2]);
	$c4 = hex2rgb($palette[$variation[3]]);
	$c4 = imagecolorallocate($dst_img, $c4[0], $c4[1], $c4[2]);

	 	imagefilledrectangle($dst_img, 0, 0, 200, 375, $c1);
		imagefilledrectangle($dst_img, 200, 0, 300, 375, $c2);
		imagefilledrectangle($dst_img, 300, 0, 350, 375, $c3);
		imagefilledrectangle($dst_img, 350, 0, 375, 375, $c4);

	http_response_code(200);
	header("Content-type: image/gif");

	imagegif($dst_img,NULL,100);
	imagedestroy($dst_img);

function hex2rgb($hex) {
   $hex = str_replace("#", "", $hex);

   if(strlen($hex) == 3) {
      $r = hexdec(substr($hex,0,1).substr($hex,0,1));
      $g = hexdec(substr($hex,1,1).substr($hex,1,1));
      $b = hexdec(substr($hex,2,1).substr($hex,2,1));
   } else {
      $r = hexdec(substr($hex,0,2));
      $g = hexdec(substr($hex,2,2));
      $b = hexdec(substr($hex,4,2));
   }
   $rgb = array($r, $g, $b);
   //return implode(",", $rgb); // returns the rgb values separated by commas
   return $rgb; // returns an array with the rgb values
}

?>
