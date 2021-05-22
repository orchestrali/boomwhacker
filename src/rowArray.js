const places = require('./places');
const reduce = require('./pn/reduce.js');

module.exports = function rowArray(method, numbells) {
  let rowArr = [];
  let rounds = places.slice(0,numbells).split("").map(n => places.indexOf(n)+1);
  let o = {row: rounds, call: Array.isArray(method.title) ? "Go next time" : "Go " +method.title};
  rowArr.push(o, {row: rounds});
  
  let stedman = !Array.isArray(method.title) && method.title.startsWith("Stedman ") && method.title.split(" ").length === 2;
  let prevrow = rounds;
  let pn = method.stage > numbells ? reduce(method.pn, numbells) : method.pn;
  let i = 0;
  let round = false;
  do {
    let row = [];
    let dir = 1;
    let change = pn[i%pn.length];
    for (let p = 0; p < numbells; p++) {
      if (change.indexOf(p+1) > -1) {
        row.push(prevrow[p]);
      } else {
        row.push(prevrow[p+dir]);
        dir *= -1;
      }
    }
    let o = {
      row: row
    };
    if (stedman && [1,7].includes(i%pn.length)) {
      o.name = "Six end";
    } else if (!stedman && i%pn.length === pn.length-1) {
      o.name = "Lead end";
    } else if (!stedman && pn.length%2 === 0 && i%pn.length === pn.length/2 - 1) {
      o.name = "Half lead";
    }
    rowArr.push(o);
    prevrow = row;
    i++;
    round = i >= pn.length && row.every((b,p) => b === p+1);
  } while (!round && i <= 1400);
  method.round = round;
  method.rows = rowArr;
}