//given place notation and fewer bells than the pn is for, produce a reduced version of the pn (as in Bristol Minimus!)
module.exports = function reduce(pn, numbells) {
  let arr = [];
  pn.forEach(c => {
    if (c === "x" || (c.every(n => n < numbells) && c[c.length-1] != numbells-1)) {
      arr.push(c);
    } else if (c.every(n => n > numbells) && c.length%2 === 0) {
      arr.push("x");
    } else {
      let r = c.filter(n => n < numbells);
      r.push(numbells);
      arr.push(r);
    }
  });
  return arr;
}