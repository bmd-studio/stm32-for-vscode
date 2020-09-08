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

import { DebugConfiguration, Uri, workspace } from 'vscode';

import MakeInfo from '../types/MakeInfo';
import buildTasks from './BuildTasksConfig';
import getLaunchTask from './LaunchTasksConfig';
import updateCProperties from './CCCPConfig';

// import getOpenOCDTarget from './OpenOcdTargetFiles';




/**
 * Function for updating the launch.json file to include debugging information.
 * @param workspacePathUri Path to the active workspace
 * @param info info gained from the makefile.
 */
export function updateLaunch(
  workspacePathUri: Uri, info: MakeInfo): Promise<void> {
  const launchFile = workspace.getConfiguration('launch', workspacePathUri);
  const launchConfig: object[] = launchFile.get('configurations', []);
  const config = getLaunchTask(info);
  let hasConfig = false;
  let configWithSameNameIndex = -1;
  if (launchConfig && !_.isEmpty(launchConfig)) {
    _.map(launchConfig, (entry: DebugConfiguration, index) => {
      if (_.isEqual(config, entry)) {
        hasConfig = true;
      }
      if (entry.name === config.name) {
        configWithSameNameIndex = index;
      }
    });
  }
  if (!hasConfig) {
    if (configWithSameNameIndex >= 0) {
      launchConfig[configWithSameNameIndex] = config;
    } else {
      launchConfig.push(config);
    }
    // if not update the launchJSON
    return new Promise((resolve) => {
      launchFile.update('configurations', launchConfig).then(() => {
        resolve();
      });
    });
  }
  return new Promise((resolve) => { resolve(); });
}

/**
   *
   * @param workspacePathUri Path to the active workspace
   */
export function updateTasks(workspacePathUri: Uri): Promise<void> {
  const taskFile = workspace.getConfiguration('tasks', workspacePathUri);
  const tasksConfig: object[] = taskFile.get('tasks', []);
  let hasBuildConfig = false;
  let hasCleanBuildConfig = false;
  let hasFlashConfig = false;
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
    });
  }

  if (!hasBuildConfig) {
    tasksConfig.push(buildTasks.buildTask);
  }
  if (!hasCleanBuildConfig) {
    tasksConfig.push(buildTasks.cleanBuild);
  }
  if (!hasFlashConfig) {
    tasksConfig.push(buildTasks.flashTask);
  }
  if (!hasFlashConfig || !hasCleanBuildConfig || !hasBuildConfig) {
    return new Promise((resolve) => {
      taskFile.update('tasks', tasksConfig).then(() => {
        resolve();
      });
    });
  }
  return new Promise((resolve) => { resolve(); });
}


export default async function updateConfiguration(
  workspaceRoot: Uri, info: MakeInfo): Promise<void> {
  const tasks: Promise<void>[] = [];

  tasks.push(updateLaunch(workspaceRoot, info));
  tasks.push(updateTasks(workspaceRoot));
  tasks.push(updateCProperties(workspaceRoot, info));
  return new Promise((resolve) => {
    Promise.all(tasks).then(() => {
      resolve();
    });
  });

}
