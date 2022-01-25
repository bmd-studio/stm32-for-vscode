import * as vscode from 'vscode';

import { suite, test } from 'mocha';

import { waitForWorkspaceFoldersChange } from '../helpers';

// import { installAllTools } from '../../buildTools/installTools';

suite('build tools test', () => {
  test('install build tools', async () => {
    // should await the workspace, so STM32 for vscode is activated.
    if (!vscode.workspace.workspaceFolders || !vscode.workspace.workspaceFolders?.[0]) {
      await waitForWorkspaceFoldersChange(2000);
      // wait for the folder to be loaded
    }

    // // const processExec = new vscode.CustomExecution(totalPath, shellExecOptions);
    // const processExec = new vscode.ProcessExecution("${command:stm32-for-vscode.installBuildTools}");
    // const processTask = new vscode.Task(
    //   { type: 'process' },
    //   vscode.TaskScope.Workspace,
    //   'install build tools', 'STM32 for VSCode',
    //   processExec
    // );
    // try {
    //   const taskResult = await vscode.tasks.executeTask(processTask);
    //   console.log({ taskResult });
    // } catch (error) {
    //   console.error('could not finish execute task', error);
    //   throw error;
    // }

    const bmdExtension = vscode.extensions.getExtension('bmd.stm32-for-vscode');
    const bmdExtensionExports = bmdExtension?.exports;
    console.log("LOOOOK AT MEEEEE");
    console.log({ bmdExtension, bmdExtensionExports });
    console.log(`${bmdExtensionExports}`);
    console.log(vscode.extensions.getExtension('bmd.stm32-for-vscode'));
    console.log("LOOOK AT ME V2");
    try {
      await bmdExtensionExports.installTools();
      // await installAllTools()
    } catch (error) {
      throw error;
    }
  }).timeout(10 * 60 * 1000);
});