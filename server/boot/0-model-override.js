module.exports = function (app) {
  var _ = require('lodash');
  var User = app.models.user;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;
  var ACL = app.models.ACL;



  //
  User.addRole = async function (role) {
    let roleid = await Role.create({
      name: role,
      description: "role"
    });
  };

  User.remoteMethod('addRole', {
    accepts: [
      {
        arg: 'role',
        type: 'string',
        required: true
      }
    ],
    returns: {}
    ,
    http: {
      verb: 'post',
      path: '/addRole'
    }
  });


  // Add method getAllRoles to user
  User.getAllRoles = function (req, next) {
    let userId = req.accessToken.userId;
    if (!userId) {
      return sendError(next, 'You are not connected', 401);
    }
    Role.getRoles({principalType: RoleMapping.USER, principalId: userId}, function (err, ids) {
      if (err) {
        return next(err);
      }
      let dataIds = _.filter(ids, (id) => {
        return !_.isString(id) || id.substr(0, 1) !== '$'
      });
      let dynamicRoles = _.filter(ids, (id) => {
        return _.isString(id) && id.substr(0, 1) === '$'
      });
      // Treat this separately because if dataIds = [], all roles will be return by find request
      if (dataIds.length === 0) {
        next(null, dynamicRoles);
        return Promise.resolve(dynamicRoles);
      }
      Role.find({where: {id: {inq: dataIds}}})
        .then(function (roles) {
          let result = _.map(roles, 'name');
          result = _.uniq(result.concat(dynamicRoles));
          next(null, result);
          return result;
        })
        .catch(function (error) {
          return sendError(next, 'Internal error', 500);
        })
    });
  };

  User.remoteMethod('getAllRoles', {
    accepts: [
      {
        arg: 'context',
        type: 'object',
        http: {source: 'req'},
        required: true
      }
    ],
    returns: {
      arg: 'roles',
      type: '[string]'
    }
    ,
    http: {
      verb: 'get',
      path: '/getroles'
    }
  });

  // user.addRole = function (id, role, next) {
  //   next = next || function () {
  //   };
  //   return Role.findOne({where: {name: role}})
  //     .then(function (role) {
  //       if (!role) return sendError(next, 'No role found', 404);
  //       return RoleMapping.findOrCreate({principalType: RoleMapping.USER, principalId: id, roleId: role.id});
  //     })
  //     .then(function (data) {
  //       next(null);
  //       return null;
  //     })
  //     .catch(function (error) {
  //       return sendError(next, 'Internal error', 500);
  //     })
  // };
  //





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
// //
// //   /*
// //    * Configure relationships
// //    */
//
//    RoleMapping.belongsTo(User);
//    RoleMapping.belongsTo(Role);
//    User.hasMany(Role, {through: RoleMapping, foreignKey: 'principalId'});
//    User.hasMany(RoleMapping, {foreignKey: 'principalId'});
//     Role.hasMany(User, {through: RoleMapping, foreignKey: 'roleId'});

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
};
