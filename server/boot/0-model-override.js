// module.exports = function (app) {
//   var _ = require('lodash');
//   var User = app.models.user;
//   var Role = app.models.Role;
//   var RoleMapping = app.models.RoleMapping;
//   var ACL = app.models.ACL;
//
//   /*
//    * Configure ACL's
//    */
//   ACL.create({
//     model: 'user',
//     property: '*',
//     accessType: '*',
//     principalType: 'ROLE',
//     principalId: 'admin',
//     permission: 'ALLOW'
//   }, function (err, acl) { // Create the acl
//     if (err) console.error(err);
//   });
//
//   ACL.create({
//     model: 'Role',
//     property: '*',
//     accessType: '*',
//     principalType: 'ROLE',
//     principalId: 'admin',
//     permission: 'ALLOW'
//   }, function (err, acl) { // Create the acl
//     if (err) console.error(err);
//   });
//
//   ACL.create({
//     model: 'RoleMapping',
//     property: '*',
//     accessType: '*',
//     principalType: 'ROLE',
//     principalId: 'admin',
//     permission: 'ALLOW'
//   }, function (err, acl) { // Create the acl
//     if (err) console.error(err);
//   });
//
//   ACL.create({
//     model: 'user',
//     property: '*',
//     accessType: '*',
//     principalType: 'ROLE',
//     principalId: 'admin',
//     permission: 'ALLOW'
//   }, function (err, acl) { // Create the acl
//     if (err) console.error(err);
//   });
//
//   RoleMapping.settings.strictObjectIDCoercion = true;
//   /*
//    * Add hooks
//    */
//   RoleMapping.observe('before save', function filterProperties(ctx, next) {
//     /*
//      * Since there is no built in method to add users to roles in Loopback via REST API, we have leveraged
//      * the hasManyThrough relationship to handle this.  Unfortunately, the RoleMapping model has an extra
//      * field called principalType that a typical join table would not have.  We have to manually set this.
//      */
//     if (_.isEmpty(ctx.instance.principalType)) { // If no principalType has been set...
//       ctx.instance.principalType = RoleMapping.USER; // Set it to USER since it's likely that the User REST API is creating this
//     }
//
//     if (!_.isEmpty(ctx.instance.userId)) {
//       ctx.instance.principalId = ctx.instance.userId;
//       ctx.instance.unsetAttribute('userId');
//     }
//
//     next();
//   });
//
//   /*
//    * Configure relationships
//    */
//    RoleMapping.belongsTo(User);
//    RoleMapping.belongsTo(Role);
//    User.hasMany(Role, {through: RoleMapping, foreignKey: 'principalId'});
//    User.hasMany(RoleMapping, {foreignKey: 'principalId'});
//    Role.hasMany(User, {through: RoleMapping, foreignKey: 'roleId'});
//
//   /*
//    * Add additional attributes to models.
//    */
//   // Role.defineProperty('label', { type: 'string' }); // Add a role label that is user readable
//   // User.defineProperty('firstName', { type: 'string' }); // Give the user a first name field
//   // User.defineProperty('lastName', { type: 'string' }); // Give the user a last name field
//
//   /**
//    * Add a user to the given role.
//    * @param {string} userId
//    * @param {string} roleId
//    * @param {Function} cb
//    */
//   User.addRole = function(userId, roleId, cb) {
//     var error;
//
//     User.findOne({ where: { id: userId } }, function(err, user) { // Find the user...
//       if (err) cb(err); // Error
//
//       if (!_.isEmpty(user)) {
//         Role.findOne({ where: { id: roleId } }, function(err, role) { // Find the role...
//           if (err) cb(err); // Error
//
//           if (!_.isEmpty(role)) {
//             RoleMapping.findOne({ where: { principalId: userId, roleId: roleId } }, function(err, roleMapping) { // Find the role mapping...
//               if (err) cb(err); // Error
//
//               if (_.isEmpty(roleMapping)) { // Only create if one doesn't exist to avoid duplicates
//                 role.principals.create({
//                   principalType: RoleMapping.USER,
//                   principalId: user.id
//                 }, function(err, principal) {
//                   if (err) cb(err); // Error
//
//                   cb(null, role); // Success, return role object
//                 });
//               } else {
//                 cb(null, role); // Success, return role object
//               }
//             });
//
//           } else {
//             error = new Error('Role.' + roleId + ' was not found.');
//             error.http_code = 404;
//             cb(error); // Error
//           }
//         });
//       } else {
//         error = new Error('User.' + userId + ' was not found.');
//         error.http_code = 404;
//         cb(error); // Error
//       }
//     });
//   };
//
//   User.remoteMethod(
//     'addRole',
//     {
//       accepts: [
//         {arg: 'userId', type: 'string'},
//         {arg: 'roleId', type: 'string'}
//       ],
//       http: {
//         path: '/add-role',
//         verb: 'post'
//       },
//       returns: {type: 'object', root: true}
//     }
//   );
//
//   /**
//    * Remove a user from the given role.
//    * @param {string} userId
//    * @param {string} roleId
//    * @param {Function} cb
//    */
//   User.removeRole = function(userId, roleId, cb) {
//     var error;
//
//     User.findOne({ where: { id: userId } }, function(err, user) { // Find the user...
//       if (err) cb(err); // Error
//
//       if (!_.isEmpty(user)) {
//         Role.findOne({ where: { id: roleId } }, function(err, role) { // Find the role...
//           if (err) cb(err); // Error
//
//           if (!_.isEmpty(role)) {
//             RoleMapping.findOne({ where: { principalId: userId, roleId: roleId } }, function(err, roleMapping) { // Find the role mapping...
//               if (err) cb(err); // Error
//
//               if (!_.isEmpty(roleMapping)) {
//                 roleMapping.destroy(function(err) {
//                   if (err) cb(err); // Error
//
//                   cb(null, role); // Success, return role object
//                 });
//               } else {
//                 cb(null, role); // Success, return role object
//               }
//             });
//           } else {
//             error = new Error('Role.' + roleId + ' was not found.');
//             error.http_code = 404;
//             cb(error); // Error
//           }
//         });
//       } else {
//         error = new Error('User.' + userId + ' was not found.');
//         error.http_code = 404;
//         cb(error); // Error
//       }
//     });
//   };
//
//   User.remoteMethod(
//     'removeRole',
//     {
//       accepts: [
//         {arg: 'userId', type: 'string'},
//         {arg: 'roleId', type: 'string'}
//       ],
//       http: {
//         path: '/remove-role',
//         verb: 'post'
//       }
//     }
//   );
// };
