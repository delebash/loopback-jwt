module.exports = function (app) {
  var _ = require('lodash');
  var User = app.models.User;
  var Role = app.models.role;
  var RoleMapping = app.models.rolemapping;

  /*
   * Add hooks
   */
  RoleMapping.observe('before save', function filterProperties(ctx, next) {
    /*
     * Since there is no built in method to add Users to roles in Loopback via REST API, we have leveraged
     * the hasManyThrough relationship to handle this.  Unfortunately, the RoleMapping model has an extra
     * field called principalType that a typical join table would not have.  We have to manually set this.
     */
    if (_.isEmpty(ctx.instance.principalType)) { // If no principalType has been set...
      ctx.instance.principalType = RoleMapping.User; // Set it to User since it's likely that the User REST API is creating this
    }

    if (!_.isEmpty(ctx.instance.UserId)) {
      ctx.instance.principalId = ctx.instance.UserId;
      ctx.instance.unsetAttribute('UserId');
    }

    next();
  });

  /**
   * Add a User to the given role.
   * @param {string} id
   * @param {string} role
   * @param {Function} next
   */

  User.addRole = function (id, role, next) {
    next = next || function () {
    };
    return Role.findOne({where: {name: role}})
      .then(function (role) {
        if (!role) return sendError(next, 'No role found', 404);
        return RoleMapping.findOrCreate({principalType: RoleMapping.User, principalId: id, roleId: role.id});
      })
      .then(function (data) {
        next(null);
        return null;
      })
      .catch(function (error) {
        return sendError(next, 'Internal error', 500);
      })
  };

  /**
   * Remove a User to the given role.
   * @param {string} id
   * @param {string} role
   * @param {Function} next
   */

  User.removeRole = function (id, role, next) {
    next = next || function () {
    };
    return Role.findOne({where: {name: role}})
      .then(function (role) {
        if (!role) return sendError(next, 'No role found', 404);
        return RoleMapping.findOne({where: {principalType: RoleMapping.User, principalId: id, roleId: role.id}});
      })
      .then(function (roleMapping) {
        if (!roleMapping) return;
        return roleMapping.destroy();
      })
      .then(function () {
        next(null);
        return null;
      })
      .catch(function (error) {
        return sendError(next, 'Internal error', 500);
      })
  };


  /**
   * Find User by given role.
   * @param {string} role
   * @param {Function} next
   */

  User.findByRole = function (role, next) {
    next = next || function () {
    };
    return Role.findOne({where: {name: role}})
      .then(function (role) {
        if (!role) return sendError(next, 'No role found', 404);
        return RoleMapping.find({where: {roleId: role.id, principalType: 'User'}});
      })
      .then(function (roleMappings) {
        let ids = _.uniq(_.map(roleMappings, 'principalId'));
        return User.find({where: {id: {inq: ids}}});
      })
      .then(function (Users) {
        next(null, Users);
        return Users;
      })
      .catch(function (error) {
        return sendError(next, 'Internal error', 500);
      })
  };

  /**
   * Get roles by user
   * @param {object} req
   * @param {Function} next
   */

  // Add method getAllRoles for given User
  User.getAllRoles = function (req, next) {
    let UserId = req.accessToken.UserId;
    if (!UserId) {
      return sendError(next, 'You are not connected', 401);
    }
    Role.getRoles({principalType: RoleMapping.User, principalId: UserId}, function (err, ids) {
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

  /**
   * Get roles by user
   * @param {string} id
   * @param {Function} next
   */

  User.getPersistedRoles = function (id, next) {
    next = next || function () {
    };
    return RoleMapping.find({where: {principalType: 'User', principalId: id}})
      .then(function (roleMappings) {
        let ids = _.uniq(_.map(roleMappings, 'roleId'));
        if (ids.length > 0) {
          return Role.find({where: {id: {inq: ids}}});
        } else {
          return [];
        }
      })
      .then(function (roles) {
        let result = _.map(roles, 'name');
        next(null, result);
        return result;
      })
      .catch(function (error) {
        return sendError(next, 'Internal error', 500);
      })
  };


  // Register remote method
  User.remoteMethod('addRole', {
    accepts: [
      {
        arg: 'id',
        type: 'string',
        required: true
      },
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
      path: '/:id/addRole'
    }
  });

  User.remoteMethod('removeRole', {
    accepts: [
      {
        arg: 'id',
        type: 'string',
        required: true
      },
      {
        arg: 'role',
        type: 'string',
        required: true
      }
    ],
    returns: {},
    http: {
      verb: 'post',
      path: '/:id/removeRole'
    }
  });
  User.remoteMethod('findByRole', {
    accepts: {
      arg: 'role',
      type: 'string',
      required: true
    },
    returns: {
      arg: 'Users',
      type: '[object]'
    },
    http: {
      verb: 'get'
    }
  });
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
      path: '/roles'
    }
  });
  User.remoteMethod('getPersistedRoles', {
    accepts: [
      {
        arg: 'id',
        type: 'string',
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
      path: '/:id/persistedRoles'
    }
  });
};
