/* eslint-disable no-use-before-define */
/* eslint-disable max-lines-per-function */
/* eslint-disable max-statements */
/* eslint-disable one-var */
const _ = require('lodash');
const fs = require('fs');
const fsRecursive = require('recursive-readdir');
const JSON5 = require('json5');
const shell = require('shelljs');
const getConfigFiles = require('./configFiles');

let workspace;
try {
  const vscode = require('vscode');
  workspace = vscode.workspace;
} catch (err) {
  workspace = null;
}

const {
  extractMakeFileInfo,
  extractFileTypes,
  listFiles,
} = require('./info');
const makefileTemplate = require('./makefileTemplate');
const {
  createMakefile,
} = require('./createMakefile');


async function init(workspacePath, armPath) {
  return new Promise((resolve, reject) => {
    extractFileTypes(workspacePath).then((output) => {
      extractMakeFileInfo(output.makefile).then((makefileInfo) => {
        // const newMakeFile createMakefile(output, makefileInfo);
        updateBuildAndDebugFiles(makefileInfo.target, makefileInfo.targetMCU, workspacePath, armPath).then((output) => {
          // console.log('updated config files sucessfully');
        });
        createMakefile(output, makefileInfo, workspacePath).then((info) => {
          // console.log('succesfully created and updated make file', makefileInfo);
          console.log('created make file');
          resolve(info);
        }).catch((err) => {
          reject(err);
          // console.error(err);
        });
      });
    });
  });
  // return listFiles();
}


/* Function which deals with getting the tasks.json and launch.json files
 * and setting the appropriate configurations.
 */
async function updateBuildAndDebugFiles(firmwareName, targetName, workspacePath, armPath) {
  // first get the launch and task json files
  // console.log('updating build and debug files with', firmwareName, targetName);
  const vscodeDirErr = await dirGuard(`${workspacePath}/.vscode`);
  if (vscodeDirErr) {
    vscode.window.showWarningMessage('Something went wrong with creating the .vscode directory');
    return new Promise((resolve, reject) => {
      reject(vscodeDirErr);
    });
  }
  // now get or directly write to the launch.json files and the task.json files
  const launchProm = getTextFile(`${workspacePath}/.vscode/launch.json`).then((launchString) => {
    const launchFile = parseConfigFile(launchString);
    const launchConfig = getConfigFiles('debug', firmwareName, targetName, workspacePath);

    // now should check for the entry and if not present update the launch file
    _.set(launchFile, 'configurations', _.get(launchFile, 'configurations', [])); // to make sure that is an array
    const hasConfig = checkForConfig(launchFile.configurations, launchConfig, 'name');
    if (hasConfig) {
      return new Promise((resolve, reject) => {
        resolve();
      });
    }
    // else the launch file config should be added and written
    launchFile.configurations.push(launchConfig);
    return new Promise((resolve, reject) => {
      fs.writeFile(`${workspacePath}/.vscode/launch.json`, JSON.stringify(launchFile, null, 2), (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });

  const tasksProm = getTextFile(`${workspacePath}/.vscode/tasks.json`).then((tasksString) => {
    const buildTask = getConfigFiles('build', firmwareName, targetName, workspacePath, armPath);
    const uploadTask = getConfigFiles('upload', firmwareName, targetName, workspacePath);

    const taskFile = parseConfigFile(tasksString);
    _.set(taskFile, 'tasks', _.get(taskFile, 'tasks', []));
    const hasBuildTask = checkForConfig(taskFile.tasks, buildTask, 'label');
    const hasLoadTask = checkForConfig(taskFile.tasks, uploadTask, 'label');
    if (hasBuildTask && hasLoadTask) {
      return new Promise((resolve, reject) => {
        resolve();
      });
    }
    if (!hasBuildTask) {
      taskFile.tasks.push(buildTask);
    }
    if (!hasLoadTask) {
      taskFile.tasks.push(uploadTask);
    }
    return new Promise((resolve, reject) => {
      fs.writeFile(`${workspacePath}/.vscode/tasks.json`, JSON.stringify(taskFile, null, 2), (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  });

  return new Promise((resolve, reject) => {
    Promise.all([launchProm, tasksProm]).then((values) => {
      resolve(values);
    }).catch((err) => {
      reject(err);
    });
  });
}

/* Parses a json config file. Returns an empty object is nothing is found
 */

function parseConfigFile(file) {
  let configFile = {};
  if (!_.isEmpty(file)) {
    try {
      configFile = JSON5.parse(file);
    } catch (err) {
      // console.error('something went wrong with parsing the launch file', err);
      configFile = {};
    }
  }
  return configFile;
}

/* Checks if the provided array has the configuration object
 * Be aware does mutate the provided array
 */
function checkForConfig(configArray, configObj, checkPath) {
  let hasConfig = false;
  _.map(configArray, (config, ind) => {
    if (_.get(config, checkPath) === _.get(configObj, checkPath)) {
      hasConfig = true;
      if (!_.isEqual(config, configObj)) {
        hasConfig = false;
        configArray.splice(ind, 1);
      }
    }
  });
  return hasConfig;
}

async function getTextFile(path) {
  return new Promise((resolve, reject) => {
    fs.readFile(path, {
      encoding: 'utf8',
    }, (err, data) => {
      if (err) {
        resolve('');
      } else {
        resolve(data);
      }
    });
  });
}

async function dirGuard(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (err, stats) => {
      if (err) {
        fs.mkdir(path, (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

function checkForRequirements(outputFunc, vscode) {
  let armPath = null;

  if (vscode) {
    // if it has vscode then it is spawned within the extension itself.
    const config = workspace.getConfiguration('cortex-debug');
    console.log('config', config);

    if (!shell.which('openocd')) {
      // should also check if it has it in the cortex debug settings
      if (!shell.which(config.openocdPath) && !shell.which(`${config.openocdPath}/openocd`)) {
        outputFunc('This extension requires: "openocd" to be available in PATH, see: http://openocd.org/getting-openocd/ for more info');
      }
    }
    if (!shell.which('arm-none-eabi-gcc')) {
      if (!shell.which(`${config.armToolchainPath}/arm-none-eabi-gcc`)) {
        outputFunc('This extension requires: "arm-none-eabi-gcc" to be available in PATH, please install make for your specific environment');
      } else {
        armPath = config.armToolchainPath;
      }
    }
    if (!shell.which('arm-none-eabi-g++')) {
      outputFunc('This extension requires: "arm-none-eabi-g++" to be available in PATH, please install make for your specific environment');
    }
    if (!shell.which('arm-none-eabi-objcopy')) {
      outputFunc('This extension requires: "arm-none-eabi-objcopy" to be available in PATH, please install make for your specific environment');
    }
    if (!shell.which('arm-none-eabi-size')) {
      outputFunc('This extension requires: "arm-none-eabi-size" to be available in PATH, please install make for your specific environment');
    }
    if (!shell.which('something')) {

    }
  }

  if (!shell.which('openocd')) {
    // should also check if it has it in the cortex debug settings

    outputFunc('This extension requires: "openocd" to be available in PATH, see: http://openocd.org/getting-openocd/ for more info');
  }
  if (!shell.which('make')) {
    outputFunc('This extension requires: "make" to be available in PATH, please install make for your specific environment');
  }
  if (!shell.which('st-flash')) {
    outputFunc('This extension requires: "st-flash" to be available in PATH, please install make for your specific environment');
  }
  return armPath;
}

module.exports = {
  init,
  checkForRequirements,
};
