model-config

Instead of using the default User you are going to extend it and name it user lowercase.  The name could be anything such as customer as long as customer's base = User or user's  base = User

Also since you are not using the default User you have to make a new relationship for AccessToken to your user or customer

      "user": {
    "dataSource": "northwind",
    "options": {
      "emailVerificationRequired": false
    }
      },
      "AccessToken": {
    "dataSource": "northwind",
    "public": false,
    "relations": {
      "user": {
    "type": "belongsTo",
    "model": "user",
    "foreignKey": "userId"
      }
    }
      },

    user.json
    "name": "user",
      "base": "User",

Error  Cannot migrate models not attached to this datasource: User AccessToken ACL RoleMapping Role


past model-meta-userrole-for-builtin.json into model-config
 node ./server/bin/builtin.js

Rerun import and setup your user
 node ./server/bin/import.js

Delete accessroles, roles ...  and with model-config-userrole.json


"ValidationError","message":"The `user` instance is not valid. Details: `id` can't be blank

in user.json
for id set "required": false,

**Overriding Default User Managment**
model-config default user auth setup

These are the built-in User authentication models, they do not have a model in the model folder as they are built-in models.  If you want to extend them then you create a corresponding a new model in your model folders that has its base set to what ever built-in model you are inheriting from

**Built-in models
**

User
Role
ACL
RoleMapping
AccessToken

It is common to just extend the built-in User model
To do this create as new model it can be call anything such as `myuser` in our case we are just going to call it `user` in lowercase
So create a user.js and user.json in your model folder

In our case we are importing the user,role ect tables from our database and creating the corresponding models

In each .json file you will notice "base" this tells the model what to inherit so user.json inherits built in User
role.json inherits built in Role

Since we are only overriding User we do not need to worry about the other models role,rolemapping ect...

At this point you do not need to modify user.json as it already has any columns we defined from our database

**Edit
** `model-config.json`

When we did our import you will see the lowercase user,role,rolemapping,acl ect models we could extend each one of these but in our case we are only extending user to you can delete these.

So you will have the lowercase user entry corresponding to our user.js and user.json model

In addition you will still have the built-in entries for Role,RoleMapping,AccessToken ect...

AccessToken needs to be linked via relationships to our new user model entry instead of the built-in uppercase User entry that we deleted

Modify AccessToken as follows

      "AccessToken": {
    "dataSource": "northwind",
    "public": false,
    "relations": {
      "user": {
    "type": "belongsTo",
    "model": "user",
    "foreignKey": "userId"
      }
    }
      },


We could extend each built in model as we did user by created each .js .json in the models folder and having them inherit from the corresponding base such as Role

There are somethings you would have to do like setup relationships but I am not going into this now


server/bin folder
**import.js** imports data from database defined in datasources.json

**builtin.js** create tables from your built-in models such as User,Role,RoleMapping ect..

**creat_admin.js**  creates a new user and a role called admin and links them together in rolemapping table
Any new users that you want to be admin you create a new rolemapping to the admin role

**Note: User api**
The user api only exposes create user as unauthenticated all other methods for user have to be from an authenticated user such as get user. You can override then in the user.json acl's, but no need as far as I can tell


**Enable SwaggerUI to use use jwt as Set Token**

Edit
**server.js**
set   bearerTokenBase64Encoded:false
Add to server.js above app.start

      app.use(loopback.token({
    	currentUserLiteral: 'me',
    bearerTokenBase64Encoded:false
      }));
 
**In node_modules/loopback-component-explorer 
index.js**
**add securityDefinitions**

Find the var remotes line and add it to the swaggerObject object as so. 

    var remotes = loopbackApplication.remotes();

Add to swagger object
      swaggerObject.securityDefinitions = {
    "bearer": {
      "type": "apiKey",
      "name": "Authorization",
      "in": "header"
    }
      }




