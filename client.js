let clientsHashMap = new Map();

const io = require("socket.io-client");
const ioClient = io.connect("http://localhost:8000");
const readline = require('readline');
const { exit } = require("process");
let client_msg_input = [];

var r1 = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

var myArgs = process.argv.slice(2);

if (myArgs.length != 1) {
	console.log('Number of args different than expected number (1). Exiting.');
	exit();
}

ioClient.on('connect', function() {
	// sending name of client to the server
	ioClient.emit("username", {
		username: myArgs[0]
	});

	// receiving a message from client
	ioClient.on("message_from_sever", (msg) => console.info(msg));

	// receiving a broadcast with info of a new client
	ioClient.on("broadcast", (msg) => {
		console.log('broadcast received:');
		console.info(msg);
		clientsHashMap.set(msg.client_name, msg.client_id);
	});

	// receiving a list of already connected cleints
	ioClient.on("connected_clients", (conn_clients) => {
		console.log("list of already connected clients:");
		console.log(conn_clients);

		// adding clients to local existing clients list
		conn_clients.forEach(function(item, index) {
			let key = item[0];
			let val = item[1];
			clientsHashMap.set(key, val);
		})
	});

	// receiving a message from another client
	ioClient.on('message_from_client', (msg) => {
		console.log("Received message from client " + msg.source_name + ' :' + msg.message);
	});

	// receiving a disconnected_client message from server
	ioClient.on("client_disconnected", (msg) => {
		console.log("Client " + msg.client_name + " disconnected. Removing from client's list");
		clientsHashMap.delete(msg.client_id);
	});

	// receiving close message from server
	ioClient.on("close", (msg) => {
		console.info(msg);
		exit();
	});

	// writing sender & message to stdin for communication with other clients
	r1.on('line', function(line) {
    let text = line.toString().trim();
    if(text == 'exit') {
      exit();
    }

    // add line to input lines
		client_msg_input.push(text);
    
    // if both username & message are written => send to server
		if (client_msg_input.length == 2) {
			let name = client_msg_input[0].toString().trim();
			let msg = client_msg_input[1].toString().trim();

			console.log('Sending message ' + msg + ' to ' + name);
			// sending message to server to be redirected to destination
			ioClient.emit("message_to_client", {
				username: name,
				message: msg
			});

			// clearing input lines
			client_msg_input = [];
		} else {
			console.log('Please insert message for ' + client_msg_input[0] + ': ');
		}
	});
});