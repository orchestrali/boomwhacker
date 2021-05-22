const axios = require("axios");
const places = require('../places');
var url = "https://api.complib.org/composition/";

module.exports = function complibrouter(id, cb) {
  axios.get(url + id + "/rows")
  .then(function (response) {
    // handle success
    if (response.data) {
      let comp = {
        title: response.data.title,
        methodid: response.data.methodid,
        stage: response.data.stage,
        rows: response.data.rows.map(r => {
          let o = {
            row: r[0].split('').map(n => places.indexOf(n)+1),
            call: r[1]
          };
          return o;
        })
      };
      cb(comp);
    } else {
      cb();
    }
    
  })
  .catch(function (error) {
    // handle error
    console.log(error);
    cb();
  });
  
}