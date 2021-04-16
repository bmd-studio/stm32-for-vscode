import 'process';

import { 
  ShellExecution,
  Task,
  TaskProcessEndEvent, 
  tasks, 
  workspace, 
  ShellExecutionOptions, 
  env
} from 'vscode';
const { platform } = process;

function getAutomationShell(): string {
  let automationShell = env.shell;
  const shellSettings = workspace.getConfiguration('terminal.integrated.automationShell');
  switch(platform) {
    case 'win32': {
      const winShellSetting = shellSettings.get('windows');
      if(winShellSetting && typeof winShellSetting === 'string' && winShellSetting.length > 0 ) {
        automationShell = winShellSetting;
      }
    } break;
    case 'darwin': {
      const osxShellSetting = shellSettings.get('osx');
      if(osxShellSetting && typeof osxShellSetting === 'string' && osxShellSetting.length > 0 ) {
        automationShell = osxShellSetting;
      }
    } break;
    default: {
      // assume the rest is a version of linux
      const linuxShellSetting = shellSettings.get('linux');
      if(linuxShellSetting && typeof linuxShellSetting === 'string' && linuxShellSetting.length > 0 ) {
        automationShell = linuxShellSetting;
      }
    }
  }
  return automationShell;
}

/**
 *
 * @param type type of process to execute e.g. build
 * @param name The name of the process to execute
 * @param cmd The command to execute within a shell.
 */
export default function executeTask(
  type: string, name: string, cmd: string[], cwd?: string): Promise<void | number> {
  return new Promise((resolve, reject) => {
    if (!workspace.workspaceFolders) {
      reject(Error('no workspace folder is selected'));
      return;
    }
    const automationShell = getAutomationShell();

    const shellOptions: ShellExecutionOptions = {};
    if(cwd) {
      shellOptions.cwd;
    }
    const shellSpecificToolPath = automationShell.includes('powershell') ? `& \\"${cmd[0]}\\"` : `"${cmd[0]}"`;
    cmd.shift();
    const options = cmd.reduce((accumulator, option) => `${accumulator} ${option}`, '');
    const totalPath = `${shellSpecificToolPath}${options}`;
    const processExec = new ShellExecution(totalPath, shellOptions);

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
