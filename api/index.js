var express = require('express');
var app = express();
var server = app.listen(4747);
var sockets = require('socket.io')({
	'transports': ['websocket', 'flashsocket','htmlfile','xhr-polling','jsonp-polling']
});
var io = sockets.listen(server);

var mysql = require('promise-mysql');
var connection = mysql.createPool({
	host: 'localhost',
	user: 'chuckleh',
	password: '$ix7edge$',
	database: 'adjacency',
	connectionLimit: 20
});

var socketsToUserMap = {};
var userData = {};

io.on('connection', function(socket) {
	var cookies = socket.handshake.headers.cookie;
	var ip = socket.handshake.address;
	var userID = 0;
	var deviceID = null;
	var user = null;
	var room = null;
	if (cookies != undefined) {
		cookies.split(';').forEach(function(cookie) {
			var parts = cookie.match(/(.*?)=(.*)$/);
			if (parts[1].trim() == 'i') {
				userID = parts[2];
			} else if (parts[1].trim() == 'd') {
				deviceID = parts[2];
			}
		});
	}
	socket.join(ip);
	var roomID = 0;
	connection.query("SELECT * FROM rooms WHERE ip = ?", [ip]).then(function(rows) {
		if (rows.length == 0) {
			connection.query("INSERT IGNORE INTO rooms (ip) VALUES (?)", [ip]).then(function(rows) {
				connection.query("SELECT * FROM rooms WHERE ip = ?", [ip]).then(function(rows) {
					roomID = rows[0].id;
					room = rows[0];
					init(io, socket.id, room, user);
				});
			});
		} else {
			roomID = rows[0].id;
			room = rows[0];
			init(io, socket.id, room, user);
		}
	});
	var user_query;
	if (userID == 0) {
		user_query = connection.query("INSERT IGNORE INTO users (displayName) VALUES (NULL)");
	} else {
		user_query = connection.query("SELECT * FROM users WHERE id = ?", [userID]);
	}
	user_query.then(function(rows) {

		if (userID == 0) {
			userID = rows.insertId;
			user = {
				id: userID,
				displayName: 'anon-' + userID
			};
		} else {
			user = rows[0];
		}
		socketsToUserMap[socket.id] = userID;
		rows = format_anon_usernames(rows);
		if (userData[userID] == undefined) {
			userData[userID] = user;
			userData[userID].connections = {};
		} else {
			// OKAY, SO THIS USER HAS CONNECTED A SECOND TIME
			// IF YOU FIND A DEVICE ID IN USE ON A DIFFERENT IP, BOOT
			var sockets = Object.keys(userData[userID].connections);
			for (var i = 0; i < sockets.length; i++) {
				var connData = userData[userID].connections[sockets[i]];
				if (connData.device == deviceID && connData.ip != ip 
					&& io.sockets.connected[sockets[i]] != undefined) {
						io.sockets.connected[sockets[i]].disconnect();
						userData[userID] = user;
						userData[userID].connections = {};
				}
			}
			
		}
		userData[userID].connections[socket.id] = {
			device: deviceID,
			ip: ip
		};
		init(io, socket.id, room, user);

		outputRoomUsers(io, ip);
	});
	connection.query("SELECT * FROM users u WHERE id IN (SELECT requesterID FROM friends WHERE recipientID = ? UNION SELECT recipientID FROM friends WHERE requesterID = ?);", [userID, userID]).then(function(rows) {
		io.to(socket.id).emit('friend list', rows);
	});
	console.log('adding ' + socket.id + ' to ' + ip);

	socket.on('disconnect', function(){
		console.log('removing ' + socket.id + ' from ' + ip);
		if (room != null)
			connection.query("INSERT INTO room_activity (userID, roomID, activityTime, activityType) VALUES(?, ?, NOW(), ?)", [user.id, room.id, 'exit']);
		var uID = socketsToUserMap[socket.id];
		delete socketsToUserMap[socket.id];
		delete userData[uID].connections[socket.id];
		if (Object.keys(userData[uID].connections).length == 0)
			delete userData[uID];
		
		var roomUsers = [];
		if (io.nsps["/"].adapter.rooms[ip]) {
			var roomSockets = Object.keys(io.nsps["/"].adapter.rooms[ip].sockets);
			for (var i = 0; i < roomSockets.length; i++) {
				var uID = socketsToUserMap[roomSockets[i]];
				roomUsers[uID] = userData[uID];
			}
		}
		io.to(ip).emit('user list', flattenAssociativeArray(roomUsers));
	});
	socket.on('chat message', function(msg) {
		// DUDE.  DON'T SEND ALL OF THIS!
		msg.user = userData[userID];
		var now = new Date();
		msg.sent = now.getTime();
		if (msg.type == "public") {
			io.to(ip).emit('chat message', msg);
			console.log("Sending to " + ip);
			connection.query("INSERT INTO messages (message, roomID, senderID, created, channel) VALUES (?, ?, ?, NOW(6), ?)", [msg.body, roomID, userID, msg.recipient]);
		} else if (msg.type == "private") {
			// SEND TO SENDER
			var socketIDs = Object.keys(userData[userID].connections);
			for (var i = 0; i < socketIDs.length; i++) {
				var socketid = socketIDs[i];
				if (io.sockets.connected[socketid]) {
					io.sockets.connected[socketid].emit('chat message', msg);
					console.log("Sending to " + socketid);
				}
			}
			// SEND TO RECIPIENT
			connection.query("INSERT INTO messages (message, senderID, created, recipientID) VALUES (?, ?, NOW(6), ?)", [msg.body, userID, msg.recipient]).then(function(result) {
				msg.id = result.insertId;
				var socketIDs = Object.keys(userData[msg.recipient].connections);
				for (var i = 0; i < socketIDs.length; i++) {
					var socketid = socketIDs[i];
					if (io.sockets.connected[socketid]) {
						io.sockets.connected[socketid].emit('chat message', msg);
						console.log("Sending to " + socketid);
					}
				}
			});
		}
		console.log(msg);
	});
	socket.on('user profile', function(msg) {
		if (userID != msg.id)
			return false;
		// put a check on the name here, just in case
		connection.query("UPDATE users SET displayName = ? WHERE id = ?", [msg.displayName, userID]).then(function(rows) {
			user.displayName = msg.displayName;
			userData[userID].displayName = msg.displayName;
			outputRoomUsers(io, ip);
			io.to(ip).emit('user profile updated', user);
			// at some point will need to update users in this users' friends list, even
			// if they are not in the same room

		});
	});
	socket.on('seen', function(msg) {
		console.log('mark ' + msg.id + ' as seen');
		connection.query("UPDATE messages SET seen = 1 WHERE id = ?", [msg.id]);
	});
});

