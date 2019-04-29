/* eslint-disable max-lines-per-function */
/* eslint-disable max-statements */
/* eslint-disable one-var */
const _ = require('lodash');
const fs = require('fs');
const fsRecursive = require('recursive-readdir');
const makefileTemplate = require('./makefileTemplate');
const vscode = require('vscode'),
{
  extractMakeFileInfo,
  extractFileTypes,
  listFiles
} = require('./info');
const {createMakefile} = require('./createMakefile');

async function init() {
  // return listFiles();
  return extractFileTypes().then((output) => {
    console.log('files has been extracted');
    console.log(output);
    extractMakeFileInfo(output.makefile).then((makefileInfo) => {
      createMakefile(output, makefileInfo)
    });
  });
  // console.log(await listFiles());
  // console.log('finished');
}


module.exports = {
  init,
};