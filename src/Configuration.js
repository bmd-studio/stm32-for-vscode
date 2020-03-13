/**
 * MIT License
 *
 * Copyright (c) 2020 Bureau Moeilijke Dingen
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/*
 * Check the current configuration file and adds the option for debug and build tasks.
 */
// import fs from 'fs';

// FIXME: This file is deprecated and should be removed.
import vscode, {
  workspace,
} from 'vscode';
import path from 'path';
import _ from 'lodash';
import shelljs from 'shelljs';
import getOpenOCDTarget from './OpenOcdTargetFiles';

const {
  fs,
} = workspace;

// FIXME: ENOENT on windows appears the .vscode stuff goes somewhere else.
// Should check for a more vscode based solution for this.
function getLaunchTask(info) {
  const config = {
    showDevDebugOutput: true,
    // eslint-disable-next-line no-template-curly-in-string
    cwd: '${workspaceRoot}',
    executable: `./build/${info.target}.elf`,
    name: 'Debug STM32',
    request: 'launch',
    type: 'cortex-debug',
    servertype: 'openocd',
    preLaunchTask: 'Build STM',
    device: 'stlink',
    configFiles: [
      'interface/stlink-v2-1.cfg',
      `target/${getOpenOCDTarget(info.targetMCU)}`,
    ],
  };
  return config;
}

function getBuildTask() {
  const buildTask = {
    label: 'Build STM',
    type: 'process',
    // eslint-disable-next-line no-template-curly-in-string
    command: '${command:stm32-for-vscode.build}',
    options: {
      // eslint-disable-next-line no-template-curly-in-string
      cwd: '${workspaceRoot}',
    },
    group: {
      kind: 'build',
      isDefault: true,
    },
    problemMatcher: [
      '$gcc',
    ],
  };
  return buildTask;
}

function getCleanBuildTask() {
  const buildTask = {
    label: 'Build Clean STM',
    type: 'process',
    // eslint-disable-next-line no-template-curly-in-string
    command: '${command:stm32-for-vscode.cleanBuild}',
    options: {
      // eslint-disable-next-line no-template-curly-in-string
      cwd: '${workspaceRoot}',
    },
    group: {
      kind: 'build',
      isDefault: true,
    },
    problemMatcher: [
      '$gcc',
    ],
  };
  return buildTask;
}

function getFlashTask() {
  const flashTask = {
    label: 'Flash STM',
    type: 'process',
    // eslint-disable-next-line no-template-curly-in-string
    command: '${command:stm32-for-vscode.flash}',
    options: {
      // eslint-disable-next-line no-template-curly-in-string
      cwd: '${workspaceRoot}',
    },
    group: {
      kind: 'build',
      isDefault: true,
    },
    problemMatcher: [
      '$gcc',
    ],
  };
  return flashTask;
}

function updateLaunch(launchPath, err, data, info) {
  let launchJSON = {};
  if (data) {
    try {
      launchJSON = JSON.parse(data);
    } catch (error) {
      // do nothing, usually this means that the JSON file is corrupted
    }
  }

  const config = getLaunchTask(info);

  let hasConfig = false;
  if (launchJSON && !_.isEmpty(launchJSON)) {
    _.map(launchJSON.configurations, (entry) => {
      if (_.isEqual(config, entry)) {
        hasConfig = true;
      }
    });
  } else {
    // it is still false and should be added
    launchJSON.configurations = [];
  }
  if (!hasConfig) {
    launchJSON.configurations.push(config);
    // if not update the launchJSON
    const jsonString = JSON.stringify(launchJSON, null, 2);
    const fString = 'foo';

    fs.writeFile(launchPath, Uint8Array.from(jsonString)).then((error) => {
      if (error) {
        vscode.window.showErrorMessage('Something went wrong with writing the launch config', `${error}`);
      }
    });
    // fs.writeFile(launchPath, jsonString, {
    //   encoding: 'utf8',
    // }, (error) => {
    //   if (error) {
    //     vscode.window.showErrorMessage('Something went wrong with writing the launch config', `${error}`);
    //   }
    // });
  }
}

function updateTasks(tasksPath, err, data) {
  let tasksConfig = {};
  if (!err && data) {
    try {
      tasksConfig = JSON.parse(data);
    } catch (error) {
      // do nothing
    }
  }

  const buildConfig = getBuildTask();
  const cleanBuildConfig = getCleanBuildTask();

  let hasBuildConfig = false;
  let hasCleanBuildConfig = false;

  if (tasksConfig && !_.isEmpty(tasksConfig)) {
    _.map(tasksConfig.tasks, (entry) => {
      if (_.isEqual(buildConfig, entry)) {
        hasBuildConfig = true;
      }
      if (_.isEqual(cleanBuildConfig, entry)) {
        hasCleanBuildConfig = true;
      }
    });
  } else {
    // it is still false and should be added
    tasksConfig.tasks = [];
  }
  if (!hasBuildConfig) {
    tasksConfig.tasks.push(buildConfig);
  }
  if (!hasCleanBuildConfig) {
    tasksConfig.tasks.push(cleanBuildConfig);
  }

  const flashConfig = getFlashTask();
  let hasFlashConfig = false;
  _.map(tasksConfig.tasks, (entry) => {
    if (_.isEqual(flashConfig, entry)) {
      hasFlashConfig = true;
    }
  });
  if (!hasFlashConfig) {
    tasksConfig.tasks.push(flashConfig);
  }
  if (!hasBuildConfig || !hasFlashConfig) {
    const jsonString = JSON.stringify(tasksConfig, null, 2);
    fs.writeFile(tasksPath, jsonString, {
      encoding: 'utf8',
    }, (error) => {
      if (error) {
        vscode.window.showErrorMessage('Something went wrong with writing to the tasks.json file', `${error}`);
      }
    });
  }
}


