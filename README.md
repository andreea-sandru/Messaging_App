# Messaging_App

Simple messaging application using socket.io that has the following features:
- when a client connects, it has to announce its username to the server within 2 minutes; if it fails to do so, the server will disconnect it
- if the identity is already taken, the client is informed and disconnected
- if the identity is available, the server sends a broadcast to the connected clients, informing them about the fact that a new one joined
- also, the server sends a list of connected clients to the newly connected one
- a client can send a message to another one, using its identity; based on the identity, the server knows on which connection to send the message
- a client can send a message to all the other clients (broadcast)
- when a client disconnects, the server informs the remaining clients about this event

How to run the program:
- npm install (to install dependencies)
- node server.js
- node client.js <client_name>
