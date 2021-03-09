$("#container").hide();

$(function() {
  

  var name;
  var socket = window.io();
  var ready = false;
  
  var textarea = document.querySelector('textarea');
  var input = document.querySelector('input#chat');
  var stages = ["minimus", "minor", "major", "royal", "maximus", "fourteen", "sixteen"];
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

  var captain = false;
  var disconnected = false;
  var delay = 0.5;
  var playing = false;
  
  var method = {
    title: "Bastow Little Bob Minor",
    pn: ["x", [1,2], "x", [1,6]]
  };
  var instructopt = "pnnone";
  var instruct = false;
  let top = 131;
  
  var bellurl = "https://cdn.glitch.com/3222d552-1e4d-4657-8891-89dc006ccce8%2F";
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const panner = audioCtx.createPanner();
  panner.panningModel = 'equalpower';
  const gainNode = audioCtx.createGain();
  
  var stroke = 1; //1 for handstrokes, -1 for backstrokes
  var place = 0;
  var nextBellTime = 0.0;
  var rownum = -1;
  var rowArr = [];
  var timeout;
  
  console.log("numbers "+speed + " "+ delay);
  
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
  
  //enter button click
  $("#enterbutton").on("click", function(e) {
    $("#resume").hide();
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    //playSample(audioCtx, bells[0].buffer);
    name = $("#name").val();
    let secret = $("#secret").val();
    if (name.length && !/^\s+$/.test(name) && secret.length && !/^[^\w]+$/.test(secret) && !list.includes(name)) {
      socket.emit("entrant", {name: name, secret: secret});

    } else if (list.includes(name)) {
      $("#name").val("");
      $("#name").attr("placeholder", '"'+name+'" already in use; pick another name');
    } else {
      $("#name").val("");
      $("#secret").val("");
      $("#name").attr("placeholder", "invalid name or wrong secret");
    }

  });
  
  //
  socket.on('wrong', () => {
    $("#secret").val("");
    $("#secret").attr("placeholder", "invalid secret");
  });
  
  //send chat messages
  input.addEventListener('change', function(e) {
    
    socket.emit("message", "chat " + name + ": " + input.value);
    input.value = "";
  });
  
  document.querySelector('#methodname').addEventListener('change', function(e) {
    let val = $("#methodname").val();
    $("#method > p").text("Loading...");
    if (val.length) {
      let xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://vivacious-port.glitch.me/find/method?title='+val.split(" ").join("+"), true);
      xhr.send();
      
      xhr.onload = function () {
        let res = JSON.parse(xhr.responseText);
        if (res) {
          method.title = res.title;
          method.pn = res.pnFull;
          socket.emit("method", method);
        } else {
          $("#method > p").text("Method not found");
        }
      }
    }
    
  });
  
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
  
  $('input[name="trebleloc"]').on("change", function(e) {
    trebleloc = $('input[name="trebleloc"]:checked').val();
    $("div.bell").remove();
    for (let i = 0; i < numbells; i++) {
      addBell(bells[i], i);
    }
    bellnums();
    if (mypair > 0) {
      addControls(ordinals[(mypair-1)/2],mypair);
      instructions();
    }
  });
  
  //allow captain(s) to change number of bells
  $("#numbells li").on("click", function(e) {
    if (captain && !playing) {
      let n = Number($(this).text());
      socket.emit("stage", n);
      updatestage(n);
    }
  });
  
  //change speed
  $("#speed").change(function() {
    speed = Number($("#speed").val());
    socket.emit("speed", Number($("#speed").val()));
  });
  
  $("#volume").on("change", function(e) {
    gainNode.gain.value = this.value;
  });
  
  
  socket.on("speed", (s) => {
    speed = s;
    delay = s/numbells;
  });
  
  
  
  socket.on("names", (nn) => {
    list = nn;
  });
  
  socket.on("prevnames", (nn) => {
    console.log(nn);
    if (nn.includes(name)) {
      console.log("reconnected!");
    }
  })
  
  //when someone enters the chamber
  socket.on("entrance", function(m) {
    if (!disconnected && ready) {
      entrants = m.info;
      if (m.info.find(o => o.name === name).conductor) captain = true;
      //console.log("numbers "+speed + " "+ delay);
      input.placeholder = "Say something, " + name;
      updatelist(m);
      $("#enter").hide();
      $("#container").show();
      //socket.emit("method", method); //just here for testing purposes
      if (captain) {
        //$("#numbells").after('<ul id="conduct"> <li id="start">Start</li><li id="reset">Reset</li> </ul>');
        $("#conduct").show();
        $(".conduct").show();
        $("#keyboard").hide();
      }
      
      
    }
    
  });
  
  //bell assignment changed
  $("#entrants").on("change", "select.pair", function() {
        console.log($(this).children("option:checked").val());
        let n = $(this).prev("span").text();
        socket.emit("assign", {name: n, pair: Number($(this).children("option:checked").val())})
      });
  
  //start or stop sound
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
  
  //reset received
  socket.on('reset', () => {
    
    $("#pn").css("top","131px");
    top = 131;
    currentrow = [];
    insidepairs = [];
    rowArr = [];
    rownum = -1;
    stroke = 1;
    place = 0;
    for (let i = 0; i < numbells; i++) {
      currentrow.push(i+1);
      if (i > 1) insidepairs.push(-1);
      let left = 100 * (trebleloc === "right" ? i : numbells-1-i);
      $("#"+bells[i].bell).attr("style","left:"+left+"px");
    }
  });
  
  //change button clicked
  $("#controls").on("click", "button", function() {
    console.log($(this).attr("class"));
    //console.log(mypair);
    socket.emit("change", {type: $(this).attr("class"), pair: mypair});
  });
  
  //keyboard controls
  $("body").on("keypress", function(e) {
    let cross = [47, 46, 44, 109, 118, 99, 120, 122].slice(-numbells/2); // "/.,m vcxz"
    let stretch = [59, 108, 107, 106, 102, 100, 115, 97].slice(-numbells/2); // ";lkj fdsa"
    let stretch1 = [111, 119, 105, 101, 117, 114, 121, 116, 104, 103, 110, 98].slice(4-numbells); // "ow ie ur yt hg nb"
    
    if (captain) {
      let change = {};
      if (cross.includes(e.which)) {
        
        change.type = "cross";
        change.pair = cross.indexOf(e.which)*2 + 1;
      } else if (stretch.includes(e.which)) {
        
        change.type = stretch.indexOf(e.which) === 0 ? "stretchL" : stretch.indexOf(e.which) === stretch.length-1 ? "stretchR" : "stretch";
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
        change.type = mypair === 1 ? "stretchL" : mypair === numbells-1 ? "stretchR" : "stretch";
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
  
  //change received
  socket.on("change", (obj) => {
    console.log("change received");
    if (ready) {
      //console.log(insidepairs);
      console.log(obj);
      if (obj.type === "cross") {
        //build the new row
        let row = [];
        for (let i = 1; i < numbells; i+=2) {
          if (i === obj.pair) {
            row.push(currentrow[i], currentrow[i-1]);
          } else {
            row.push(currentrow[i-1], currentrow[i]);
          }
        }
        //find and swap the bells
        for (let i = 0; i < 2; i++) {
          let bell = bells.find(b => b.num === currentrow[obj.pair-1+i]); //start with the bell that needs to move up
          let left = (trebleloc === "right" ? numbells-obj.pair-1+i : obj.pair-i)*100;
          let inside = insidepairs[obj.pair-2+i];
          if (inside === 1) {
            insidepairs[obj.pair-2+i] *= -1;
          }
          $("#"+bell.bell).css("left", (left)+ "px");
        }
        currentrow = row;
        //socket.emit("currentrow", currentrow);
      } else if (obj.type != "places") {
        let arr = [];
        let arr2 = [];
        for (let i = 0; i < 2; i++) {
          let o = {
            startplace: obj.pair+i,
            bellnum: currentrow[obj.pair+i-1],
            stretch: [i === 0 ? "stretchR" : "stretchL", "stretch"].includes(obj.type),
            startstretch: insidepairs[obj.pair+i-2]
          }
          arr2.push(o);
        }
        
        
        
        arr2.forEach(i => {
          if (i.stretch) {
            let bell = bells.find(b => b.num === i.bellnum);
            let left = (trebleloc === "right" ? numbells-i.startplace : i.startplace-1)*100;
            if (i.startstretch === 1) { //if the bell has started to stretch, bring it back to place;
              $("#"+bell.bell).css("left", left+"px");
              insidepairs[i.startplace-2] = -1;
            } else {
              let j = i.startplace % 2 === 0 ? 1 : -1;
              let otherplace = i.startplace+j;
              if (insidepairs[otherplace-2] === 1) { //if the other bell has stretched already
                let otherbell = bells.find(b => b.num === currentrow[otherplace-1]);
                let otherleft = (trebleloc === "right" ? numbells-otherplace : otherplace-1)*100;
                let row = [currentrow[0]];
                for (let k = 2; k < numbells; k += 2) {
                  if (k === i.startplace || k === otherplace) {
                    row.push(currentrow[k], currentrow[k-1]);
                  } else {
                    row.push(currentrow[k-1], currentrow[k]);
                  }
                }
                row.push(currentrow[numbells-1]);
                currentrow = row;
                $("#"+bell.bell).css("left", (otherleft)+"px");
                $("#"+otherbell.bell).css("left", (left)+"px");
                insidepairs[i.startplace-2] = -1;
                insidepairs[otherplace-2] = -1;
              } else {
                if (trebleloc === "left") j *= -1;
                $("#"+bell.bell).css("left", (left-j*50)+"px");
                insidepairs[i.startplace-2] = 1;
              }
            }
          }
          
        });
        
      } 
      
      console.log(insidepairs);
      console.log(currentrow);
    }
    
  });
  
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
  
  socket.on("assign", (obj) => {
    if (ready) {
      entrants = obj;
      updatelist({info: obj});
      let pair = entrants.find(e => e.name === name).pair;
      if (pair) {
        mypair = pair;
        addControls(ordinals[(pair-1)/2], pair);
      } else {
        $("#controls").children().remove();
      }
    }
    
  });
  
  socket.on("method", setMethod);
  
  //get the bells array from the server
  socket.on("bells", (bb) => {
    bells = bb;
    for (let i = 0; i < bells.length; i++) {
      bells[i].sound = new Audio();
      bells[i].sound.src = "";
    }
    setupSample(0)
    //.then(() => {console.log("sounds buffered")});
  });
  
  //get number of bells on entrance
  socket.on("numbells", (obj) => {
    console.log(playing);
    console.log("numbells: "+obj.num);
    ready = true;
    numbells = obj.num;
    speed = obj.status.speed;
    delay = speed/numbells;
    if (obj.playing) {
      $("#playing").show();
    }
    for (let i = 0; i < numbells; i++) {
      currentrow.push(i+1);
      addBell(bells[i], i);
      if (i > 1) insidepairs.push(-1);
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
  
  //chat message received or updated entrants list
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
  
  socket.on("disconnect", (r) => {
    console.log(r);
    //if (r === "io server disconnect") {
      ready = false;
      captain = false;
      disconnected = true;
      $("#container").hide();
      $("#enter").hide();
      $("#closed").show();
    //}
  });
  
  
  function setMethod(obj) {
    method = obj;
    $("#method > p").text("Current method: "+method.title);
    $("#instructopts").show();
    instructions();
  }
  
  
  
  function updatelist(m) {
    $("#entrants li").remove();
    m.info.forEach((e) => {
      if (e.name === name && e.conductor) {
        captain = true;
        $("#numbells li:hover").css("cursor", "pointer");
      }
      let c = e.conductor ? " (C)" : "";
      updatePairOpts(e.pair);
      let d = captain ? "" : " disabled";
      $("#entrants").append('<li><span>'+e.name+ '</span>' + c+'<select class="pair"'+d+'>'+pairOpts+'</select></li>');
    });
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
        currentrow.push(i+1);
      }
    } else if (n < numbells) {
      let x = numbells-n;
      currentrow = currentrow.slice(0, n); //should this reset to rounds???
      if (trebleloc === "right") {
        $("div.bell:nth-last-child(-n+"+x+")").detach();
      } else {
        $("div.bell:nth-child(-n+"+x+")").detach();
      }
      
    }
    numbells = n;
    for (let i = 0; i < numbells; i++) {
      let left = 100 * (trebleloc === "right" ? i : numbells-1-i);
      $("#"+bells[i].bell).attr("style","left:"+left+"px");
    }
    delay = speed/numbells;
    $("#numbells li").css({color: "black", "background-color": "white"});
    let stage = stages[(numbells-4)/2];
    $("li#"+stage).css({color: "white", "background-color": "black"});
    bellnums();
    for (let i = 0; i < entrants.length; i++) {
      entrants[i].pair = 0;
    }
    updatelist({info: entrants});
    $("#controls").children().remove();
    
    
    insidepairs = [];
    for (let i = 2; i < numbells; i++) {
      insidepairs.push(-1);
    }
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
    queue.push({bell: bell.bell, stroke: stroke, time: t});
    
    if (bell) {
      let pan = -p/(numbells-1) + 0.5;
      playSample(audioCtx, bell.buffer, pan, t);
    }
    
  }
  
  let lastmoved = "c5";
  
  function movebell() {
    let bellmove = lastmoved;
    let currentTime = audioCtx.currentTime;
    let currentstroke;
    
    while (queue.length && queue[0].time < currentTime) {
      bellmove = queue[0].bell;
      currentstroke = queue[0].stroke;
      queue.splice(0, 1);
    }
    
    if (lastmoved != bellmove) {
      $("#"+bellmove).css("top", 150 - currentstroke*25 + "px");
      lastmoved = bellmove;
      let next = mypair > 0 ? place === mypair : place === numbells-1;
      if (instruct && next && rownum >= 0) {
        top -= 31;
        if (top <= 100 - method.pn.length*31) top = 100;
        $("#pn").css("top", top+"px");
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
  
  
  //this is the "old" function for playing media elements
  async function ring(sound) {
    
    console.log("ringing");
    sound.currentTime = 0;
    //console.log(sound.currentTime);
    try {
      await sound.play();
    } catch (err) {
      console.log("error");
      console.log(err.message);
    }
    
  }
  
  function addControls(id, n) {
    $("div#controls").children().remove();
    let left = 100 * (trebleloc === "right" ? numbells-1-n : n-1) + 48;
    let div = `
        <div class="controls" id="${id}" style="left:${left}px;">
          `;
    let arr = ["cross", "stretch", "places"];
    if (n != 1 && n != numbells-1) {
      arr.push(n+id.slice(-2)+"s", (n+1)+"ths");
    }
    for (let i = 0; i < arr.length; i++) {
      div += `<button class="${i === 3 || (i=== 1 && n===1) ? "stretchL" : i === 4 || (i=== 1 && n===numbells-1) ? "stretchR" : arr[i]}" type="button">${arr[i]}</button>
          `;
    }
    div += `</div>`;
    $("div#controls").append(div);
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
          str = arr.join("<br/>");
          let n = mypair === 0 ? numbells/2 : mypair;
          let left = 100 * (trebleloc === "right" ? numbells-1-n : n-1) + 48;
          $("#pn").css({left: left+"px", width: "100px"});
          let html = `<div class="cover top" style="left:${left}px"></div><div class="cover bottom" style="left:${left}px;height:${31*method.pn.length}px;background-image:linear-gradient(0deg, white, ${31*method.pn.length-10}px, #fff0);"></div>
          <div class="rect" style="left:${left-60}px"></div><div class="triangle" style="left:${left}px"></div>`;
          $("#display").append(html);
          $("#pn").html(str);
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

