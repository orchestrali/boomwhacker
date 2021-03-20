var entrants = [];
const bells = require("./bells.js");
var numbells = 6; 
var playing = false;
var state = {
  speed: 2
};
let disconnected = [];

module.exports = function router(io) {
  
  io.on("connection", (socket) => {
    console.log("a user connected");
    console.log(entrants.length);
    //send the bells object
    socket.emit('bells', bells);
    //send names to check if any are already in use
    socket.emit('names', entrants.map(e => e.name));
    if (disconnected.length) {
      console.log("disconnected has length");
      socket.emit('prevnames', disconnected.map(e => e.name));
    }
    
    //stage change
    socket.on('stage', (num) => {
      console.log("stage change: "+num);
      numbells = num;
      socket.broadcast.emit('stagechange', numbells);
    });
    
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
    
    //assign ringer to places
    socket.on('assign', (obj) => {
      let person = entrants.find(e => e.name === obj.name);
      if (person) person.pair = obj.pair;
      io.emit('assign', entrants);
    });
    
    socket.on('speed', (s) => {
      io.emit('speed', s);
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

    
    socket.on("chat", (data) => {
      io.emit("message", {type: "chat", info: data});
    });
    
    socket.on('method', (obj) => {
      io.emit('method', obj);
    });
    
    socket.on('disconnect', () => {
      console.log("user disconnected");
      let i = entrants.findIndex(e => e.id === socket.id);
      if (i > -1) {
        console.log(entrants[i].name);
        disconnected.push(entrants.splice(i, 1));
        io.emit('message', {type: "entrants", info: entrants});
      }
    });
    
    
    
  });
  
  
  
  
}