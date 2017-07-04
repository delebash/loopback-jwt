'use strict';
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const loopback = require('loopback');
const app = require('../server');
const outputPath = path.join(__dirname, '../../common/models');
let model_config_meta = path.join(__dirname, './model_config_meta.json');
let user_acls = path.join(__dirname, './user-acls.json');
let user_js = path.join(__dirname, '../../common/models/user.js');
let replace_user_js = path.join(__dirname, './replace-user.js');
const model_config = path.join(__dirname, '../model-config.json');
const dbname = 'northwind';


let ds = app.datasources[dbname];

main();

async function main() {

  try {
    await fs.ensureDir(outputPath);
    // console.log('success!')
  } catch (e) {
    console.log('Create directory error: ' + e)
  }

  //Create clean model-config
  //ReplaceFile(model_config_meta, model_config);
  await fs.copy(model_config_meta, model_config, {replace: true});

  //Create built in tables if not exist
  try {
    //Check for built-in tables
    let tbl = await ds.discoverSchema('acl', {schema: dbname})
    console.log('exists!')
  } catch (e) {
    if (e.message === "Table 'acl' does not exist.") {
      builtin();
    } else {
      console.log('Create built-in error: ' + e)
    }
  }


  let data = await fs.readJSON(model_config);
  let uacls = await fs.readJSON(user_acls);

  let merge = {};
  let merged = {};

  let models = await ds.discoverModelDefinitions({schema: dbname});
//console.log('sdfasdf')
  for (let model of models) {
    let schema = await ds.discoverSchema(model.name, {schema: dbname, all: true, associations: true});
    schema.name = lowercaseFirstLetter(model.name)
    if (schema.name === 'acl' || schema.name === 'user' || schema.name === 'role' || schema.name === 'rolemapping' || schema.name === 'accesstoken') {
      if (schema.name === 'acl') schema.base = 'ACL';
      if (schema.name === 'user') schema.base = 'User';
      if (schema.name === 'accesstoken') schema.base = 'AccessToken';
      if (schema.name === 'role') schema.base = 'Role';
      if (schema.name === 'rolemapping') schema.base = 'RoleMapping';

    } else {
      schema.base = "PersistedModel";
    }

    let table = model.name;

    let obj = {
      [table]: {
        public: true,
        dataSource: dbname
      }
    };

    //add validation eerror
    schema.options.validateUpsert = true;
    //move relations to top level so lb acl deny all doesn't add empty relations
    schema.relations = schema.options.relations;
    delete schema.options.relations;

    if (table === 'acl' || table === 'user' || table === 'role' || table === 'rolemapping' || table === 'accesstoken') {
      if (table === 'user') {
        schema.properties.id.required = false;
        schema.acls = uacls;
      }
    } else {
      merge = _.merge(data, obj);
      merged = _.merge(merge, obj);
    }


    //Write json and javascript model files
    let output_json = outputPath + '/' + model.name + '.json';
    try {
      let exist = await fs.exists(output_json)
      if (!exist) {
        await fs.writeFile(output_json, JSON.stringify(schema, null, 4))
        console.log('Created ' + output_json)
      } else {
        console.log('File exits not modified ' + output_json)
      }
    } catch (e) {
      console.log('error: ' + e)
    }

    let output_javascript = outputPath + '/' + model.name + '.js';
    try {
      let exist = await fs.exists(output_javascript)
      if (!exist) {
        await fs.writeFile(output_javascript, jsFileString(model.name, null, 4))
        console.log('Created ' + output_javascript)
      } else {
        console.log('File exists not modified ' + output_javascript)
      }
    } catch (e) {
      console.log('error: ' + e)
    }
  }


  //Set AccessToken to use the user model
  merged.AccessToken.relations.user.model = 'user';

  merged.user = merged.User;
  //  delete merged.acl;
  delete merged.User;


 await fs.outputJson(model_config, merged, {spaces: 2});
  await fs.copy(replace_user_js, user_js, {replace: true});
  console.log("Finished creating model files")
  await ds.disconnect();
  console.log("Datasource connection closed")
}


function lowercaseFirstLetter(string) {
  return string.charAt(0)
    .toLowerCase() + string.slice(1);
}

function uppercaseFirstLetter(string) {
  return string.charAt(0)
    .toUpperCase() + string.slice(1);
}

function jsFileString(model_name) {
  return '' + 'module.exports = function(' + lowercaseFirstLetter(model_name) + ') {\n' + '\t\n' + '};';
}

function builtin() {
  let lbTables = ['User', 'AccessToken', 'ACL', 'RoleMapping', 'Role'];
  ds.automigrate(lbTables, function (er) {
    if (er) throw er;
    console.log('Loopback tables [' - lbTables - '] created in ', ds.adapter.name);
    ds.disconnect();
  });
}


//Append Json Funtion
// async function append(prop, file) {
//   let data = '';
//   try {
//     data = await fs.readJSON(file);
//     if (!data) {
//       await fs.outputJson(file, prop, {spaces: 2})
//     }
//     else {
//
//       let merged = _.merge(data, prop);
//       await fs.outputJson(file, merged, {spaces: 2})
//     }
//   } catch (e) {
//     console.log('error: ', e);
//     if (e && e.code === 'ENOENT') {
//       await fs.outputJson(file, prop, {spaces: 2})
//     }
//   }
// }


// function replaceFile(input, output) {
// //   , function (err) {
// //     if (err) {
// //       // i.e. file already exists or can't write to directory
// //       throw err;
// //     }
// //     console.log('complete')
// //
// //   });
// // }


//copy model-config-meta and overwrite mondel-config
// try {
//   await fs.copy(modelfile_meta, modelfile)
//   console.log('success!')
// } catch (e) {
//   console.log('error: ' + e)
// }

//clear models directory create if not exits
// try {
//   await fs.emptyDir(outputPath);
//   console.log('success!')
// } catch (e) {
//   console.log('error: ' + e)
// }
