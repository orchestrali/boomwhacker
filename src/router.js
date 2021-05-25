const parsepn = require('./pn/router.js');
const complib = require('./complib/router.js');
const rowArray = require('./rowArray.js');
var entrants = [];
const bells = require("./bells.js");
var numbells = 6; 
var playing = false;
var state = {
  speed: 2,
  currentrow: [1,2,3,4,5,6],
  insidepairs: [-1,-1,-1,-1,-1,-1],
  rownum: 0
};
let disconnected = [];
var limbo = [];
var timeout;
var count = 0;
var robotplace;

module.exports = function router(io) {
  
  io.on("connection", (socket) => {
    console.log("a user connected");
    console.log(entrants.length);
    //send the bells object
    socket.emit('bells', bells);
    
    
    if (disconnected.length) {
      console.log("disconnected has length");
      socket.emit('prevnames', disconnected.map(e => e.name));
    }
    
    socket.on("error", e => {
      console.log(e);
    });
    
    //stage change
    socket.on('stage', (num) => {
      console.log("stage change: "+num);
      numbells = num;
      resetstate();
      
      socket.broadcast.emit('stagechange', numbells);
    });
    
    
    socket.on('entrant', (obj) => {
      if ([process.env.SECRET, process.env.CAPTAIN].includes(obj.secret)) {
        if (entrants.map(e => e.name).includes(obj.name)) {
          socket.emit("duplicate", "");
        } else {
          //add person to list, send list, send socket the current stage
          let o = {name: obj.name, id: socket.id, conductor: obj.secret === process.env.CAPTAIN};
          entrants.push(o);
          socket.emit('numbells', {num: numbells, playing: playing, status: state, info: entrants});
          //
          socket.broadcast.emit('entrance', {info: o});
        }
        

        //io.emit('message', {type: "entrants", info: entrants});
      } else {
        socket.emit('wrong', "");
      }

    });
    
    socket.on("reenter", o => {
      let e = entrants.find(p => p.name === o.name);
      if (e && limbo.includes(e.id)) {
        let i = limbo.indexOf(e.id);
        limbo.splice(i,1);
        e.id = socket.id;
        clearTimeout(timeout);
        socket.emit("reopen", state);
      }
    });
    
    //assign ringer to places
    socket.on('assign', (obj) => {
      let person = entrants.find(e => e.name === obj.name);
      if (person) person.pair = obj.pair;
      if (obj.name === "Sidra🤖") {
        person.pairs = obj.pairs;
      }
      io.emit('assign', entrants);
    });
    
    //change row speed
    socket.on('speed', (s) => {
      state.speed = s;
      io.emit('speed', s);
    });
    
    //playing
    socket.on('start', () => {
      playing = true;
      io.emit('start');
    });
    socket.on('stop', (status) => {
      playing = false;
      
      io.emit('stop', status);
    });

    socket.on('reset', () => {
      resetstate();
      
      io.emit('reset');
    });
    
    //change as in change ringing
    socket.on('change', (obj) => {
      let row = ringchange(obj);
      if (row.length) {
        state.currentrow = row;
        io.emit("nextrow", {row: row, insides: state.insidepairs});
      }
      //io.emit('change', obj);
    });
    
    socket.on('robotring', (o) => {
      //console.log(state.rownum);
      //console.log(o);
      if (entrants.length < 3 || count >= entrants.length-1) {
        if (o.row >= state.rownum && (o.place === robotplace || entrants.length < 3) && o.row < state[state.simulator].rows.length-1) {
          if (entrants.length < 3 && o.row === state.rownum+1) state.rownum++;
          robotplace = o.place;
          let change = {pair: robotplace};
          let oldrow = state[state.simulator].rows[state.rownum].row;
          let row = state[state.simulator].rows[state.rownum+1].row;
          if (oldrow[robotplace-1] === row[robotplace] && oldrow[robotplace] === row[robotplace-1]) {
            change.type = "cross";
          } else if (oldrow[robotplace-1] === row[robotplace-1] && oldrow[robotplace] != row[robotplace]) {
            change.type = "stretchL";
          } else if (oldrow[robotplace-1] != row[robotplace-1] && oldrow[robotplace] === row[robotplace]) {
            change.type = "stretchR";
          } else if (oldrow[robotplace-1] != row[robotplace-1] && oldrow[robotplace] != row[robotplace]) {
            change.type = "stretch";
          }
          
          let nrow = ringchange(change);
          if (nrow.length) {
            //console.log(nrow);
            state.currentrow = nrow;
            io.emit("nextrow", {row: nrow, insides: state.insidepairs});
          }
          robotplace = null;
          count = 0;
        }
      } else {
        if (o.row === state.rownum+1) {
          state.rownum++;
        }
        if (o.row === state.rownum && (!robotplace || o.place === robotplace)) {
          robotplace = o.place;
          count++;
          console.log(count);
        }
      }
    });

    
    socket.on("chat", (data) => {
      io.emit("message", {type: "chat", info: data});
    });
    
    socket.on('method', (obj) => {
      rowArray(obj, numbells);
      state.method = obj;
      state.comp = null;
      state.simulator = "method";
      addRobot();
      io.emit('method', obj);
    });
    socket.on("placenot", (o) => {
      let method = {title: o.pn, pn: parsepn(o), stage: o.stage};
      if (method.pn) {
        rowArray(method, numbells);
        state.method = method;
        state.comp = null;
        state.simulator = "method";
        addRobot();
        io.emit("method", method);
      } else {
        console.log(o);
        //invalid pn
        socket.emit("method", method);
      }
    });
    socket.on("complib", id => {
      complib(id, composition => {
        if (composition) {
          if (composition.stage > numbells) {
            numbells = composition.stage % 2 === 0 ? composition.stage : composition.stage+1;
            resetstate();
            io.emit("stagechange", numbells);
          }
          state.method = null;
          state.comp = composition;
          state.simulator = "comp";
          addRobot();
          io.emit("composition", composition);
        } else {
          socket.emit("composition", {error: "Error finding composition"});
        }
      });
    });
    
    socket.on("disconnect", (r) => {
      console.log("user disconnected");
      if (["ping timeout", "transport close", "transport error"].includes(r)) {
        limbo.push(socket.id);
        setTimeout(function() {
          for (let i = limbo.length-1; i > -1; i--) {
            disconnect(limbo[i]);
          }
        }, 3000)
      } else {
        disconnect(socket.id);
      }
      
      
    });
    
    function addRobot() {
      if (!entrants.find(o => o.name === "Sidra🤖")) {
        entrants.push({name: "Sidra🤖", pairs: []});
        io.emit('entrance', {info: {name: "Sidra🤖", pairs: []}});
      }
    }
    
    
    function disconnect(id) {
      let i = entrants.findIndex(e => e.id === id);
      if (i > -1) {
        console.log(entrants[i].name);
        io.emit('exit', {info: entrants[i]});
        entrants.splice(i, 1);
        
      } 
      if (entrants.length === 0 || (entrants.length === 1 && state.simulator)) {
        entrants = [];
        state.simulator = false;
        state.method = null;
        state.comp = null;
        resetstate();
      }
      let j = limbo.indexOf(id);
      if (j > -1) limbo.splice(j,1);
    }
    
    
    
  });
  
  
  
  
}

