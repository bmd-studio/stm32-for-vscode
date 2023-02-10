import {
  ShellExecution,
  Task,
  TaskProcessEndEvent,
  tasks,
  workspace,
  ShellExecutionOptions,
  TaskScope,
  WorkspaceFolder,
} from 'vscode';
import { getAutomationShell } from './Helpers';

// NOTE: good reference for powershell: https://ss64.com/ps/syntax-esc.html
/**
 *
 * @param type type of process to execute e.g. build
 * @param name The name of the process to execute
 * @param cmd The command to execute within a shell.
 */
export default async function executeTask(
  type: string,
  name: string,
  cmd: string[],
  shellExecOptions: ShellExecutionOptions,
  problemMatcher?: string,
  taskScope?: TaskScope,
): Promise<void | number> {
  if (!workspace.workspaceFolders && taskScope !== TaskScope.Global) {
    throw Error('no workspace folder is selected');
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
  const taskExec = await tasks.executeTask(processTask);
  return new Promise((resolve, reject) => {

    tasks.onDidEndTask((e) => {
      if (e.execution.task.name === taskExec.task.name) {
        resolve();
      }
    });
    tasks.onDidEndTaskProcess((e) => {
      if (e.execution.task.name === taskExec.task.name) {
        if (e.exitCode === 0) {
          resolve(0);
        } else {
          reject();
        }
      }
    });
  });
}
