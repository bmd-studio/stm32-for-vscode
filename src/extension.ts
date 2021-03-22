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
 * The above copyright notice and this permission notice shall be included in all
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
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below

import * as OpenOCDConfig from './configuration/openOCDConfig';
import * as STM32Config from './configuration/stm32Config';
import * as vscode from 'vscode';

import addCommandMenu from './menu';
import CommandMenu from './menu/CommandMenu';
import buildSTM from './BuildTask';
import { checkBuildTools } from './buildTools';
import { configurationFixture } from './test/fixtures/extensionConfigurationFixture';
import { installAllTools } from './buildTools/installTools';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
  // This line of code will only be executed once when your extension is
  // activated
  let commandMenu: CommandMenu | undefined = undefined;

  console.log('STM32 for vscode has started');
  checkBuildTools(context).then((hasBuildTools) => {
    if (hasBuildTools) {
      // should continue with 
    }
    commandMenu = addCommandMenu(context);
    vscode.commands.executeCommand('setContext', 'stm32ForVSCodeReady', true);
  });
  const setProgrammerCommand = vscode.commands.registerCommand('stm32-for-vscode.setProgrammer', (programmer?: string) => {
    OpenOCDConfig.changeProgrammerDialogue(programmer);
  });
  const openSettingsCommand = vscode.commands.registerCommand('stm32-for-vscode.openSettings', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', `@ext:bmd.stm32-for-vscode`);
  });
  const openExtension = vscode.commands.registerCommand('stm32-for-vscode.openExtension', () => {
    console.log('opening extension');
  });
  const installBuildTools = vscode.commands.registerCommand('stm32-for-vscode.installBuildTools', async () => {
    try {
      console.log('STARTING TOOL INSTALL');
      await installAllTools(context);
      console.log('Tools installed');
      const hasBuildTools = await checkBuildTools(context);
      console.log('has build tools', hasBuildTools, commandMenu);
      if (hasBuildTools) {
        console.log('refreshing commandMenu');
        commandMenu.refresh();
      }

    } catch (error) {
      vscode.window.showErrorMessage(`Something went wrong with installing the build tools. Error:${error}`);
    }
  });

  const buildToolsCommand = vscode.commands.registerCommand("stm32-for-vscode.checkBuildTools", () => {
    const hasBuildTools = checkBuildTools(context);

    // TODO: make this link back to the vscode commands panel.
  });
  const buildCmd = vscode.commands.registerCommand(
    'stm32-for-vscode.build',
    async () => new Promise(async () => {
      try {
        await buildSTM({});
      } catch (err) {
        throw err;
      }
    }),
  );
  // const flashCmd = vscode.commands.registerCommand(
  //   'stm32-for-vscode.flash',
  //   async () => new Promise(async (resolve, reject) => {
  //     try {
  //       await buildSTM({
  //         flash: true,
  //       });
  //       resolve();
  //     } catch (err) {
  //       reject(err);
  //     }
  //   }),
  // );
  // const cleanBuildCmd = vscode.commands.registerCommand(
  //   'stm32-for-vscode.cleanBuild',
  //   async (args, moreARgs) => new Promise(async (resolve, reject) => {
  //     console.log('args', args, moreARgs);
  //     try {
  //       await buildSTM({
  //         cleanBuild: true,
  //       });
  //       resolve();
  //     } catch (err) {
  //       reject(err);
  //     }
  //   }),
  // );
  // const buildTest = vscode.commands.registerCommand(
  //   'stm32-for-vscode.buildTest',
  //   async () => new Promise(async (resolve, reject) => {
  //     try {
  //       if (!vscode.workspace.workspaceFolders) { throw Error('no workspace folder is open'); }
  //       await setupTestFiles(vscode.workspace.workspaceFolders[0].uri);
  //       resolve();
  //     } catch (err) {
  //       reject(err);
  //     }
  //   }),
  // );
  // context.subscriptions.push(buildCmd);
  // context.subscriptions.push(flashCmd);
  // context.subscriptions.push(cleanBuildCmd);
  // context.subscriptions.push(buildTest);
}

// // this method is called when your extension is deactivated
// export function deactivate(): void { }
