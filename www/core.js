$(document).ready(function() {
	var socket = io.connect('http://api.adjacency.in:4747');
	var user = {};

	var users = {};

	$(window).focus(function() {
		check_seen();
	});
	socket.on('chat message', function(msg) {
console.log(msg);
		var sent = new Date(msg.sent);
		var newmsg = '<img class="sender_img _i_' + msg.user.id + '" src="http://img.adjacency.in/' + msg.user.id + '"/>' +
				'<div class="sender_wrap"><div class="sender_info"><span class="sender_name _n_' + msg.user.id + '">' + msg.user.displayName + '</span>' +
				'<span class="send_time">' + timeFrom(sent) + '</span></div>' +
				'<div class="send_msg">' + msg.body + '</div></div>';
		var roomID = msg.recipient;
		var seen = '';
		if (msg.type == 'private') {
			if (roomID == user.id)
				roomID = msg.user.id;
			add_user_channel(msg.user.id, msg.user.displayName);
			seen = 'see';
		} else {
			if (create_room_if_needed(msg.type, roomID)) {
				add_channel(roomID, false);
			}
		}
		$('#chat > #' + msg.type + ' > #' + roomID).append($('<li>').html(newmsg).addClass(seen).attr('rel', msg.id));
		if (!is_room_shown(msg.type, msg.recipient)) {
			if (msg.type == 'public')
				$("#c_" + roomID).addClass('has_messages');
			else if (msg.type == 'private')
				$("#u_" + roomID).addClass('has_messages');
		}
	});
	socket.on('user list', function(msg) {
		users = msg;

		$("#users_list").html("");
		for (var i = 0; i < msg.length; i++) {
			$("#users_list").append($('<li>').text(msg[i].displayName).attr('rel', msg[i].id));
		}

		var disp = 'user';
		if (msg.length != 1)
			disp = 'users';
		$("#location_users").text(msg.length + " " + disp + " in room");

		init_users();
	});
	socket.on('init', function(msg) {
		if (msg.room.ssid == null)
			$("#location_name").text(msg.room.ip);
		else
			$("#location_name").text(msg.room.ssid);
		$("#channel_list").html('');
		add_channel('general', true);
		for (var i = 0; i < msg.messages.length; i++) {
			add_user_channel(msg.messages[i].id, msg.messages[i].displayName);
			$("#u_" + msg.messages[i].id).addClass('has_messages');
		}
		user = msg.user;
		Cookies.set('i',user.id, {expires: 365 * 50, path:'/', domain:'adjacency.in'});
		$("#send_msg").show();
		$("#user_name").text(user.displayName);
		$("#user_image").attr('src','http://img.adjacency.in/' + user.id);
	});
	socket.on('friend list', function(msg) {
		$("#friend_list").html("");
		for (var i = 0; i < msg.length; i++) {
			$("#friend_list").append($('<li>').text(msg[i].displayName).attr('rel', msg[i].id).attr('id','u_' + msg[i].id));
		}
		init_users();
	});
	socket.on('user profile updated', function(u) {
		if (u.id == user.id) {
			user = u;
			$("#user_name").text(user.displayName);
		}
		$("._n_" + u.id).text(u.displayName);
	});
	$("#add_channel").click(function() {
		var channel_name = prompt("Enter a channel name");
		channel_name = channel_name.replace(/\W/g,'');
		channel_name = channel_name.toLowerCase();
		if (channel_name != null && channel_name != "")
			add_channel(channel_name, true);
	});
	$("#update_username").click(function() {
		var username = prompt("Enter your new username");
		username = username.replace(/\W-/g,'');
		if (username.match(/anon-[0-9]+/))
			alert('very funny');
		else if (username != null && username != "") {
			user.displayName = username;
			socket.emit('user profile', user);
		}
	});
	$("#location_users").click(function() {
		if (!$("#right_col").is(":visible")) {
			$("#right_col").show().animate({
				width:"15%"
			}, 300, function() {
				$("#users_header, #users_list").show();
			});
			$("#center_col").animate({
				width:"70%"
			}, 300, function() {

			});
		}			
	});
	$("#users_close").click(function() {
		if ($("#right_col").is(":visible")) {
			$("#users_header, #users_list").hide();
			$("#right_col").animate({
				width:"0%"
			}, 300, function() {
				$("#right_col").hide();
			});
			$("#center_col").animate({
				width:"85%"
			}, 300, function() { });
		}
	});
	function add_channel(id, moveTo) {
			$("#channel_list").append($('<li>').attr('id', 'c_' + id).attr('class','channel').text('#' + id.toUpperCase()));
			create_room_if_needed('public',id);
			if (moveTo)
				show_room('public', id);
			init_channels();
	};
	function init_channels() {
		$(".channel").click(function() {
			var id = $(this).attr('id').substr(2);
			create_room_if_needed('public', id);
			show_room('public',id);
		});
	}
	function init_users() {
		$("#users_list > li, #friend_list > li").click(function() {
			var id = $(this).attr('rel');
			if (id != undefined && id != user.id) {
				create_room_if_needed('private', id);
				show_room('private',id);
				if ($("#u_" + id).length == 0) {
					var u = get_user_by_id(id);
					$("#friend_list").append($('<li>').text(u.displayName).attr('class', '_n_' + u.id).attr('rel', u.id).attr('id','u_' + u.id));
					init_users();
				}
			}
		});
	}
	function create_room_if_needed(type, id) {
		if ($("#chat > #" + type + " > #" + id).length == 0) {
			$("#chat > #" + type).append($('<div id="' + id + '">'));
			return true;
		}
		return false;
	}
	function is_room_shown(type, id) {
		return $("#chat > #" + type + " > #" + id).is(":visible");
	}
	function get_user_by_id(id) {
		for (var i = 0; i < users.length; i++) {
			if (users[i].id == id) {
				return users[i];
			}
		}
	}
	function show_room(type, id) {
		$("#chat > #public > div, #chat > #private > div").hide();
		$("#chat > #" + type + " > #" + id).show();
		$("#channel_list li").removeClass('active');
		$("#friend_list li").removeClass('active');
		if (type == 'public') {
			$("#channel_name").html("#" + id).attr('class','');
			$("#c_" + id).removeClass('has_messages');
			$("#c_" + id).addClass('active');
			handleResize();
		} else {
			var u = get_user_by_id(id);
			$("#channel_name").html("@" + u.displayName).attr('class','_n_' + u.id);
			$("#u_" + id).removeClass('has_messages');
			$("#u_" + id).addClass('active');
			handleResize();
		}
		check_seen();
	}
	function get_current_room() {
		var rm = $("#chat > div > div:visible");
		var out = {};
		out.id = rm.attr('id');
		out.type = rm.parent().attr('id');
		return out;
	}
	function check_seen() {
		$("#chat > div > div:visible .see").each(function() {
			// at some point, will need to check for actual visibility, but just do this for now
			socket.emit('seen',{id: $(this).attr('rel')});
		});
	}
	function add_user_channel(userID, userName) {
		create_room_if_needed('private', userID);
		if ($("#u_" + userID).length == 0) {
			$("#friend_list").append($('<li>').attr('rel',userID).addClass('_n_' + userID).attr('id',"u_" + userID).text(userName));
			init_users();
		}
	}
	function timeFrom(d) {
		var curr_hour = d.getHours();
		if (curr_hour < 12) {
			a_p = "AM";
		} else {
			a_p = "PM";
		}
		if (curr_hour == 0) {
			curr_hour = 12;
		}
		if (curr_hour > 12) {
			curr_hour = curr_hour - 12;
		}
		var curr_min = d.getMinutes();
		curr_min = curr_min + "";
		if (curr_min.length == 1) {
			curr_min = "0" + curr_min;
		}
		return curr_hour + ":" + curr_min + " " + a_p;
	}
	var wht = $(window).height();
	$(window).resize(function() {
		wht = $(window).height();
		handleResize();
	});
	function handleResize() {
		var ht = $("#send_msg").height() + 20;
		$("#bottom_section").height(ht);
		var diff = wht - ht;
		$("#top_section").height(diff);
		var topht = $("#channel_name").height() + 10;
		$("#top_row").height(topht);
		$("#chat").height($("#center_col").height() - topht);
	}
	handleResize();
	$("#m").autosize({
		append: '',
		callback: function() {
			handleResize();
		}

	}).keypress(function(event) {
		var key = event.keyCode || event.which;
		if (key === 13) {
			$('form').submit();
			return false;
		}
	});
	$('form').submit(function(){
		var msg = {};
		msg.body = $("#m").val();
		var rm = get_current_room();
		msg.type = rm.type;
		msg.recipient = rm.id;
		socket.emit('chat message', msg);
		$('#m').val('');
		$("#m").trigger('autosize.resize');
		return false;
	});
});