function resetstate() {
  state.currentrow = [];
  state.insidepairs = [];
  for (let i = 1; i <= numbells; i++) {
    state.currentrow.push(i);
    state.insidepairs.push(-1);
  }
  state.rownum = 0;
}

function ringchange(obj) {
  //console.log(obj);
  let oldrow = state.currentrow;
  let row = [];
  if (obj.type === "cross") {
    for (let i = 1; i < numbells; i+=2) {
      if (obj.pair === i) {
        row.push(oldrow[i], oldrow[i-1]);
        state.insidepairs[i-1] = -1;
        state.insidepairs[i] = -1;
      } else {
        row.push(oldrow[i-1], oldrow[i]);
      }
    }
  } else if (obj.type != "places") {
    row.push(oldrow[0]);
    let insides = [];
    
    for (let i = 1; i < numbells; i+=2) {
      if (obj.pair === i) {
        insides.push(["stretchR","stretch"].includes(obj.type) ? 1 : -1);
        insides.push(["stretchL","stretch"].includes(obj.type) ? 1 : -1);
      } else {
        insides.push(-1,-1);
      }
    }
    //console.log(insides);
    for (let i = 1; i < numbells-1; i+=2) {
      if ((state.insidepairs[i] === 1 && insides[i+1] === 1) || (state.insidepairs[i+1] === 1 && insides[i] === 1)) {
        row.push(oldrow[i+1], oldrow[i]);
        state.insidepairs[i] = -1, state.insidepairs[i+1] = -1;
      } else {
        row.push(oldrow[i], oldrow[i+1]);
        if (insides[i] === 1) state.insidepairs[i] *= -1;
        if (insides[i+1] === 1) state.insidepairs[i+1] *= -1;
      }
    }
    row.push(oldrow[numbells-1]);
  }
  return row;
}