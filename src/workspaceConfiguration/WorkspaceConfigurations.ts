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
import { Uri, workspace, } from 'vscode';
import MakeInfo from '../types/MakeInfo';

// import getOpenOCDTarget from './OpenOcdTargetFiles';
import getLaunchTask from './LaunchTasksConfig';
import buildTasks from './BuildTasksConfig';
import updateCProperties from './CCCPConfig';

/**
 * Function for updating the launch.json file to include debugging information.
 * @param workspacePathUri Path to the active workspace
 * @param info info gained from the makefile.
 */
export function updateLaunch(
  workspacePathUri: Uri, info: MakeInfo): void {
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
export function updateTasks(workspacePathUri: Uri): void {
  const taskFile = workspace.getConfiguration('tasks', workspacePathUri);
  const tasksConfig: object[] = taskFile.get('tasks') || [];
  // console.log('taskFile');
  // console.log(JSON.stringify(taskFile));
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
    console.log('updating task');
    taskFile.update('tasks', tasksConfig);
  }
}


export default async function updateConfiguration(
  workspaceRoot: Uri, info: any) {
  updateLaunch(workspaceRoot, info);
  updateTasks(workspaceRoot);
  updateCProperties(workspaceRoot, info);
};
