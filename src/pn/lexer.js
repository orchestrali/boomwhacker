const places = require('../places');


module.exports = function lexer(placeNot) {
  let tokens = [];
  
  for (let i = 0; i < placeNot.length; ++i) {
    let token = {value: placeNot[i]};
    switch (placeNot[i]) {
      case '&':
      case ',':
      case '+':
        token.type = 'grouping token';
        break;
      case '.':
        token.type = "separator";
        break;
      case "x":
      case "-":
        token.type = "all change";
        break;
      default:
        if (places.includes(placeNot[i])) {
          token.type = "number";
        } else {
          return null;
        }
        
    }
    tokens.push(token);
  }
  
  //console.log(tokens);
  return tokens;
}