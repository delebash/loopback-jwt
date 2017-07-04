let loopback = require('loopback');
let app = require('../server');
const dbname = 'northwind';

let ds = app.datasources[dbname];

test()


function test() {
  let lbTables = ['User', 'AccessToken', 'ACL', 'RoleMapping', 'Role'];
  ds.automigrate(lbTables, function (er) {
    if (er) throw er;
    console.log('Loopback tables [' - lbTables - '] created in ', ds.adapter.name);
    ds.disconnect();
  });
}
