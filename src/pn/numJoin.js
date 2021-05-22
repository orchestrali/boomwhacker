module.exports = function numJoin(tokens) {
  if (!tokens) {
    return null;
  }
  //console.log('starting numJoin', tokens);
  let arrayNumJoin = [];
  let prevToken = 'all change';
  //console.log('hi');
  //console.log(tokens);
  for (let i = 0; i < tokens.length; ++i) {
    if (tokens[i].type === 'number' && prevToken === 'number') {
      arrayNumJoin[arrayNumJoin.length - 1].value += tokens[i].value;
    } else if (tokens[i].type === 'separator') {
      prevToken = 'separator';
    } else {
      arrayNumJoin.push(tokens[i]);
      prevToken = tokens[i].type;
    } 
  }
  
  //console.log('numbers joined', arrayNumJoin);
  return arrayNumJoin;
}