// export async function getLaunch(workspaceRoot, info) {
//   const launchPath = path.resolve(workspaceRoot, './.vscode/launch.json');
//   const tasksPath = path.resolve(workspaceRoot, './.vscode/tasks.json');
//   fs.readFile(launchPath, 'utf8', (err, data) => {
//     updateLaunch(launchPath, err, data, info);
//   });
//   fs.readFile(tasksPath, 'utf8', (err, data) => {
//     updateTasks(tasksPath, err, data);
//   });
// }

function getIncludePaths(info) {
  const cIncludes = _.map(info.cIncludes, entry => _.replace(entry, '-I', ''));
  const cxxIncludes = _.map(info.cxxIncludes, entry => _.replace(entry, '-I', ''));
  const asmIncludes = _.map(info.asIncludes, entry => _.replace(entry, '-I', ''));
  let includes = _.concat(cIncludes, cxxIncludes, asmIncludes);
  includes = _.uniq(includes);
  includes = includes.sort();
  return includes;
}

function getDefinitions(info) {
  const cDefs = _.map(info.cDefs, entry => _.replace(entry, '-D', ''));
  const cxxDefs = _.map(info.cxxDefs, entry => _.replace(entry, '-D', ''));
  const asDefs = _.map(info.asDefs, entry => _.replace(entry, '-D', ''));
  let defs = _.concat(cDefs, cxxDefs, asDefs);
  defs = _.uniq(defs);
  defs = defs.sort();
  return defs;
}

function getCPropertiesConfig(info) {
  const includePaths = getIncludePaths(info);
  const config = {
    name: 'STM32',
    includePath: includePaths,
    defines: getDefinitions(info),
    compilerPath: shelljs.which('gcc'),
    cStandard: 'c11',
    cppStandard: 'c++11',
  };
  return config;
}

export function updateCProperties(cPropsPath, err, data, info) {
  let cPropsConfig = {};
  if (!err && data) {
    try {
      cPropsConfig = JSON.parse(data);
    } catch (error) {
      // do nothing
    }
  }

  let hasCConfig = false;
  const config = getCPropertiesConfig(info);
  if (cPropsConfig && !_.isEmpty(cPropsConfig)) {
    let index = -1;
    _.map(cPropsConfig.configurations, (entry, ind) => {
      if (_.isEqual(config, entry)) {
        hasCConfig = true;
      } else if (config.name === entry.name) {
        // same but different. Then remove current
        index = ind;
      }
    });
    if (index >= 0) {
      // remove it
      cPropsConfig.configurations.splice(index, 1);
    }
  } else {
    cPropsConfig.configurations = [];
  }

  if (!hasCConfig) {
    cPropsConfig.configurations.push(config);
    const jsonString = JSON.stringify(cPropsConfig, null, 2);
    fs.writeFile(cPropsPath, jsonString, {
      encoding: 'utf8',
    }, (error) => {
      if (error) {
        vscode.window.showErrorMessage('Something went wrong with setting the c/c++ properties');
      }
    });
  }
}

async function checkVscodeFolder(workspaceRoot) {
  return new Promise((resolve, reject) => {
    const vscodeFolderPath = path.resolve(workspaceRoot, './.vscode');
    fs.mkdir(vscodeFolderPath, {
      recursive: true,
    }, (err) => {
      if (err && err.message.indexOf('EEXIST') < 0) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export default async function updateConfiguration(workspaceRoot, info) {
  const launchPath = path.resolve(workspaceRoot, './.vscode/launch.json');
  const tasksPath = path.resolve(workspaceRoot, './.vscode/tasks.json');
  const cPropsPath = path.resolve(workspaceRoot, './.vscode/c_cpp_properties.json');
  console.log(vscode.workspace.textDocuments);
  console.log('found files');
  const files = await vscode.workspace.findFiles('**/.vscode/launch.json');
  console.log(files);
  const config = vscode.workspace.getConfiguration('launch', vscode.workspace.workspaceFolders[0].uri);
  console.log(config);
  console.log(config.get('configurations'));
  config.configurations.push({
    name: 'hello moto',
    type: 'test',
  });
  config.update('configurations', config.configurations);
  return new Promise(async (resolve, reject) => {
    try {
      await checkVscodeFolder(workspaceRoot);
    } catch (err) {
      vscode.window.showErrorMessage('Something went wrong with creating the .vscode folder, for setting setting. Please create it yourself or check folder access privileges.');
      reject(err);
    }
    fs.readFile(launchPath, 'utf8', (err, data) => {
      updateLaunch(launchPath, err, data, info);
    });
    fs.readFile(tasksPath, 'utf8', (err, data) => {
      updateTasks(tasksPath, err, data);
    });
    fs.readFile(cPropsPath, 'utf8', (err, data) => {
      updateCProperties(cPropsPath, err, data, info);
    });
    resolve();
  });
}
