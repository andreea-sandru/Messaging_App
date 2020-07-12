const { strict } = require('assert');
const { connect } = require('socket.io-client');
const { exit } = require('process');

let usersHashMap = new Map();
let name = null;

const io = require('socket.io')(8000, {
	// engine.IO options
	pingInterval: 10000,
	pingTimeout: 5000,
	cookie: false
});

// function that returns key corresponding to given value
function getByValue(map, searchValue) {
	for (let [key, value] of map.entries()) {
		if (value === searchValue)
			return key;
	}
}

// event fired every time a new client connects:
io.on("connection", (socket) => {
	console.info(`Client connected [id=${socket.id}]`);
  name = null;

	// Check if we received the client's username
	setTimeout(function() {
		if (name == null) {
			console.log('Disconnecting client with id = ' + socket.id);
			socket.disconnect();
		}
	}, 2000);

	socket.on("username", (msg) => {
		name = msg;
    console.log(msg);
    
    // checking if client username already exists
		if (usersHashMap.has(msg.username)) {
			socket.emit("message_from_sever", "Username already exists. Exiting.");
			socket.disconnect();
		} else {

			// sending to all other clients the newly connected client
			const client_info = {
				client_id: socket.id,
				client_name: msg.username
			};

			console.log("sending broadcast to other clients");
			socket.broadcast.emit("broadcast", client_info);

			console.log("sending list of connected clients to the new client:");
			console.log(Array.from(usersHashMap));
			// sending to the new client a list of connected clients
			socket.emit("connected_clients", Array.from(usersHashMap));

			// updating the client's hashmap with the new user
			usersHashMap.set(msg.username, socket.id);
		}
	});

	socket.on("message_to_client", (msg) => {
		username = msg.username;
		message = msg.message;
		let source_name = getByValue(usersHashMap, socket.id);
		const message_to_client = {
			source_name: source_name,
			message: msg.message
		};

		if (msg.username == 'all') {
			console.log('Forwarding message ' + msg.message + ' to all clients');
			socket.broadcast.emit("message_from_client", message_to_client);
		} else if (usersHashMap.has(msg.username)) {
			let dest_id = usersHashMap.get(username);
			console.log('Forwarding message ' + msg.message + ' to client ' + msg.username);
			socket.to(dest_id).emit('message_from_client', message_to_client);
		} else {
			socket.emit("message_from_sever", "Username " + msg.username + ' does not exist. Message not sent.');
		}
	});

	// when socket disconnects, remove it from the list:
	socket.on("disconnect", () => {
		console.info(`Client gone [id=${socket.id}]`);
    
    const client_info = {
			client_id: socket.id,
			client_name: getByValue(usersHashMap, socket.id)
		};

		// sending to all other clients name of disconnected client
		socket.broadcast.emit("client_disconnected", client_info);

		// deleting data of disconnected client
		usersHashMap.delete(socket.id);
	});
});

process.stdin.on("data", data => {
  if(data.toString().trim() == 'exit') {
    console.log('Exiting.');
    io.emit("close", "Exiting.");
    exit();
  }
});