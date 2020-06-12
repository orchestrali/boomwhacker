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

  var captain = false;
  var disconnected = false;
  var delay = 0.5;
  var playing = false;
  
  var bellurl = "https://cdn.glitch.com/3222d552-1e4d-4657-8891-89dc006ccce8%2F";
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const panner = audioCtx.createPanner();
  panner.panningModel = 'equalpower';
  
  var stroke = 1; //1 for handstrokes, -1 for backstrokes
  var place = 0;
  var nextBellTime = 0.0;
  var rownum = -1;
  var rowArr = [];
  var timeout;
  
  //enter the chamber
  $("#enterbutton").on("click", function(e) {
    
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
  
  //send chat messages
  input.addEventListener('change', function(e) {
    socket.emit("message", "chat " + name + ": " + input.value);
    input.value = "";
  });
  
  //allow captain(s) to change number of bells
  $("#numbells li").on("click", function(e) {
    if (captain && !playing) {
      let n = Number($(this).text());
      socket.emit("stage", n);
      updatestage(n);
    }
  });
  
  
  
  socket.on("names", (nn) => {
    list = nn;
  });
  
  //when someone enters the chamber
  socket.on("entrance", function(m) {
    if (!disconnected && ready) {
      entrants = m.info;
      if (m.info.find(o => o.name === name).conductor) captain = true;
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
  
  $("#entrants").on("change", "select.pair", function() {
        console.log($(this).children("option:checked").val());
        let n = $(this).prev("span").text();
        socket.emit("assign", {name: n, pair: Number($(this).children("option:checked").val())})
      });
  
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
        place: place
      }
      socket.emit("stop", status);
    }
    
  });
  
  $("#reset").on("click", function() {
    if (!playing) {
      socket.emit("reset");
    }
  });
  
  socket.on('reset', () => {
    $("div.bell").attr("style", "");
    currentrow = [];
    insidepairs = [];
    rowArr = [];
    rownum = -1;
    stroke = 1;
    place = 0;
    for (let i = 0; i < numbells; i++) {
      currentrow.push(i+1);
      if (i > 1) insidepairs.push(-1);
    }
  });
  
  $("#controls").on("click", "button", function() {
    console.log($(this).attr("class"));
    //console.log(mypair);
    socket.emit("change", {type: $(this).attr("class"), pair: mypair});
  });
  
  socket.on("change", (obj) => {
    if (ready) {
      console.log(insidepairs);
      console.log(obj);
      if (obj.type === "cross") {
        let row = [];
        for (let i = 1; i < numbells; i+=2) {
          if (i === obj.pair) {
            row.push(currentrow[i], currentrow[i-1]);
          } else {
            row.push(currentrow[i-1], currentrow[i]);
          }
        }
        let j = -1;
        for (let i = 0; i < 2; i++) {
          let bell = bells.find(b => b.num === currentrow[obj.pair-1+i]);
          let left = Number($("#"+bell.bell).css("left").slice(0, -2));
          $("#"+bell.bell).css("left", (left+100*j)+ "px");
          j*=-1;
        }
        currentrow = row;
        //socket.emit("currentrow", currentrow);
      } else if (obj.type != "places") {
        let arr = [];
        if (["stretchL", "stretch"].includes(obj.type)) arr.push(0);
        if (["stretchR", "stretch"].includes(obj.type)) arr.push(1);
        let j = -1;
        arr.forEach(i => {
          if (obj.type === "stretchR") j*=-1;
          insidepairs[obj.pair-1-i] *= -1;
          let bell = bells.find(b => b.num === currentrow[obj.pair-i]);
          let left = Number($("#"+bell.bell).css("left").slice(0, -2));
          if (insidepairs[obj.pair-1-i] === 1) {
            if (insidepairs[obj.pair-1-i-j] === 1) { //if the bell to swap with has also stretched
              let row = [currentrow[0]];
              for (let k = 2; k < numbells; k+=2) {
                if (k === obj.pair-j) {
                  row.push(currentrow[k], currentrow[k-1]);
                  $("#"+bell.bell).css("left", (left+100*j)+ "px");
                  let otherbell = bells.find(b => b.num === currentrow[obj.pair-i*3+1]);
                  let otherleft = Number($("#"+otherbell.bell).css("left").slice(0, -2));
                  $("#"+otherbell.bell).css("left", (otherleft-50*j)+"px");
                } else {
                  row.push(currentrow[k-1], currentrow[k]);
                }
              }
              row.push(currentrow[numbells-1]);
              currentrow = row;
              //socket.emit("currentrow", currentrow);
              insidepairs[obj.pair-1-i] *= -1;
              insidepairs[obj.pair-1-i-j] *= -1;
            } else {
              $("#"+bell.bell).css("left", (left+50*j)+"px");
            }
          } else {
            $("#"+bell.bell).css("left", (left-50*j)+"px");
          }
          j *= -1;
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
      $("#start").text("Stop");
      playing = true;
      //play(currentrow, 0);
      nextBellTime = audioCtx.currentTime;
      scheduler();
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
    delay = 2/numbells;
    if (obj.playing) {
      $("#playing").show();
    }
    for (let i = 0; i < numbells; i++) {
      currentrow.push(i+1);
      addBell(bells[i]);
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
        addBell(bells[i]);
        currentrow.push(i+1);
      }
    } else if (n < numbells) {
      let x = numbells-n;
      currentrow = currentrow.slice(0, n); //should this reset to rounds???
      $("div.bell:nth-last-child(-n+"+x+")").detach();
    }
    numbells = n;
    delay = 2/numbells;
    $("#numbells li").css({color: "black", "background-color": "white"});
    let stage = stages[(numbells-4)/2];
    $("li#"+stage).css({color: "white", "background-color": "black"});
    bellnums();
    //updatelist({info: entrants});
    
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
      rownum++;
    }
    
  }
  
  let lookahead = 25.0;
  let schedule = 0.1;
  
  function scheduleRing(p, t) {
    let bell = bells.find(b => b.num === currentrow[p]);
    if (p === 0) {
      rowArr.push({rownum: rownum, row: [currentrow[p]], times: [t]});
    } else {
      rowArr[rowArr.length-1].row.push(currentrow[p]);
      rowArr[rowArr.length-1].times.push(t);
    }
    
    if (bell) {
      let pan = -p/(numbells-1) + 0.5;
      playSample(audioCtx, bell.buffer, pan, t);
    }
    
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
    sampleSource.connect(panner).connect(audioContext.destination)
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
    let left = 100 * (numbells-1-n) + 48;
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




