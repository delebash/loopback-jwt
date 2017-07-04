'use strict';
let path = require('path');
let fs = require('fs-extra');
let _ = require('lodash');
let loopback = require('loopback');
let app = require('../server');

const outputPath = path.join(__dirname, '../../common/models');
const model_config = path.join(__dirname, '../model-config.json');
const mode_config_meta = path.join(__dirname, '../model-config-meta.json');
const dbname = 'northwind';

let ds = app.datasources[dbname];

main();

async function main() {

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

  try {
    await fs.ensureDir(outputPath);
    // console.log('success!')
  } catch (e) {
    console.log('Create directory error: ' + e)
  }

  let models = await ds.discoverModelDefinitions({schema: dbname});

  for (let model of models) {
    let schema = await ds.discoverSchema(model.name, {schema: dbname, all: true, associations: true});
    schema.name = lowercaseFirstLetter(model.name)
    if (schema.name === 'acl' || schema.name === 'user' || schema.name === 'role' || schema.name === 'rolemapping' || schema.name === 'accesstoken'){
      if(schema.name === 'acl') schema.base = 'ACL';
      if(schema.name === 'user') schema.base = 'User';
      if(schema.name === 'accesstoken') schema.base = 'AccessToken';
      if(schema.name === 'role') schema.base = 'Role';
      if(schema.name === 'rolemapping') schema.base = 'RoleMapping';

    }else{
      schema.base = "PersistedModel";
    }

    let table = model.name

    let myJson = {
      [table]: {
        public: true,
        dataSource: dbname
      }
    };

    //Append info to model-config.json
    append(myJson, model_config)

    //Write json and javascript model files
    let output_json = outputPath + '/' + model.name + '.json';
    try {
      let exist = await fs.existsSync(output_json)
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
      let exist = await fs.existsSync(output_javascript)
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

  console.log("Finished creating model files")
  await ds.disconnect();
  console.log("Datasource connection closed")
}

//Append Json Funtion
async function append(prop, file) {
  let data = '';
  try {
    data = await fs.readJSON(file);
    if (!data) {
      await fs.outputJson(file, prop, {spaces: 2})
    }
    else {
      let merged = _.merge(data, prop);
      await fs.outputJson(file, merged, {spaces: 2})
    }
  } catch (e) {
    console.log('error: ', e);
    if (e && e.code === 'ENOENT') {
      await fs.outputJson(file, prop, {spaces: 2})
    }
  }
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
