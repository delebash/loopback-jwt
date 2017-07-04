var jwt = require('jsonwebtoken');
var config = require('../../server/config.json');
var models = require('../../server/model-config.json');
var Role = models.role;
var RoleMapping = models.rolemapping;
var ACL = models.acl;

module.exports = function (user) {

  // // provide own createAccessToken to create JWTs
  user.prototype.createAccessToken = function (ttl, options, cb) {
    if (cb === undefined && typeof options === 'function') {
      cb = options;
      options = undefined;
    }

    // token payload
    var payload = {};
    for (var key in config.jwt.properties) {
      payload[key] = this[config.jwt.properties[key]];
    }

    payload.iss = "Ageektech";
    payload.sub = "Loopback api key";


    var secret = config.jwt.client_secret;
    var at_ttl = config.jwt.access_token_ttl;
    var rt_ttl = config.jwt.refresh_token_ttl;

    // response body
    var response = {
      user_id: this.id,
      access_token: jwt.sign(payload, secret, {expiresIn: at_ttl})
    };

    if (rt_ttl) {
      response.refresh_token = jwt.sign(payload, secret, {expiresIn: rt_ttl});
    }

    if (typeof cb !== 'function') return response;

    return cb(null, response);
  }

  // Add method addRole to user
  user.addRole = function (id, role, next) {
    next = next || function () {
    };
    return Role.findOne({where: {name: role}})
      .then(function (role) {
        if (!role) return sendError(next, 'No role found', 404);
        return RoleMapping.findOrCreate({principalType: RoleMapping.USER, principalId: id, roleId: role.id});
      })
      .then(function (data) {
        next(null);
        return null;
      })
      .catch(function (error) {
        return sendError(next, 'Internal error', 500);
      })
  };

  // Add method removeRole to user
  user.removeRole = function (id, role, next) {
    next = next || function () {
    };
    return Role.findOne({where: {name: role}})
      .then(function (role) {
        if (!role) return sendError(next, 'No role found', 404);
        return RoleMapping.findOne({where: {principalType: RoleMapping.USER, principalId: id, roleId: role.id}});
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

  // Add method findByRole to user
  user.findByRole = function (role, next) {
    next = next || function () {
    };
    return Role.findOne({where: {name: role}})
      .then(function (role) {
        if (!role) return sendError(next, 'No role found', 404);
        return RoleMapping.find({where: {roleId: role.id, principalType: 'USER'}});
      })
      .then(function (roleMappings) {
        var ids = _.uniq(_.map(roleMappings, 'principalId'));
        return user.find({where: {id: {inq: ids}}});
      })
      .then(function (users) {
        next(null, users);
        return users;
      })
      .catch(function (error) {
        return sendError(next, 'Internal error', 500);
      })
  };

  // Add method getAllRoles to user
  user.getAllRoles = function (req, next) {
    var userId = req.accessToken.userId;
    if (!userId) {
      return sendError(next, 'You are not connected', 401);
    }
    Role.getRoles({principalType: RoleMapping.USER, principalId: userId}, function (err, ids) {
      if (err) {
        return next(err);
      }
      var dataIds = _.filter(ids, (id) => {
        return !_.isString(id) || id.substr(0, 1) !== '$'
      });
      var dynamicRoles = _.filter(ids, (id) => {
        return _.isString(id) && id.substr(0, 1) === '$'
      });
      // Treat this separately because if dataIds = [], all roles will be return by find request
      if (dataIds.length === 0) {
        next(null, dynamicRoles);
        return Promise.resolve(dynamicRoles);
      }
      Role.find({where: {id: {inq: dataIds}}})
        .then(function (roles) {
          var result = _.map(roles, 'name');
          result = _.uniq(result.concat(dynamicRoles));
          next(null, result);
          return result;
        })
        .catch(function (error) {
          return sendError(next, 'Internal error', 500);
        })
    });
  };

  // Add method getPersistedRoles to user
  user.getPersistedRoles = function (id, next) {
    next = next || function () {
    };
    return RoleMapping.find({where: {principalType: 'USER', principalId: id}})
      .then(function (roleMappings) {
        var ids = _.uniq(_.map(roleMappings, 'roleId'));
        if (ids.length > 0) {
          return Role.find({where: {id: {inq: ids}}});
        } else {
          return [];
        }
      })
      .then(function (roles) {
        var result = _.map(roles, 'name');
        next(null, result);
        return result;
      })
      .catch(function (error) {
        return sendError(next, 'Internal error', 500);
      })
  };

  // Register remote method
  user.remoteMethod('addRole', {
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
  user.remoteMethod('removeRole', {
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
      path: '/:id/removeRole'
    }
  });
  user.remoteMethod('findByRole', {
    accepts: {
      arg: 'role',
      type: 'string',
      required: true
    },
    returns: {
      arg: 'users',
      type: '[object]'
    },
    http: {
      verb: 'get'
    }
  });
  user.remoteMethod('getAllRoles', {
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
  user.remoteMethod('getPersistedRoles', {
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
