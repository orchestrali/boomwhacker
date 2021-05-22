const lexer = require('./lexer');
const numJoin = require('./numJoin');
const parseNumAbbr = require('./numAbbr');
const grouping = require('./grouping');

module.exports = function pnrouter(o) {
  let tokens = numJoin(lexer(o.pn));
  if (tokens) {
    parseNumAbbr(tokens, o.stage);
    grouping(tokens);
  
    return tokens.filter(t => t.type !== "grouping token").map(t => t.value);
  } else {
    return null;
  }
  
}