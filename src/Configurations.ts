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
 * The above copyright notice and this permission notice shall be included in
 * all
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
 * Check the current configuration file and adds the option for debug and build
 * tasks.
 */
// import fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import {TextEncoder} from 'util';
import {Uri, workspace,} from 'vscode';
import {writeFileInWorkspace} from './Helpers'



// import getOpenOCDTarget from './OpenOcdTargetFiles';
import getLaunchTask from './LaunchTasksConfig';
import buildTasks from './BuildTasksConfig';

/**
 * Function for updating the launch.json file to include debugging information.
 * @param workspacePathUri Path to the active workspace
 * @param info info gained from the makefile.
 */
function updateLaunch(
    workspacePathUri: Uri, info: {targetMCU: string, target: string}) {
  const launchFile = workspace.getConfiguration('launch', workspacePathUri);
  const launchConfig: object[] = launchFile.get('configurations') || [];
  const config = getLaunchTask(info);
  let hasConfig = false;
  if (launchConfig && !_.isEmpty(launchConfig)) {
    _.map(launchConfig, (entry: object) => {
      if (_.isEqual(config, entry)) {
        hasConfig = true;
      }
    });
  }
  if (!hasConfig) {
    launchConfig.push(config);
    // if not update the launchJSON
    launchFile.update('configurations', launchConfig);
  }
}

/**
 *
 * @param workspacePathUri Path to the active workspace
 */
function updateTasks(workspacePathUri: Uri) {
  const taskFile = workspace.getConfiguration('tasks', workspacePathUri);
  const tasksConfig: object[] = taskFile.get('tasks') || [];
  console.log('taskFile');
  console.log(JSON.stringify(taskFile));
  let hasBuildConfig = false;
  let hasCleanBuildConfig = false;
  let hasFlashConfig = false;
  let hasFlashDFUConfig = false;
  if (tasksConfig && !_.isEmpty(tasksConfig)) {
    _.map(tasksConfig, (entry: object) => {
      if (_.isEqual(buildTasks.buildTask, entry)) {
        hasBuildConfig = true;
      }
      if (_.isEqual(buildTasks.cleanBuild, entry)) {
        hasCleanBuildConfig = true;
      }
      if (_.isEqual(buildTasks.flashTask, entry)) {
        hasFlashConfig = true;
      }
      if (_.isEqual(buildTasks.flashDFUTask, entry)) {
        hasFlashDFUConfig = true;
      }
    });
  }

  if (!hasBuildConfig) {
    tasksConfig.push(buildTasks.buildTask);
  }
  if (!hasCleanBuildConfig) {
    tasksConfig.push(buildTasks.cleanBuild);
  }
  if (!hasFlashConfig) {
    tasksConfig.push(buildTasks.flashTask)
  }
  if (!hasFlashDFUConfig) {
    tasksConfig.push(buildTasks.flashDFUTask)
  }
  if (!hasFlashConfig || !hasFlashDFUConfig || !hasCleanBuildConfig || !hasBuildConfig) {
    console.log('updating task')
    taskFile.update('tasks', tasksConfig);
  }
}

function getIncludePaths(
    info: {cIncludes: string[], cxxIncludes: string[], asIncludes: string[]}) {
  const cIncludes = _.map(info.cIncludes, entry => _.replace(entry, '-I', ''));
  const cxxIncludes =
      _.map(info.cxxIncludes, entry => _.replace(entry, '-I', ''));
  const asmIncludes =
      _.map(info.asIncludes, entry => _.replace(entry, '-I', ''));
  let includes = _.concat(cIncludes, cxxIncludes, asmIncludes);
  includes = _.uniq(includes);
  includes = includes.sort();
  return includes;
}

function getDefinitions(
    info: {cDefs: string[], cxxDefs: string[], asDefs: string[]}) {
  const cDefs = _.map(info.cDefs, entry => _.replace(entry, '-D', ''));
  const cxxDefs = _.map(info.cxxDefs, entry => _.replace(entry, '-D', ''));
  const asDefs = _.map(info.asDefs, entry => _.replace(entry, '-D', ''));
  let defs = _.concat(cDefs, cxxDefs, asDefs);
  defs = _.uniq(defs);
  defs = defs.sort();
  return defs;
}

function getCPropertiesConfig(info: {
  cDefs: string[],
  cxxDefs: string[],
  asDefs: string[],
  cIncludes: string[],
  cxxIncludes: string[],
  asIncludes: string[],
  armToolchain: string
}) {
  const includePaths = getIncludePaths(info);
  const config = {
    name: 'STM32',
    includePath: includePaths,
    defines: getDefinitions(info),
    compilerPath: (info.armToolchain || '') + 'arm-none-eabi-gcc',
    cStandard: 'c11',
    cppStandard: 'c++11',
  };
  return config;
}

export async function updateCProperties(workspacePathUri: Uri, info: {
  cDefs: string[],
  cxxDefs: string[],
  asDefs: string[],
  cIncludes: string[],
  cxxIncludes: string[],
  asIncludes: string[],
  armToolchain: string
}) {
  console.log('info', info);
  const c_cppFiles = await workspace.findFiles('**/c_cpp_properties.json');
  console.log('c_cppFiles', c_cppFiles);
  let configFile: {
    configurations: {includePath: string[], defines: string[]}[],
    version: number
  } = {configurations: [], version: 4};

  if (c_cppFiles[0]) {
    const tempFile =
        JSON.parse((await workspace.fs.readFile(c_cppFiles[0])).toString());
    console.log('temp file');
    console.log(tempFile);
    configFile = tempFile;
    if (!configFile.configurations) {
      configFile.configurations = [];
    }
  }
  console.log('current config file', configFile);
  const cPropsConfig = configFile.configurations;
  let hasCConfig = false;

  const config = getCPropertiesConfig(info);
  let index = -1;
  if (cPropsConfig && !_.isEmpty(cPropsConfig)) {
    _.map(cPropsConfig, (entry: {name: string}, ind) => {
      if (_.isEqual(config, entry)) {
        hasCConfig = true;
      } else if (config.name === entry.name) {
        // same but different. Then remove current
        hasCConfig = true;
        index = ind;
      }
    });
  }

  if (!hasCConfig) {
    configFile.configurations.push(config);
  } else {
    // should add missing includes
    console.log('configs');
    console.log(configFile);
    configFile.configurations[index].includePath =
        _.uniq(cPropsConfig[index].includePath.concat(config.includePath));
    configFile.configurations[index].defines =
        _.uniq(cPropsConfig[index].defines.concat(config.defines));
  }

  await writeFileInWorkspace(
      workspacePathUri, '.vscode/c_cpp_properties.json',
      JSON.stringify(configFile, null, 2));
}

export default async function updateConfiguration(
    workspaceRoot: Uri, info: any) {
  updateLaunch(workspaceRoot, info);
  updateTasks(workspaceRoot);
  updateCProperties(workspaceRoot, info);
};
