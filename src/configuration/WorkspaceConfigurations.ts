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

import { DebugConfiguration, TaskDefinition, Uri, workspace } from 'vscode';

import MakeInfo from '../types/MakeInfo';
import buildTasks from './BuildTasksConfig';
import getLaunchTask from './LaunchTasksConfig';
import updateCProperties from './CCCPConfig';
import setCortexDebugWorkspaceConfiguration from './cortexDebugConfig';


/**
 * Function for updating the launch.json file to include debugging information.
 * @param workspacePathUri Path to the active workspace
 * @param info info gained from the makefile.
 */
export async function updateLaunch(
  workspacePathUri: Uri, info: MakeInfo): Promise<void> {
  const launchFile = workspace.getConfiguration('launch', workspacePathUri);
  const launchConfig: TaskDefinition[] = launchFile.get('configurations', []);
  const config = getLaunchTask(info);
  let configWithSameNameIndex = -1;
  if (launchConfig && !_.isEmpty(launchConfig)) {
    _.map(launchConfig, (entry: DebugConfiguration, index) => {
      if (entry.name === config.name) {
        configWithSameNameIndex = index;
      }
    });
  }
  // only change the launch configuration when none is present
  if (configWithSameNameIndex < 0) {
    launchConfig.push(config);
    await launchFile.update('configurations', launchConfig);
  }
}


/**
   *
   * @param workspacePathUri Path to the active workspace
   */
export function updateTasks(workspacePathUri: Uri): Promise<void> {
  const taskFile = workspace.getConfiguration('tasks', workspacePathUri);
  const tasksConfig: TaskDefinition[] = taskFile.get('tasks', []);
  let hasBuildConfig = false;
  let hasCleanBuildConfig = false;
  let hasFlashConfig = false;
  if (tasksConfig && !_.isEmpty(tasksConfig)) {
    _.map(tasksConfig, (entry) => {
      if (_.isEqual(buildTasks.buildTask.label, entry.label)) {
        hasBuildConfig = true;
      }
      if (_.isEqual(buildTasks.cleanBuild.label, entry.label)) {
        hasCleanBuildConfig = true;
      }
      if (_.isEqual(buildTasks.flashTask.label, entry.label)) {
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
  setCortexDebugWorkspaceConfiguration(info);
  return new Promise((resolve) => {
    Promise.all(tasks).then(() => {
      resolve();
    });
  });

}
