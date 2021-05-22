const places = require('../places');

var validGroupTokens = [',', '+', '&,', '&,+', '+,', '+,&'];

module.exports = function grouping(tokens) {
  let groupingTokens = [];
  let groupingString = '';
  let mirrorStart;
  let mirrorEnd = 0;
  let insertIndex;
  let numToReplace;
  for (let i = 0; i < tokens.length; ++i) {
    //add the grouping tokens to the array
    if (tokens[i].type === 'grouping token') {
      groupingTokens.push({
        index: i,
        token: tokens[i].value,
      });
      groupingString += tokens[i].value;
    }
  }
  //console.log(groupingString);
  
  if (groupingString === '') {
    return tokens;
  } else if (groupingString === '+') {
      tokens.splice(groupingTokens[0].index, 1);
      return tokens;  
  } else {
    let toBeReversed;
    if (groupingString === ',') {
      if (groupingTokens[0].index > 1) {
        mirrorStart = 0;
        mirrorEnd = groupingTokens[0].index - 1;
        insertIndex = groupingTokens[0].index + 1;
      } else if (groupingTokens[0].index === 1) {
        mirrorStart = 2;
        mirrorEnd = tokens.length-1;
        insertIndex = tokens.length;
      }
      
    } else if (['&,','&,+'].includes(groupingString)) {
      mirrorStart = groupingTokens[0].index + 1;
      mirrorEnd = groupingTokens[1].index - 1;
      insertIndex = groupingTokens[1].index + 1;
    } else if (groupingString == '+,') {
      mirrorStart = groupingTokens[1].index + 1;
      mirrorEnd = tokens.length - 1;
      insertIndex = tokens.length;
    } else if (groupingString == '+,&') {
      mirrorStart = groupingTokens[2].index + 1;
      mirrorEnd = tokens.length - 1;
      insertIndex = tokens.length;
    }
    
    if (mirrorEnd === 0) {
      toBeReversed = tokens.slice(mirrorStart);
    } else {
      toBeReversed = tokens.slice(mirrorStart, mirrorEnd);
    }
    
    toBeReversed.reverse();
    
    for (let j = 0; j < toBeReversed.length; j++) {
      //console.log('insideloop', toBeReversed[j]);
      tokens.splice(insertIndex + j, 0, toBeReversed[j]);
    }
    
  }
  //console.log(tokens);
 
  return tokens;
}