Edit
**public/lib/loadSwaggerUI.js**
find

     var apiKeyAuth =
     new SwaggerClient.ApiKeyAuthorization('access_token', key, 'query');
     window.swaggerUi.api.clientAuthorizations.add('key', apiKeyAuth);

replace with -- This adds the Bearer token

        var apiKeyAuth = new SwaggerClient.ApiKeyAuthorization( "Authorization", key, "header" );
      window.swaggerUi.api.clientAuthorizations.add( "bearer", apiKeyAuth );
 

**ACLS**
For each model you can specify acls else if nothing is specified than it is open to all

So deny access to all by running lb acl
All Models
All Methods
All Users
Deny access

**Important:** Delete this from user.json as it is already locked down by default inheritance to create only for unauthenticated
You can add other restrictions such as READ only for admin  etc.

**Example acls for employee.json**
http://loopback.io/doc/en/lb3/Controlling-data-access.html
First deny all then allow admin to read

**NOTE:** acls apply from bottom to top in rule order

    {
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "DENY"
    },
    {
      "accessType": "EXECUTE",
      "principalType": "ROLE",
      "principalId": "admin",
      "permission": "ALLOW",
      "property": "find"
    }

**Note**: accessType can be READ,WRITE,EXECUTE
https://loopback.io/doc/en/lb2/Controlling-data-access.html

For built in method you can use READ/WRITE prospectively

**READ:**


- exists Boolean method that determines whether a user exists.
- findById Find a user by ID.
- find Find all users that match specified conditions.
- findOne  Finds a single user instance that matches specified conditions.
- count Returns the number of users that match the specified conditions.

**WRITE:**

- create create a new user.
- updateAttributes (update) update a user record.
- upsert (update or insert) update or insert a new user record.
- destroyById (equivalent to removeById or deleteById) delete the user with the specified ID

For other methods, the default access type is EXECUTE
EXECUTE allows you to READ or WRITE. 


**Misc:**
access-token.js  no need to modify just for information purposes
this disables the decoding of the json token as seen in this snippet by using the bearerTokenBase64Encoded option set in the sever.js

     app.use(loopback.token({currentUserLiteral: 'me',
    bearerTokenBase64Encoded:false
      }));
    
