/*
 * Check the current configuration file and adds the option for debug and build tasks.
*/
import fs from 'fs';
import vscode from 'vscode';
import path from 'path';
import _ from 'lodash';
import shelljs from 'shelljs';

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
      `target/${info.targetMCU}.cfg`,
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
    fs.writeFile(launchPath, jsonString, { encoding: 'utf8' }, (error) => {
      if (error) {
        vscode.window.showErrorMessage('Something went wrong with writing the launch config', `${error}`);
      }
    });
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

  let hasBuildConfig = false;

  if (tasksConfig && !_.isEmpty(tasksConfig)) {
    _.map(tasksConfig.tasks, (entry) => {
      if (_.isEqual(buildConfig, entry)) {
        hasBuildConfig = true;
      }
    });
  } else {
    // it is still false and should be added
    tasksConfig.tasks = [];
  }
  if (!hasBuildConfig) {
    tasksConfig.tasks.push(buildConfig);
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
    fs.writeFile(tasksPath, jsonString, { encoding: 'utf8' }, (error) => {
      if (error) {
        vscode.window.showErrorMessage('Something went wrong with writing to the tasks.json file', `${error}`);
      }
    });
  }
}


export async function getLaunch(workspaceRoot, info) {
  const launchPath = path.resolve(workspaceRoot, './.vscode/launch.json');
  const tasksPath = path.resolve(workspaceRoot, './.vscode/tasks.json');
  fs.readFile(launchPath, 'utf8', (err, data) => {
    updateLaunch(launchPath, err, data, info);
  });
  fs.readFile(tasksPath, 'utf8', (err, data) => {
    updateTasks(tasksPath, err, data);
  });
}

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
    fs.writeFile(cPropsPath, jsonString, { encoding: 'utf8' }, (error) => {
      if (error) {
        vscode.window.showErrorMessage('Something went wrong with setting the c/c++ properties');
      }
    });
  }
}

export default function updateConfiguration(workspaceRoot, info) {
  const launchPath = path.resolve(workspaceRoot, './.vscode/launch.json');
  const tasksPath = path.resolve(workspaceRoot, './.vscode/tasks.json');
  const cPropsPath = path.resolve(workspaceRoot, './.vscode/c_cpp_properties.json');
  fs.readFile(launchPath, 'utf8', (err, data) => {
    updateLaunch(launchPath, err, data, info);
  });
  fs.readFile(tasksPath, 'utf8', (err, data) => {
    updateTasks(tasksPath, err, data);
  });
  fs.readFile(cPropsPath, 'utf8', (err, data) => {
    updateCProperties(cPropsPath, err, data, info);
  });
}
