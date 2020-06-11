var entrants = [];

module.exports = function router(data, id) {
  
  if (data.startsWith("entrant")) {
    let p = data.slice(data.indexOf(" ")+1);
    entrants.push({name: p, id: id});
    return {type: "entrants", info: entrants};
  } else if (data.startsWith("chat")) {
    return {type: "chat", info: data.slice(data.indexOf(" ")+1)};
  } else if (data.startsWith("exit")) {
    let i = entrants.findIndex(e => e.id === id);
    entrants.splice(i, 1);
    return {type: "entrants", info: entrants};
  } 
  
  
  
}