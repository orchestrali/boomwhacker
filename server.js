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

app.use(express.static('public'));
//console.log(entrants[-1])
//
io.on('connection', (socket) => {
  console.log("a user connected");
  console.log(entrants.length);
  //send the bells object
  socket.emit('bells', bells);
  //send names to check if any are already in use
  socket.emit('names', entrants.map(e => e.name));
  
  socket.on('entrant', (obj) => {
    if ([process.env.SECRET, process.env.CAPTAIN].includes(obj.secret)) {
      //add person to list, send list, send socket the current stage
      entrants.push({name: obj.name, id: socket.id, conductor: obj.secret === process.env.CAPTAIN});
      socket.emit('numbells', {num: numbells, playing: playing, status: state});
      //
      io.emit('entrance', {info: entrants});
      
      //io.emit('message', {type: "entrants", info: entrants});
    } else {
      socket.emit('wrong', "");
    }
    
  });
  
  socket.on('speed', (s) => {
    io.emit('speed', s);
  });
  
  //stage change
  socket.on('stage', (num) => {
    console.log("stage change: "+num);
    numbells = num;
    socket.broadcast.emit('stagechange', numbells);
  });
  
  //playing
  socket.on('start', () => {
    playing = true;
    io.emit('start');
  });
  socket.on('stop', (status) => {
    playing = false;
    state = status;
    io.emit('stop', status);
  });
  
  socket.on('reset', () => {
    state = {speed: state.speed};
    io.emit('reset');
  });
  
  //change as in change ringing
  socket.on('change', (obj) => {
    io.emit('change', obj);
  });
  
  //assign ringer to places
  socket.on('assign', (obj) => {
    let person = entrants.find(e => e.name === obj.name);
    if (person) person.pair = obj.pair;
    io.emit('assign', entrants);
  });
  
  
  socket.on('message', (data) => {
    //console.log(data);
    io.emit('message', router(data, socket.id)); //JSON.stringify(router(data), null, 2)
  });
  
  socket.on('disconnect', () => {
    console.log("user disconnected");
    let i = entrants.findIndex(e => e.id === socket.id);
    if (i > -1) {
      console.log(entrants[i].name);
      entrants.splice(i, 1);
      io.emit('message', {type: "entrants", info: entrants});
    }
  });
});

/*
wsserver.on('connection', function connection(ws, req) {
  console.log(req.accept);
  ws.on('message', function(data) {
    let num = 0;
    // Broadcast the message to all open clients
    wsserver.clients.forEach(function (client) {
      num++;
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(router(data, req)), null, 2);
      }
    });
    console.log(num + " clients");
  });
});

wsserver.on('close', function close(ws) {
  console.log("someone left??");
});
*/
//
const listener = server.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
