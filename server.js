var http = require('http');
var express = require('express');
var WebSocket = require('ws');


var app = express();
var server = http.createServer(app);
var io = require('socket.io')(server);

const router = require("./src/router.js");
var entrants = [];

const bells = require("./src/bells.js");
var numbells = 6; 
var playing = false;
var state = {speed: 2};
let disconnected = [];

app.use(express.static('public'));
//console.log(entrants[-1])

router(io);


//
const listener = server.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
