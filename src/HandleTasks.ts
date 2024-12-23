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
    const powershellIsAutomationShell =automationShell.toLowerCase().includes('pwsh') || automationShell.toLowerCase().includes('powershell');
    const shellSpecificToolPath = powershellIsAutomationShell ? `& '${cmd[0]}'` : `"${cmd[0]}"`;
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
