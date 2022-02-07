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
import * as _ from 'lodash';

import { DebugConfiguration, TaskDefinition, Uri, workspace, WorkspaceConfiguration } from 'vscode';

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



interface TaskConfigCheck {
  hasBuildConfig: boolean;
  hasCleanBuildConfig: boolean;
  hasFlashConfig: boolean;
}
/**
 * Checks if the required STM32 for VSCode build,flash and build clean tasks are present.
 * @param tasksConfig task definition from vscode.
 * @returns 
 */
function checkTasksForRequiredTasks(tasksConfig: TaskDefinition[]): TaskConfigCheck {
  let taskConfigurationResult: TaskConfigCheck = {
    hasBuildConfig: false,
    hasCleanBuildConfig: false,
    hasFlashConfig: false
  };
  tasksConfig.forEach(entry => {
    if (_.isEqual(buildTasks.buildTask.label, entry.label)) {
      taskConfigurationResult.hasBuildConfig = true;
    }
    if (_.isEqual(buildTasks.cleanBuild.label, entry.label)) {
      taskConfigurationResult.hasCleanBuildConfig = true;
    }
    if (_.isEqual(buildTasks.flashTask.label, entry.label)) {
      taskConfigurationResult.hasFlashConfig = true;
    }
  });
  return taskConfigurationResult;
}

/**
 * Adds required STM32 for VSCode tasks to a TaskDefinition array when they are missing.
 * @param tasksConfig tasks configuration in the current workspace
 * @param taskConfigurationCheck The object containing the checks for all required check by STM32 for VSCode.
 * @returns 
 */
function addTasksWhenMissing(tasksConfig: TaskDefinition[], taskConfigurationCheck: TaskConfigCheck): TaskDefinition[] {
  if (!taskConfigurationCheck.hasBuildConfig) {
    tasksConfig.push(buildTasks.buildTask);
  }
  if (!taskConfigurationCheck.hasCleanBuildConfig) {
    tasksConfig.push(buildTasks.cleanBuild);
  }
  if (!taskConfigurationCheck.hasFlashConfig) {
    tasksConfig.push(buildTasks.flashTask);
  }
  return tasksConfig;
}

/**
 * Updates the workspace tasks when one of the required tasks are missing.
 * @param taskFile Workspace tasks file
 * @param tasksConfig The taskConfiguration that possibly contains updates
 * @param taskConfigurationCheck The check for the taskConfiguration.
 *  With this it is checked if an update needs to be performed.
 */
async function updateTasksWhenTasksWhereMissing(
  taskFile: WorkspaceConfiguration,
  tasksConfig: TaskDefinition[],
  taskConfigurationCheck: TaskConfigCheck
): Promise<void> {
  let shouldUpdate = false;
  let taskConfigurationKeys = Object.keys(taskConfigurationCheck) as (keyof TaskConfigCheck)[];
  taskConfigurationKeys.forEach(key => {
    if (!taskConfigurationCheck[key]) {
      shouldUpdate = true;
    }
  });
  if (shouldUpdate) {
    await taskFile.update('tasks', tasksConfig);
  }

}

/**
 * Updates the workspace tasks when the required tasks are not present.
 * @param workspacePathUri Path to the active workspace
 */
export function updateTasks(workspacePathUri: Uri): Promise<void> {
  const taskFile = workspace.getConfiguration('tasks', workspacePathUri);
  const tasksConfig: TaskDefinition[] = taskFile.get('tasks', []);
  let hasTasks: TaskConfigCheck = {
    hasBuildConfig: false,
    hasCleanBuildConfig: false,
    hasFlashConfig: false
  };

  if (tasksConfig && !_.isEmpty(tasksConfig)) {
    hasTasks = checkTasksForRequiredTasks(tasksConfig);
  }

  const newTaskConfiguration = addTasksWhenMissing(tasksConfig, hasTasks);
  return updateTasksWhenTasksWhereMissing(taskFile, newTaskConfiguration, hasTasks);
}

/**
 * Updates the workspace configuration when required.
 * @param workspaceRoot The current workspace path
 * @param info Makeinfo which is used for setting the tasks.
 * @returns A void promise
 */
export default async function updateConfiguration(
  workspaceRoot: Uri, info: MakeInfo): Promise<void> {
  const tasks: Promise<void>[] = [];

  tasks.push(updateLaunch(workspaceRoot, info));
  tasks.push(updateTasks(workspaceRoot));
  tasks.push(updateCProperties(workspaceRoot, info));
  setCortexDebugWorkspaceConfiguration(info);
  await Promise.all(tasks);
}
