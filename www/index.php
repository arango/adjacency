<?php
	if (!isset($_COOKIE["d"])) {
		$deviceID = uniqid("", true);
		setcookie('d', $deviceID, time()+60*60*24*365*50, '/', 'adjacency.in');
		$_COOKIE["d"]= $deviceID;
	}

?><!doctype html>
<html>
<head>
	<title>adjacency</title>
	<meta charset="UTF-8" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=0">
	<link href="https://fonts.googleapis.com/css?family=Arimo:400,400italic,700,700italic" rel="stylesheet" type="text/css"/>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css" type="text/css"/>
	<link href="/css/p4.css" rel="stylesheet" type="text/css"/>

</head>
<body>
	<div id="top_section">
		<div id="left_col">
			<div id="location_info">
				<div id="location_name"></div>
				<div id="location_users"></div>
			</div>
			<div id="user_info">
				<img id="user_image">
				<div id="user_name_wrapper">
					<div id="user_name"></div>
					<div id="update_username">Change Username</div>
				</div>
			</div>
			<div class="scrollable">
				<div id="channel_header_wrapper">
					<div id="add_channel"><i class="fa fa-plus-circle"></i></div>
					<div id="channel_header">Channels</div>
				</div>
				<div id="channel_list"></div>
				<div id="friends_header">Direct Messages</div>
				<div id="friend_list"></div>
			</div>
		</div>

		<div id="center_col">
			<div id="top_row"><div id="channel_name"></div></div>
			<div id="chat">
				<div id="public"></div>
				<div id="private"></div>
			</div>
		</div>
		<div id="right_col">
			<div id="users_header">
				<div id="users_close"><i class="fa fa-close"></i></div>
				<div>Users in Room</div>
			</div>
			<div class="scrollable">
				<div id="users_list"></div>
			</div>
		</div>
	</div>
	<div id="bottom_section">
		<form action="" id="send_msg">
			<textarea id="m" autocomplete="off" rows="1"></textarea>
		</form>
	</div>
</body>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.0/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/js-cookie/2.1.0/js.cookie.min.js"></script>
<script src="/js/autosize.min.js"></script>
<script src="http://api.adjacency.in:4747/socket.io/socket.io.js"></script>
<script src="/core.js"></script>
</html>

