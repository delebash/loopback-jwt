let config = require('../config.json');
let loopback = require('loopback');
let app = require('../server.js');
let User = app.models.user; //using user.json that was extended  from User instead of User built in role
let Role = app.models.Role; //built-in
let RoleMapping = app.models.RoleMapping; //built-in

main();

async function main() {
  let user = await User.create([
    {
      id: 0,
      username: 'test',
      email: "test@ageektech.com",
      password: 'test12345',
      emailVerified: true
    }
  ]);
  console.log(user[0].id)

  //Do not specify id field
  // let role = await Role.create({
  //   name: 'admin',
  //   description: "Administrator Role"
  // });
  // console.log(role.id)

 //roleid = role.id || 1
  let rm = await RoleMapping.create({
    principalType: RoleMapping.USER,
    principalId: user[0].id,
    roleId: 1
  });

//   Role.find({
//     where: {
//       name: 'admin'
//     }
//   }, function (err, role) {
//     if (err) {
//       console.log("eero " + err);
//     }else{
//       console.log("role " + role[0].id);
//     }
//   })
// }

}
