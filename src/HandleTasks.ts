import 'process';

import { ShellExecution, Task, TaskProcessEndEvent, tasks, workspace, ShellExecutionOptions } from 'vscode';
const { platform } = process;
/**
 *
 * @param type type of process to execute e.g. build
 * @param name The name of the process to execute
 * @param cmd The command to execute within a shell.
 */
export default function executeTask(
  type: string, name: string, cmd: string, cwd?: string): Promise<void | number> {
  return new Promise((resolve, reject) => {
    const shellOptions: ShellExecutionOptions = {};
    if (platform === 'win32') {
      shellOptions.shellArgs = [
        'cmd',
        '/c'
      ];
      shellOptions.executable = 'cmd';
    }
    if (cwd) {
      shellOptions.cwd = cwd;
    }
    const processExec = new ShellExecution(cmd, shellOptions);
    if (!workspace.workspaceFolders) {
      reject(Error('no workspace folder is selected'));
      return;
    }

    const processTask = new Task(
      { type },
      workspace.workspaceFolders[0],
      name, 'STM32 for VSCode',
      processExec
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
