import {
  ShellExecution,
  Task,
  TaskProcessEndEvent,
  tasks,
  workspace,
  ShellExecutionOptions,
  TaskScope,
  WorkspaceFolder,
  ProcessExecution,
} from 'vscode';
import { getAutomationShell } from './Helpers';
import { BUILD_TASK_NAME } from './configuration/BuildTasksConfig';
import { getBuildToolsFromSettings } from './buildTools';
import { makefileName } from './Definitions';
import { type } from 'os';

// NOTE: good reference for powershell: https://ss64.com/ps/syntax-esc.html
/**
 *
 * @param type type of process to execute e.g. build
 * @param name The name of the process to execute
 * @param cmd The command to execute within a shell.
 */
export default function executeTask(
  type: string,
  name: string,
  cmd: string[],
  shellExecOptions: ShellExecutionOptions,
  problemMatcher?: string,
  taskScope?: TaskScope,
): Promise<void | number> {
  return new Promise((resolve, reject) => {
    if (!workspace.workspaceFolders && taskScope !== TaskScope.Global) {
      reject(Error('no workspace folder is selected'));
      return;
    }
    let currentTaskScope: TaskScope | WorkspaceFolder = TaskScope.Workspace;
    if (taskScope) {
      currentTaskScope = taskScope;
    } else {
      if (workspace?.workspaceFolders?.[0]) {
        currentTaskScope = workspace.workspaceFolders[0];
      }

    }
    const automationShell = getAutomationShell();
    const shellSpecificToolPath = automationShell.includes('powershell') ? `& '${cmd[0]}'` : `"${cmd[0]}"`;
    cmd.shift();
    const options = cmd.reduce((accumulator, option) => `${accumulator} ${option}`, '');
    let totalPath = `${shellSpecificToolPath}${options}`;
    const processExec = new ShellExecution(totalPath, shellExecOptions);
    const processTask = new Task(
      { type },
      currentTaskScope,
      name, 'STM32 for VSCode',
      processExec,
      problemMatcher
    );
    tasks.executeTask(processTask);
    tasks.onDidEndTaskProcess((e: TaskProcessEndEvent) => {
      if (e.execution.task.name === name) {
        if (e.exitCode === 0) {
          resolve();
          return;
        }
        reject(e.exitCode);
      }
    });
  });
}


const DEFAULT_BUILD_STRING = `-f ${makefileName} -j16`;
function getSTMBuildTask(): Task {
  // TODO: add extra makefile flags options to this.
  let currentTaskScope = TaskScope.Workspace;
  const tooling = getBuildToolsFromSettings();
  const automationShell = getAutomationShell();
  const shellSpecificToolPath = automationShell.includes('powershell') ? `& '${tooling.makePath}'` : `"${tooling.makePath}"`;
  let totalPath = `${shellSpecificToolPath} ${DEFAULT_BUILD_STRING}`;
  const shellExec = new ShellExecution(totalPath, {});
  return new Task(
    {
      type: BUILD_TASK_NAME,
    },
    currentTaskScope,
    'build',
    BUILD_TASK_NAME,
    shellExec
  );
}

// implement tasks as described in the following doucmentation: https://code.visualstudio.com/api/extension-guides/task-provider
// should have a taskproder with providetask and resolvetask
const buildTaskProvider = tasks.registerTaskProvider(BUILD_TASK_NAME, {
  provideTasks: () => {
    return [
      getSTMBuildTask(),
    ];
  },
  resolveTask(task): Task | undefined {
    if (task.name === BUILD_TASK_NAME) {
      return getSTMBuildTask();
    }
    return undefined;
  },
}
);