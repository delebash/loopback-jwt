//Just same as create_role.js but using callbacks and as a boot script
//This was original example that I changed into a manual script and used asyn/await
//Can be deleted once all else is working

'use strict';

module.exports = function(app, cb) {
  var User = app.models.user;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;

  User.create([
    {username: 'dan', email: 'dan@ageektech.com', password: 'test'}
  ], function(err, users) {
    if (err) console.log(err);
    //...
    // Create projects, assign project owners and project team members
    //...
    // Create the admin role
    Role.create({
      name: 'dan'
    }, function(err, role) {
      if (err) console.log(err);

      // Make Bob an admin
      role.principals.create({
        principalType: RoleMapping.USER,
        principalId: users[0].id
      }, function(err, principal) {
        if (err) console.log(err);

      });
    });
  });

  process.nextTick(cb); // Remove if you pass `cb` to an async function yourself
};
