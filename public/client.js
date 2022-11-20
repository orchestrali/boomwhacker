$("#container").hide();
var conductkeys = [
  ["p",";"],["o","l","/","."],["i","k",",","m"],["u","j","n","h"],["r","f","b","g"],["e","d","c","v"],["w","s","z","x"],["q","a"]
];
    //[["/", ";"],[".","l","o","w"],[",","k","i","e"],["m","j","u","r"],["v","f","y","t"],["c","d","h","g"],["x","s","n","b"],["z","a"]];

$(function() {
  

  var name;
  var socket = window.io();
  var ready = false;
  
  var textarea = document.querySelector('textarea');
  var input = document.querySelector('input#chat');
  var stages = ["minimus", "doubles", "minor", "triples", "major", "caters", "royal", "cinques", "maximus", "sextuples", "fourteen", "septuples", "sixteen"];
  var ordinals = ["first", "third", "fifth", "seventh", "ninth", "eleventh", "thirteenth", "fifteenth"];
  var bells;
  var numbells;
  var pairOpts;
  var currentrow = [];
  var insidepairs = [];
  var entrants;
  var list = [];
  var mypair = 0;
  var speed = 2;
  var trebleloc = "right";
  var keyboardplaces;

  var captain = false;
  var disconnected = false;
  var delay = 0.5;
  var playing = false;
  
  var method = {
    title: "Bastow Little Bob Minor",
    pn: ["x", [1,2], "x", [1,6]]
  };
  var comp;
  var instructopt = "pnnone";
  var instruct = false;
  let top = 130;
  let firstcall;
  let robotpairs = [];
  
  var bellurl = "https://cdn.glitch.com/3222d552-1e4d-4657-8891-89dc006ccce8%2F";
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const panner = audioCtx.createPanner();
  panner.panningModel = 'equalpower';
  const gainNode = audioCtx.createGain();
  
  var stroke = 1; //1 for handstrokes, -1 for backstrokes
  var place = 0;
  var nextBellTime = 0.0;
  var rownum = 0;
  var rowArr = [];
  var timeout;
  /*
  var keycodes = {
    cross: [47, 46, 44, 109, 118, 99, 120, 122],
    stretch: [59, 108, 107, 106, 102, 100, 115, 97],
    stretch1: [111, 119, 105, 101, 117, 114, 121, 116, 104, 103, 110, 98]
  }
  */
  var keycodes = {
    cross: [112, 111, 105, 117, 114, 101, 119, 113], // "poiu rewq"
    stretch: [59, 108, 107, 106, 102, 100, 115, 97], // ";lkj fdsa"
    stretch1: [47, 46, 44, 109, 110, 104, 98, 103, 99, 118, 122, 120] // "/.,mnh bgcvzx"
  };
  let cross = keycodes.cross.slice(-numbells/2); // "/.,m vcxz"
  let stretch = [59, 108, 107, 106, 102, 100, 115, 97].slice(-numbells/2); // ";lkj fdsa"
  let stretch1 = keycodes.stretch1.slice(4-numbells); // "ow ie ur yt hg nb"
  
  //console.log("numbers "+speed + " "+ delay);
  
  $(window).focus(() => {
    $("#resume").hide();
  });
  
  $(window).blur(() => {
    $("#resume").show();
  });
  
  $("#container").on("click", 'input[type="text"],input[type="number"]', (e) => {
    e.stopPropagation();
    $("#resume").show();
  });
  
  $("#resume,body").on("click", () => {
    $("#resume").hide();
  });
  
  // error in script!
  window.onerror = function(msg, src, lineno, colno, error) {
    let message = [
      "Message: " + msg,
      
      "Line: " + lineno,
      "Column: " + colno
    ];
    //console.log(error);
    onerror(message);
    alert("Congratulations, you've found a bug! If Alison is in the room, she should know already. If not, you might send her the message below. You'll probably have to reload to get the chamber to work again.\n" + message.join("\n"));
    return true;
  }
  
  
  //enter button click
  $("#enterbutton").on("click", enter);
  $("input#secret").on("keyup", (e) => {
    if (e.code === "Enter") {
      enter(e);
    }
  });
  
  //send chat messages
  input.addEventListener('change', function(e) {
    
    socket.emit("chat", name + ": " + input.value); ///////
    input.value = "";
  });
  
  //search for a method
  document.querySelector('#methodname').addEventListener('change', function(e) {
    let val = $("#methodname").val();
    $("#composition > p").text("Loading...");
    if (val.length && val.includes(" ") && /[a-z]/i.test(val)) {
      let xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://vivacious-port.glitch.me/find/method?title='+val.split(" ").join("+"), true);
      xhr.send();
      
      xhr.onload = function () {
        let res = xhr.responseText;
        if (res) {
          res = JSON.parse(res);
          method = {};
          method.title = res.title;
          method.pn = res.pnFull;
          method.stage = res.stage;
          socket.emit("method", method); ///////
        } else {
          $("#composition > p").text("Method not found");
        }
      }
      xhr.onerror = function () {
        $("#composition > p").text("Error searching for method");
      }
    } else {
      $("#composition > p").text("Invalid method title");
    }
    
  });
  
  //enter place notation
  document.querySelector('#placenot').addEventListener('change', function(e) {
    let val = $("#placenot").val();
    let stage = stages.indexOf($("#stage").val()) + 4;
    console.log($("#stage").val());
    if (stage > 3 && /^[\d,&\.\+etx\-]+$/i.test(val)) {
      $("#composition > p").text("Loading...");
      socket.emit("placenot", {pn: val, stage: stage});
    } else {
      $("#composition > p").text("Invalid place notation");
    }
  });
  
  //enter complib composition id
  document.querySelector('#complib').addEventListener('change', function(e) {
    let val = $("#complib").val();
    if (/^\d+$/.test(val)) {
      $("#composition > p").text("Loading...");
      socket.emit("complib", val);
    }
  });
  
  //choose instruction type
  $('input[name="instruct"]').change(function() {
    //console.log(mypair);
    
    instructopt = this.id;
    instructions();
  });
  
  $("input").on("keypress", function(e) {
    //e.preventDefault();
    e.stopPropagation();
  });
  
  $("input#chat").on("keypress", function(e) {
    //console.log(e.keyCode);
  });
  
  //reverse bell direction
  $('input[name="trebleloc"]').on("change", function(e) {
    trebleloc = $('input[name="trebleloc"]:checked').val();
    $("div.bell").remove();
    for (let i = 0; i < numbells; i++) {
      addBell(bells[i], i);
    }
    bellnums();
    cross.reverse();
    stretch.reverse();
    stretch1.reverse();
    if (mypair > 0 && !captain) {
      $(".controls").remove();
      addControls(ordinals[(mypair-1)/2],mypair);
      instructions();
    } else if (captain) {
      for (let i = 1; i <= numbells/2; i++) {
        let child = trebleloc === "right" ? "nth-child("+(i+1)+")" : "nth-last-child("+i+")";
        $(".controls:"+child).attr("id", ordinals[i-1]);
      }
      $(".stretchL:nth-child(2)").addClass("stretchRR").removeClass("stretchL");
      $(".stretchR:nth-child(2)").addClass("stretchL").removeClass("stretchR");
      $(".stretchRR").addClass("stretchR").removeClass("stretchRR");
      instructions();
    }
  });
  
  //allow captain(s) to change number of bells
  $("#numbells li").on("click", function(e) {
    if (captain && !playing) {
      let n = Number($(this).text());
      socket.emit("stage", n); //////
      updatestage(n);
    }
  });
  
  //bell assignment changed
  $("#entrants").on("change", "select.pair", function() {
    console.log($(this).children("option:checked").val());
    let n = $(this).prev("span").text();
    socket.emit("assign", {name: n, pair: Number($(this).children("option:checked").val())}); /////////
  });
  
  $("#entrants").on("change", "div.assign", function() {
    let arr = [];
    $(this).find("input:checked").each(function() {
      arr.push(Number($(this).val()));
    });
    
    socket.emit("assign", {name: "Sidra🤖", pairs: arr});
  });
  
  //change speed
  $("#speed").change(function() {
    speed = Number($("#speed").val());
    socket.emit("speed", Number($("#speed").val())); ///////
  });
  
  //change volume
  $("#volume").on("change", function(e) {
    gainNode.gain.value = this.value;
  });
  
  //start button click
  $("#start").on("click", function() {
    if (!playing) {
      socket.emit("start");
      
    } else {
      let status = {
        currentrow: currentrow,
        insidepairs: insidepairs,
        rowArr: rowArr,
        rownum: rownum,
        stroke: stroke,
        place: place,
        speed: speed
      }
      socket.emit("stop", status);
    }
    
  });
  
  //reset button clicked
  $("#reset").on("click", function() {
    if (!playing) {
      socket.emit("reset");
    }
  });
  
  //change button clicked
  $("#controls").on("click", "button", function() {
    console.log($(this).attr("class"));
    //console.log(mypair);
    let pair = ordinals.indexOf($(this).parent().attr("id"))*2+1;
    socket.emit("change", {type: $(this).attr("class"), pair: pair});
  });
  
  
  //keyboard controls
  $("body").on("keypress", function(e) {
    
    
    if (captain) {
      let change = {};
      if (cross.includes(e.which)) {
        
        change.type = "cross";
        change.pair = cross.indexOf(e.which)*2 + 1;
      } else if (stretch.includes(e.which)) {
        switch (stretch.indexOf(e.which)) {
          case 0:
            change.type = "stretchL";
            break;
          case stretch.length-1:
            change.type = "stretchR";
            break;
          default:
            change.type = "stretch";
        }
        change.pair = stretch.indexOf(e.which)*2 + 1;
      } else if (stretch1.includes(e.which)) {
        let i = stretch1.indexOf(e.which);
        change.type = i%2 === 0 ? "stretchL" : "stretchR";
        change.pair = i%2 === 0 ? i+3 : i+2;
      }
      if (change.type) {
        socket.emit("change", change);
      }
    } else if (ready && mypair) {
      let change = {
        pair: mypair
      }
      if (e.which === Number($("#stretchkey").val().charCodeAt(0))) {
        switch (mypair) {
          case 1:
            change.type = "stretchL";
            break;
          case numbells-1:
            change.type = "stretchR";
            break;
          default:
            change.type = "stretch";
        }
      } else if (e.which === Number($("#crosskey").val().charCodeAt(0))) {
        change.type = "cross"
      } else if (mypair > 1 && mypair < numbells-1) {
        change.type = e.which === Number($("#stretchRkey").val().charCodeAt(0)) ? "stretchR" : e.which === Number($("#stretchLkey").val().charCodeAt(0)) ? "stretchL" : null;
      }
      if (change.type) {
        socket.emit("change", change);
      }
    }
    
  });
  
  
  
  //sockets
  
  //list of names to prevent duplicates
  socket.on("names", (nn) => {
    list = nn;
  });
  
  //get the bells array from the server
  socket.on("bells", (bb) => {
    if (!ready && name) {
      socket.emit("reenter", {name: name, pair: mypair});
    } else {
      bells = bb;
      for (let i = 0; i < bells.length; i++) {
        bells[i].sound = new Audio();
        bells[i].sound.src = "";
      }
      setupSample(0)
    }
    
    
  });
  
  socket.on("duplicate", () => {
    $("#name").val("");
    $("#name").attr("placeholder", '"'+name+'" already in use; pick another name');
    $("#name,#secret").prop("disabled", false);
    $("#waiting").addClass("hidden");
  });
  
  //secret is wrong
  socket.on('wrong', () => {
    $("#secret").val("");
    $("#secret").attr("placeholder", "invalid secret");
    $("#name,#secret").prop("disabled", false);
    $("#waiting").addClass("hidden");
  });
  
  
  //this socket enters
  socket.on("numbells", (obj) => {
    //console.log(playing);
    console.log("numbells: "+obj.num);
    ready = true;
    numbells = obj.num;
    speed = obj.status.speed;
    currentrow = obj.status.currentrow;
    insidepairs = obj.status.insidepairs;
    delay = speed/numbells;
    cross = keycodes.cross.slice(-numbells/2);
    stretch = keycodes.stretch.slice(-numbells/2);
    stretch1 = keycodes.stretch1.slice(4-numbells);
    if (obj.info.find(o => o.name === name).conductor) captain = true;
      //console.log("numbers "+speed + " "+ delay);
    input.placeholder = "Say something, " + name;
    entrants = obj.info;
    if (obj.playing) {
      $("#playing").show();
    }
    for (let i = 0; i < numbells; i++) {
      addBell(bells[i], i);
    }
    if (numbells != 6) {
      $("#numbells li").css({color: "black", "background-color": "white"});
      let stage = stages[(numbells-4)];
      $("li#"+stage).css({color: "white", "background-color": "black"});
    }
    bellnums();
    if (numbells < 12) {
      $("div#room").attr("style", "");
    } else {
      let val = 1-(numbells-10)/16;
      $("div#room").css("transform", "scale("+val+")");
    }
    buildlist(obj);
    $("#enter").hide();
    $("#container").show();
    if (captain) {
      $(".controls").remove();
      assignCaptain();
      $("#conduct").show();
      $(".conduct").show();
      $("#keyboard").hide();
    }
  });
  
  socket.on("reopen", state => {
    ready = true;
    $("#enter").hide();
    $("#resume").hide();
    $("#closed").hide();
    $("#container").show();
  });
  
  
  //when anyone enters the chamber
  socket.on("entrance", function(m) {
    if (!disconnected && ready) {
      entrants.push(m.info);
      addEntrant(m.info);
    }
    
  });
  
  socket.on("exit", function(m) {
    if (ready) {
      updateentrant(m.info, true);
    }
  });
  
  socket.on("disconnect", (r) => {
    console.log(r);
    if (["io server disconnect", "io client disconnect"].includes(r)) {
      $("#closed > h3").text("Connection error - try reloading to enter.");
    } else {
      setTimeout(function() {
        if (!ready) {
          $("#closed > h3").text("Reconnect failed - try reloading to enter.");
        }
      }, 3000);
    }
    ready = false;
    captain = false;
    $("#container").hide();
    $("#enter").hide();
    $("#closed").show();
  });
  
  //stagechange from a(nother) captain
  socket.on("stagechange", (n) => {
    if (name) {
      updatestage(n);
    }
    
  });
  
  
  //speed change
  socket.on("speed", (s) => {
    speed = s;
    delay = s/numbells;
    $("#speed").val(s);
  });
  
  //reset received
  socket.on('reset', () => {
    
    $("#pn").css("top","131px");
    top = 130;
    currentrow = [];
    insidepairs = [];
    rowArr = [];
    rownum = 0;
    stroke = 1;
    place = 0;
    lastrow = 0;
    for (let i = 0; i < numbells; i++) {
      currentrow.push(i+1);
      insidepairs.push(-1);
      let left = 100 * (trebleloc === "right" ? i : numbells-1-i);
      $("#"+bells[i].bell).attr("style","left:"+left+"px");
    }
  });
  
  
  
  
  //what the server sends when there has been a change (as in change ringing)
  socket.on("nextrow", obj => {
    for (let i = 0; i < numbells; i++) {
      let bell = bells.find(b => b.num === obj.row[i]);
      let left = (trebleloc === "right" ? numbells-1-i : i)*100;
      if (obj.row[i] != currentrow[i]) {
        $("#"+bell.bell).css("left", left+"px");
      } else if (obj.insides[i] != insidepairs[i]) {
        if (obj.insides[i] === 1) {
          left += (i%2 === 0 && trebleloc === "right") || (i%2 === 1 && trebleloc === "left") ? 50 : -50;
        }
        $("#"+bell.bell).css("left", left+"px");
      }
      
    }
    currentrow = obj.row;
    insidepairs = obj.insides;
  });
  
  //start sounds
  socket.on("start", () => {
    if (ready) {
      console.log("starting play?");
      console.log(currentrow);
      console.log(speed);
      console.log(delay);
      $("#start").text("Stop");
      playing = true;
      //play(currentrow, 0);
      nextBellTime = audioCtx.currentTime;
      scheduler();
      requestAnimationFrame(movebell);
    }
  });
  
  //stop sounds
  socket.on("stop", (status) => {
    clearTimeout(timeout);
    $("#playing").hide();
    $("#start").text("Start");
    if (status && !playing) {
      currentrow = status.currentrow;
      insidepairs = status.insidepairs;
      rowArr = status.rowArr;
      rownum = status.rownum;
      stroke = status.stroke;
      place = status.place;
      for (let i = 0; i < numbells; i++) {
        let bell = bells.find(b => b.num === currentrow[i]);
        if (bell && bell.num != i+1) {
          $("#"+bell.bell).css("left", (numbells-i-1)*100+"px");
        }
      }
    }
    playing = false;
  });
  
  //assign someone
  socket.on("assign", (obj) => {
    if (ready) {
      entrants = obj;
      $(".ringer").remove();
      entrants.forEach(e => updateentrant(e, false));
      
      let pair = entrants.find(e => e.name === name).pair;
      if (pair) {
        mypair = pair;
        if (!captain) {
          $(".controls").remove();
          addControls(ordinals[(pair-1)/2], pair);
        }
      } else if (!captain) {
        $(".controls").remove();
      }
      instructions();
    }
    
  });
  
  socket.on("method", setMethod);
  
  
  
  
  
  //chat message received or updated entrants list
  socket.on("message", function(m) {
    if (ready) {
      console.log("message");
    //let m = JSON.parse(e);
      if (m.type === "chat") {
        textarea.value += m.info + "\n";
      }
    }
    
  });
  
  
  
  
  
  // FUNCTIONS
  
  
  function enter(e) {
    $("#resume").hide();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    //playSample(audioCtx, bells[0].buffer);
    name = $("#name").val();
    let badchar = !/^[a-z]/i.test(name);
    let secret = $("#secret").val();
    if (name.length && !/^\s+$/.test(name) && secret.length && !/^[^\w]+$/.test(secret) && !list.includes(name) && !badchar) {
      socket.emit("entrant", {name: name, secret: secret});
      $("#wait").removeClass("hidden");
      $("#name,#secret").prop("disabled", true);
    } else if (list.includes(name)) {
      $("#name").val("");
      $("#name").attr("placeholder", '"'+name+'" already in use; pick another name');
    } else {
      $("#name").val("");
      $("#secret").val("");
      $("#name").attr("placeholder", "invalid name or wrong secret");
    }

  }
  
  function onerror(e) {
    socket.emit("error", {error: e});
  }
  
  
  function setMethod(obj) {
    if (name) {
      if (obj.pn) {
        comp = null;
        method = obj;
        $("#composition > p").text("Current method: "+method.title);
        $("#instructopts").show();
        instructions();
      } else {
        $("#composition > p").text("Invalid place notation");
      }
    }
    
  }
  
  
  
  function buildlist(m) {
    $("#entrants li").remove();
    $(".ringer").remove();
    m.info.forEach(addEntrant);
  }
  
  function addEntrant(e) {
    if (e.name === name && e.conductor) {
      captain = true;
      $("#numbells li:hover").css("cursor", "pointer");
    }
    let c = e.conductor ? " (C)" : "";
    updatePairOpts(e.pair);
    if (e.pair) addName(e.name, e.pair);
    let d = captain ? "" : " disabled";
    if (e.name === "Sidra🤖") {
      let html = '<li id="Sidra"><span>'+e.name+ '</span><div class="assign'+ (captain ? ' active"' : '"' ) + '><span class="summary">' + (e.pairs.length ? e.pairs.map(n => n+"-"+(n+1)).join(",") : " ") + '</span><ul class="dropdown">';
      for (let i = 1; i < numbells; i+=2) {
        html += `
        <li><input type="checkbox" id="robot${i}" value="${i}" ${e.pairs.includes(i) ? "checked" : ""}/><label for="robot${i}">${i}-${i+1}</label></li>`;
        if (e.pairs.includes(i)) {
          addName(e.name, i);
        }
      }
      html += '</ul></div></li>';
      $("#entrants").append(html);
      robotpairs = e.pairs;
      console.log(robotpairs);
    } else {
      $("#entrants").append('<li id="'+e.name.replace(/ /g, "")+'"><span>'+e.name+ '</span>' + c+'<select class="pair"'+d+'>'+pairOpts+'</select></li>');
    }
  }
  
  function updateentrant(o, exit) {
    if (o.name === "Sidra🤖") {
      let summary = o.pairs.length ? o.pairs.map(n => n+"-"+(n+1)).join(",") : " ";
      $("li#Sidra span.summary").text(summary);
      for (let i = 1; i < numbells; i+=2) {
        $("#robot"+i).prop("checked", o.pairs.includes(i));
        if (o.pairs.includes(i)) {
          addName(o.name, i);
        }
      }
      robotpairs = o.pairs;
    } else {
      let li = $("li#"+o.name.replace(/ /g, ""));
      let j = entrants.findIndex(e => e.name === o.name);
      if (exit) {
        li.remove();
        entrants.splice(j,1);
      } else {
        li.find('option[value="'+o.pair+'"]').prop("checked", true);
        if (o.pair) addName(o.name, o.pair);
        
      }
    }
  }
  
  function updatePairOpts(n) {
    pairOpts = `
      <option value="0"></option>
      `;
    for (let i = 1; i < numbells; i+=2) {
      let s = n === i ? " selected" : "";
      pairOpts += `<option value="${i}"${s}>${i}-${i+1}</option>
      `;
    }
    
  }
  
  function updatestage(n) {
    if (n > numbells) {
      for (let i = numbells; i < n; i++) {
        addBell(bells[i], i);
        
      }
    } else if (n < numbells) {
      let x = numbells-n;
      if (trebleloc === "right") {
        $("div.bell:nth-last-child(-n+"+x+")").detach();
      } else {
        $("div.bell:nth-child(-n+"+x+")").detach();
      }
      
    }
    numbells = n;
    currentrow = [];
    insidepairs = [];
    for (let i = 0; i < numbells; i++) {
      let left = 100 * (trebleloc === "right" ? i : numbells-1-i);
      $("#"+bells[i].bell).attr("style","left:"+left+"px");
      currentrow.push(i+1);
      insidepairs.push(-1);
    }
    if (numbells < 12) {
      $("div#room").attr("style", "");
    } else {
      let val = 1-(numbells-10)/16;
      $("div#room").css("transform", "scale("+val+")");
    }
    delay = speed/numbells;
    $("#numbells li").css({color: "black", "background-color": "white"});
    let stage = stages[(numbells-4)];
    $("li#"+stage).css({color: "white", "background-color": "black"});
    bellnums();
    cross = keycodes.cross.slice(-numbells/2);
    stretch = keycodes.stretch.slice(-numbells/2);
    stretch1 = keycodes.stretch1.slice(4-numbells);
    for (let i = 0; i < entrants.length; i++) {
      entrants[i].pair = 0;
    }
    $(".controls").remove();
    $(".ringer").remove();
    entrants.forEach(e => updateentrant(e, false));
    if (captain) {
      assignCaptain();
    }
    console.log(currentrow);
    
    
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
  
  
  function play(row, i) {
    let bell = bells.find(b => b.num === row[i]);
    if (bell) {
      //ring(bell.sound);
      let pan = -i/(numbells-1) + 0.5;
      playSample(audioCtx, bell.buffer, pan);
    }
    if (i < row.length-1) {
      timeout = setTimeout(play, delay, row, i+1);
    } else {
      for (let j = 0; j < i; j++) {
        //bells[j].sound.currentTime = 0;
      }
      clearTimeout(timeout);
    }
    
  }
  
  
  function nextPlace() {
    nextBellTime += delay;
    
    place++;
    if (place === numbells) {
      if (stroke === -1) nextBellTime += delay; //add handstroke gap
      place = 0;
      stroke *= -1;
      $("div.bell").css("top", 150 + stroke * 25 + "px");
      rownum++;
    }
    
  }
  
  let lookahead = 25.0;
  let schedule = 0.1;
  let queue = [];
  
  function scheduleRing(p, t) {
    let bell = bells.find(b => b.num === currentrow[p]);
    
    if (p === 0) {
      rowArr.push({rownum: rownum, row: [currentrow[p]], times: [t]});
    } else {
      rowArr[rowArr.length-1].row.push(currentrow[p]);
      rowArr[rowArr.length-1].times.push(t);
    }
    queue.push({bell: bell.bell, stroke: stroke, time: t, place: p, row: rownum});
    
    if (bell) {
      let pan = -p/(numbells-1) + 0.5;
      playSample(audioCtx, bell.buffer, pan, t);
    }
    
  }
  
  let lastmoved = "c5";
  let lastrow = 0;
  
  function movebell() {
    let bellmove = lastmoved;
    let currentTime = audioCtx.currentTime;
    let currentstroke;
    let bellplace;
    let bellrow = lastrow;
    
    while (queue.length && queue[0].time < currentTime) {
      bellmove = queue[0].bell;
      currentstroke = queue[0].stroke;
      bellplace = queue[0].place;
      bellrow = queue[0].row;
      if (robotpairs.includes(bellplace)) {
        //console.log("emitting robot ring "+queue[0].place);
        socket.emit("robotring", {bell: bellmove, place: bellplace, row: bellrow});
      }
      queue.splice(0, 1);
    }
    
    if (lastmoved != bellmove) {
      let dir = trebleloc === "right" ? 1 : -1;
      $("#"+bellmove).css("top", 150 - currentstroke*25 + "px");
      lastmoved = bellmove;
      //also animate the pn instructions
      let next = (mypair > 0 && bellplace === mypair) || bellplace === numbells-1;
      if (instruct && next && rownum >= 1 && bellrow > lastrow) {
        top -= 30;
        if (top <= 100 - method.pn.length*30) top = 100;
        $("#pn").css("top", top+"px");
        lastrow = bellrow;
      }
    }
    
    requestAnimationFrame(movebell);
    
  }
  
  function scheduler() {
    while (nextBellTime < audioCtx.currentTime + schedule) {
      scheduleRing(place, nextBellTime);
      nextPlace()
    }
    timeout = setTimeout(scheduler, lookahead);
    
  }
  
  
  async function getFile(audioContext, filepath) {
    const response = await fetch(filepath);
    const arrayBuffer = await response.arrayBuffer();
    return arrayBuffer;
  }
  
  async function setupSample(i) {
    let arrayBuffer = await getFile(audioCtx, bellurl + bells[i].url);
    audioCtx.decodeAudioData(arrayBuffer, (buffer) => {
      bells[i].buffer = buffer;
      if (i < bells.length-1) {
        i++;
        setupSample(i);
      } else {
        console.log("finished setting up");
      }
    }, (e) => { console.log(e) });
  }
  
  function playSample(audioContext, audioBuffer, pan, t) {
    //console.log("playSample called");
    //console.log(audioBuffer);
    panner.setPosition(pan, 0, 1 - Math.abs(pan));
    const sampleSource = audioContext.createBufferSource();
    sampleSource.buffer = audioBuffer;
    sampleSource.connect(panner).connect(gainNode).connect(audioContext.destination)
    //sampleSource.connect(audioContext.destination);
    sampleSource.start(t);
    return sampleSource;
  }
  
  function addName(name, n) {
    let left = 100 * (trebleloc === "right" ? numbells-1-n : n-1) + 48;
    let div = `<div class="ringer" style="left:${left}px;">${name}</div>`;
    $("div#controls").append(div);
  }
  
  
  function addControls(id, n, keys) {
    
    let left = 100 * (trebleloc === "right" ? numbells-1-n : n-1) + 48;
    let div = `
        <div class="controls" id="${id}" style="left:${left}px;">
          `;
    let arr = ["cross", "stretch"];
    if (n != 1 && n != numbells-1) {
      if (keyboardplaces && !captain) {
        $("#keyboard ul").append(keyboardplaces);
        keyboardplaces = null;
      }
      $('label[for="stretchRkey"]').text((n+1)+"ths:");
      $('label[for="stretchLkey"]').text(n+id.slice(-2)+"s:");
      arr.push(n+id.slice(-2)+"s", (n+1)+"ths");
    } else {
      if (!keyboardplaces && !captain) {
        keyboardplaces = $("#keyboard li:nth-child(n+3)").detach();
      }
    }
    arr.push("places");
    for (let i = 0; i < arr.length; i++) {
      let cl;
      switch (arr[i]) {
        case "cross": case "places":
          cl = arr[i];
          break;
        case "stretch":
          cl = n === 1 ? "stretchL" : n === numbells-1 ? "stretchR" : "stretch";
          break;
        default:
          cl = i === 2 ? "stretchL" : "stretchR";
          
      }
      div += `<button class="${cl}" type="button">${arr[i]}${keys && keys[i] ? `
      `+keys[i] : ""}</button>
          `;
    }
    div += `</div>`;
    $("div#controls").append(div);
  }
  
  function assignCaptain() {
    let keys = conductkeys.slice(-numbells/2);
    keys[0] = keys[0].slice(0,2);
    for (let i = 1; i < numbells; i+=2) {
      addControls(ordinals[(i-1)/2],i,keys[(i-1)/2]);
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
  function addBell(bell, i) {
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
    
    let left = 100 * (trebleloc === "right" ? i : numbells-1-i);
    let div = document.createElement("div");
    div.id = bell.bell;
    div.setAttribute("class", "bell");
    div.setAttribute("style", "left:"+left+"px");
    div.appendChild(svg);
    let base = document.createElement("div");
    base.setAttribute("class", "base");
    let handle = document.createElement("div");
    handle.setAttribute("class", "handle");
    div.appendChild(base);
    div.appendChild(handle);
    let room = document.getElementById("bells");
    if (trebleloc === "right") {
      room.appendChild(div);
    } else {
      room.prepend(div);
    }
    
  }
  
  function instructions() {
    $(".cover,.rect,.triangle").remove();
    instruct = false;
    switch (instructopt) {
      case "pnnone":
        $("#pn").text("");
        break;
      case "pnfixed":
        var arr = pnCondense(method.pn);
        var str = arr[0];
        for (let i = 1; i < arr.length; i++) {
          if (arr[i-1] != "x" && arr[i] != "x") {
            str += ".";
          }
          str += arr[i];
        }
        $("#pn").attr("style", "");
        $("#pn").text(str);
        break;
      case "pnanim":
        instruct = true;
        arr = pnCondense(method.pn);
        str = "<p>"+arr.join("</p><p>")+"</p>";
        let n = mypair === 0 ? numbells/2 : mypair;
        let left = 100 * (trebleloc === "right" ? numbells-1-n : n-1) + 48;
        $("#pn").css({left: left+"px", width: "100px"});
        let html = `<div class="cover top" style="left:${left}px"></div><div class="cover bottom" style="left:${left}px;height:${30*method.pn.length}px;background-image:linear-gradient(0deg, white, ${31*method.pn.length-10}px, #fff0);"></div>
        <div class="rect" style="left:${left-60}px"></div><div class="triangle" style="left:${left}px"></div>`;
        $("#display").append(html);
        $("#pn").html(str);
        break;
      case "personal":
        if (mypair) {
          instruct = true;
          arr = [];
          method.pn.forEach(a => {
            if (a === "x") {
              arr.push("cross");
            } else if (a.includes(mypair) && !a.includes(mypair+1)) {
              let w = mypair === 1 ? "stretch" : mypair === 3 ? "3rds" : mypair+"ths";
              arr.push(w);
            } else if (!a.includes(mypair) && a.includes(mypair+1)) {
              let w = mypair === numbells-1 ? "stretch" : (mypair+1)+"ths";
              arr.push(w);
            } else if (a.includes(mypair) && a.includes(mypair+1)) {
              arr.push("places");
            } else {
              let under = Math.max(...a.concat([0]).filter(n => n < mypair));
              if (under%2 === 0) {
                arr.push("cross");
              } else {
                arr.push("stretch");
              }
            }
          });
          
          str = "<p>"+arr.join("</p><p>")+"</p>";
          let left = 100 * (trebleloc === "right" ? numbells-1-mypair : mypair-1) + 48;
          $("#pn").css({left: left+"px", width: "100px"});
          let html = `<div class="cover top" style="left:${left}px"></div><div class="cover bottom" style="left:${left}px;height:${31*method.pn.length}px;background-image:linear-gradient(0deg, white, ${31*method.pn.length-10}px, #fff0);"></div>
          <div class="rect" style="left:${left-60}px"></div><div class="triangle" style="left:${left}px"></div>`;
          $("#display").append(html);
          $("#pn").html(str);
        }
        
        break;
    }
  }
  
  
  
});




function pnCondense(arr) {
  return arr.map(e => {
            const places = "1234567890ETABCD";
            return e === "x" ? e : e.map(n => places[n-1]).join("");
          });
}