Snippet in access-token where bearerTokenBase64Encoded is used just for reference

       if (typeof id === 'string') {
    // Add support for oAuth 2.0 bearer token
    // http://tools.ietf.org/html/rfc6750
    if (id.indexOf('Bearer ') === 0) {
      id = id.substring(7);
      if (options.bearerTokenBase64Encoded) {
    // Decode from base64
    var buf = new Buffer(id, 'base64');
    id = buf.toString('utf8');
      }
    }



Create Built-in User models and migrate to sql `node ./server/bin/builtin.js`
In your model-config.json just paste

     {
      "_meta": {
    "sources": [
      "loopback/common/models",
      "loopback/server/models",
      "../common/models",
      "./models"
    ],
    "mixins": [
      "loopback/common/mixins",
      "loopback/server/mixins",
      "../common/mixins",
      "./mixins"
    ]
      },
      "User": {
    "dataSource": "northwind",
    "options": {
      "emailVerificationRequired": false
    }
      },
      "AccessToken": {
    "dataSource": "northwind",
    "public": false,
    "relations": {
      "user": {
    "type": "belongsTo",
    "model": "user",
    "foreignKey": "userId"
      }
    }
      },
      "ACL": {
    "dataSource": "northwind",
    "public": false
      },
      "RoleMapping": {
    "dataSource": "northwind",
    "public": false
      },
      "Role": {
    "dataSource": "northwind",
    "public": false
      }
    }
    
Notice we are using all built-in models at first, later we will change User to our custom user model

Next import all models from sql server
`node ./server/bin/import.js`

Next change User to user to indicate we are using our custom user model and not the built-in User model.  We could have named user anything such as accounts and then the model accounts in the models folder would just inherit User as it's base.  We are just calling it user our custom model which differs from uppercase User which means built-in.


Paste into user.js
    
    const jwt = require('jsonwebtoken');
    const config = require('../../server/config.json');
    //var models = require('../../server/model-config.json');
    const loopback = require('loopback');
    let app = require('../../server/server');
    // const Role = app.models.Role; //built-in
    const RoleMapping = app.models.RoleMapping; //built-in
    
    module.exports = function (user) {
      var Role = app.models.Role;
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
    
    
      /////METHODS/////
      user.greet = function(msg, cb) {
    cb(null, 'Greetings... ' + msg);
      }
    
      user.remoteMethod('greet', {
    accepts: {arg: 'msg', type: 'string'},
    returns: {arg: 'greeting', type: 'string'}
      });
    
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
      verb: 'post'
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
      verb: 'post',
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
    
    Paste into user.json
    
    {
      "name": "user",
      "base": "User",
      "options": {
    "idInjection": false,
    "mysql": {
      "schema": "northwind",
      "table": "user"
    }
      },
      "properties": {
    "id": {
      "type": "Number",
      "id": 1,
      "required": false,
      "length": null,
      "precision": 10,
      "scale": 0,
      "mysql": {
    "columnName": "id",
    "dataType": "int",
    "dataLength": null,
    "dataPrecision": 10,
    "dataScale": 0,
    "nullable": "N"
      }
    },
    "realm": {
      "type": "String",
      "required": false,
      "length": 512,
      "precision": null,
      "scale": null,
      "mysql": {
    "columnName": "realm",
    "dataType": "varchar",
    "dataLength": 512,
    "dataPrecision": null,
    "dataScale": null,
    "nullable": "Y"
      }
    },
    "username": {
      "type": "String",
      "required": false,
      "length": 512,
      "precision": null,
      "scale": null,
      "mysql": {
    "columnName": "username",
    "dataType": "varchar",
    "dataLength": 512,
    "dataPrecision": null,
    "dataScale": null,
    "nullable": "Y"
      }
    },
    "password": {
      "type": "String",
      "required": true,
      "length": 512,
      "precision": null,
      "scale": null,
      "mysql": {
    "columnName": "password",
    "dataType": "varchar",
    "dataLength": 512,
    "dataPrecision": null,
    "dataScale": null,
    "nullable": "N"
      }
    },
    "email": {
      "type": "String",
      "required": true,
      "length": 512,
      "precision": null,
      "scale": null,
      "mysql": {
    "columnName": "email",
    "dataType": "varchar",
    "dataLength": 512,
    "dataPrecision": null,
    "dataScale": null,
    "nullable": "N"
      }
    },
    "emailverified": {
      "type": "Number",
      "required": false,
      "length": null,
      "precision": 3,
      "scale": 0,
      "mysql": {
    "columnName": "emailVerified",
    "dataType": "tinyint",
    "dataLength": null,
    "dataPrecision": 3,
    "dataScale": 0,
    "nullable": "Y"
      }
    },
    "verificationtoken": {
      "type": "String",
      "required": false,
      "length": 512,
      "precision": null,
      "scale": null,
      "mysql": {
    "columnName": "verificationToken",
    "dataType": "varchar",
    "dataLength": 512,
    "dataPrecision": null,
    "dataScale": null,
    "nullable": "Y"
      }
    },
    "displayname": {
      "type": "String",
      "required": false,
      "length": 512,
      "precision": null,
      "scale": null,
      "mysql": {
    "columnName": "displayName",
    "dataType": "varchar",
    "dataLength": 512,
    "dataPrecision": null,
    "dataScale": null,
    "nullable": "Y"
      }
    }
      },
      "validations": [],
      "relations": {},
      "acls": [
    {
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "DENY"
    },
    {
      "accessType": "WRITE",
      "principalType": "ROLE",
      "principalId": "$everyone",
      "permission": "ALLOW",
      "property": "create"
    },
    {
      "accessType": "*",
      "principalType": "ROLE",
      "principalId": "admin",
      "permission": "ALLOW"
    }
      ],
      "methods": {}
    }
