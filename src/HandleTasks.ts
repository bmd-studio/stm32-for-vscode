import 'process';

import {
  ShellExecution,
  Task,
  TaskProcessEndEvent,
  tasks,
  workspace,
  ShellExecutionOptions,
} from 'vscode';
import { getAutomationShell } from './Helpers';

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
  problemMatcher?: string
): Promise<void | number> {
  return new Promise((resolve, reject) => {
    if (!workspace.workspaceFolders) {
      reject(Error('no workspace folder is selected'));
      return;
    }
    const automationShell = getAutomationShell();
    const shellSpecificToolPath = automationShell.includes('powershell') ? `& \\"${cmd[0]}\\"` : `"${cmd[0]}"`;
    cmd.shift();
    const options = cmd.reduce((accumulator, option) => `${accumulator} ${option}`, '');
    const totalPath = `${shellSpecificToolPath}${options}`;
    const processExec = new ShellExecution(totalPath, shellExecOptions);

    const processTask = new Task(
      { type },
      workspace.workspaceFolders[0],
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
