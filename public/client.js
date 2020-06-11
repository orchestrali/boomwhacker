$("#container").hide();

$(function() {
  

  var name;
  var socket = window.io();
  var ready = false;
  var textarea = document.querySelector('textarea');
  var input = document.querySelector('input#chat');
  var stages = ["minimus", "minor", "major", "royal", "maximus", "fourteen", "sixteen"];
  var bells;
  var numbells;
  var currentrow = [];

  var captain = false;
  var disconnected = false;
  var delay = 500;
  var playing = false;
  
  var bellurl = "https://cdn.glitch.com/3222d552-1e4d-4657-8891-89dc006ccce8%2F";
  

  //enter the chamber
  $("#enterbutton").on("click", function(e) {
    for (let i = 0; i < bells.length; i++) {
      ring(bells[i].sound);
    }
    name = $("#name").val();
    let secret = $("#secret").val();
    if (name.length && !/^\s+$/.test(name) && secret.length && !/^[^\w]+$/.test(secret)) {
      socket.emit("entrant", {name: name, secret: secret});

    } else {
      $("#name").val("");
      $("#secret").val("");
      $("#name").attr("placeholder", "invalid name or wrong secret");
    }

  });
  
  //send chat messages
  input.addEventListener('change', function(e) {
    socket.emit("message", "chat " + name + ": " + input.value);
    input.value = "";
  });
  
  //allow captain(s) to change number of bells
  $("#numbells li").on("click", function(e) {
    if (captain) {
      let n = Number($(this).text());
      socket.emit("stage", n);
      updatestage(n);
    }
  });
  
  
  
  //when this socket actually enters the chamber
  socket.on("entrance", function(m) {
    if (!disconnected) {
      for (let i = 0; i < bells.length; i++) {
        bells[i].sound.src = bellurl + bells[i].url;
      }
      
      ready = true;
      console.log(ready);
      input.placeholder = "Say something, " + name;
      updatelist(m);
      $("#enter").hide();
      $("#container").show();
      if (captain) {
        //$("#numbells").after('<ul id="conduct"> <li id="start">Start</li><li id="reset">Reset</li> </ul>');
        $("#conduct").show();
      }
    }
    
  });
  
  $("#start").on("click", function() {
    console.log("starting play?");
    console.log(currentrow);
    console.log(bells[0].sound.currentTime);
    play(currentrow, 0);
  });
  
  //get the bells array from the server
  socket.on("bells", (bb) => {
    bells = bb;
    for (let i = 0; i < bells.length; i++) {
      bells[i].sound = new Audio();
      bells[i].sound.src = "";
    }
  });
  
  //get number of bells on entrance
  socket.on("numbells", (num) => {
    console.log("numbells: "+num);
    numbells = num;
    for (let i = 0; i < numbells; i++) {
      currentrow.push(i+1);
      addBell(bells[i]);
    }
    if (numbells != 6) {
      $("#numbells li").css({color: "black", "background-color": "white"});
      let stage = stages[(numbells-4)/2];
      $("li#"+stage).css({color: "white", "background-color": "black"});
    }
    bellnums();
  });
  
  //stagechange from a(nother) captain
  socket.on("stagechange", (n) => {
    updatestage(n);
  });
  
  
  socket.on("message", function(m) {
    if (ready) {
      console.log("message");
    //let m = JSON.parse(e);
      if (m.type === "chat") {
        textarea.value += m.info + "\n";
      } else if (m.type === "entrants") {
        updatelist(m);
      }
    }
    
  });
  
  socket.on("error", (err) => {
    console.log("error");
    console.log(Object.keys(err));
  });
  
  socket.on("disconnect", () => {
    ready = false;
    captain = false;
    disconnected = true;
    $("#container").hide();
    $("#enter").hide();
    $("#closed").show();
  });
  
  function updatelist(m) {
    $("#entrants li").remove();
    m.info.forEach((e) => {
      let c = e.conductor ? " (C)" : "";
      $("#entrants").append("<li>"+e.name+c+"</li>");
      if (e.name === name && e.conductor) {
        captain = true;
        $("#numbells li:hover").css("cursor", "pointer");
      }
    });
  }
  
  function updatestage(n) {
    if (n > numbells) {
      for (let i = numbells; i < n; i++) {
        addBell(bells[i]);
        currentrow.push(i+1);
      }
    } else if (n < numbells) {
      let x = numbells-n;
      currentrow = currentrow.slice(0, n);
      $("div.bell:nth-last-child(-n+"+x+")").detach();
    }
    numbells = n;
    $("#numbells li").css({color: "black", "background-color": "white"});
    let stage = stages[(numbells-4)/2];
    $("li#"+stage).css({color: "white", "background-color": "black"});
    bellnums();
  }
  
  function bellnums() {
    let num = numbells;
    $("div.bell p").remove();
    for (let i = 0; i < bells.length; i++) {
      if (num > 0) {
        $("#"+bells[i].bell + " div.handle").append("<p>"+num+"</p>");
        bells[i].num = num;
      } else {
        delete bells[i].num;
      }
      num--;
    }
  }
  
  var timeout;
  function play(row, i) {
    let bell = bells.find(b => b.num === row[i]);
    if (bell) {
      ring(bell.sound);
    }
    if (i < row.length-1) {
      timeout = setTimeout(play, delay, row, i+1);
    } else {
      
      clearTimeout(timeout);
    }
    
  }
  
  async function ring(sound) {
    
    console.log("ringing");
    try {
      await sound.play();
    } catch (err) {
      console.log("error");
      console.log(err.message);
    }
    
  }
  
  
  
  var svgurl = "http://www.w3.org/2000/svg";
  var pathinfo = {d: `M10,5
               H90
               q -20 20, -20 60
               q -20 10, -40 0
               q 0 -40, -20 -60
               `,
                 "stroke-width": "2",
                 stroke: "black"};
  function addBell(bell) {
    let svg = document.createElementNS(svgurl, "svg");
    let info = {width: "100", height: "100", viewBox: bell.viewbox};
    for (let key in info) {
      svg.setAttributeNS(null, key, info[key]);
    }
    let path = document.createElementNS(svgurl, "path");
    for (let key in pathinfo) {
      path.setAttributeNS(null, key, pathinfo[key]);
    }
    svg.appendChild(path);
    
    let div = document.createElement("div");
    div.id = bell.bell;
    div.setAttribute("class", "bell");
    div.appendChild(svg);
    let base = document.createElement("div");
    base.setAttribute("class", "base");
    let handle = document.createElement("div");
    handle.setAttribute("class", "handle");
    div.appendChild(base);
    div.appendChild(handle);
    let room = document.getElementById("bells");
    room.appendChild(div);
  }
  
  
  
});