function flattenAssociativeArray(obj) {
	var out = [];
	var keys = Object.keys(obj);
	for (var i = 0; i < keys.length; i++) {
		out.push(obj[keys[i]]);
	}
	return out;
}

function format_anon_usernames(rows) {
	for (var i = 0; i < rows.length; i++) {
		if (rows[i].displayName == null)
			rows[i].displayName = 'anon-' + rows[i].id;
		else
			rows[i].displayName = rows[i].displayName.toLowerCase();
	}
	return rows;
}
function outputRoomUsers(io, ip) {
		var roomSockets = Object.keys(io.nsps["/"].adapter.rooms[ip].sockets);
		var roomUsers = {};
		for (var i = 0; i < roomSockets.length; i++) {
			var uID = socketsToUserMap[roomSockets[i]];
			roomUsers[uID] = userData[uID];
		}

		io.to(ip).emit('user list', flattenAssociativeArray(roomUsers));

}
function init(io, id, room, user) {
	if (room == null || user == null)
		return false;
	connection.query("SELECT DISTINCT u.id, u.displayName FROM users u INNER JOIN messages m ON u.id = m.senderID WHERE recipientID = ? AND seen = 0", [user.id]).then(function(rows) {
		rows = format_anon_usernames(rows);
		io.to(id).emit('init',{room:room, user:user, messages: rows});
		connection.query("INSERT INTO room_activity (userID, roomID, activityTime, activityType) VALUES(?, ?, NOW(), ?)", [user.id, room.id, 'enter']);
	});
}
