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

import * as curl from 'curl';
import * as proc from 'process';
import * as vscode from 'vscode';

import buildSTM from './BuildTask';
import { checkBuildTools } from './buildTools';
import { exec } from 'child_process';
import { installOpenOcd } from './buildTools/installTools';
import setupTestFiles from './testing/SetupTestFiles';
import {getLatestNodeLink, downloadLatestNode, extractFile, getNode} from './buildTools/installTools';

// // this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
export function activate(context: vscode.ExtensionContext): void {
  // This line of code will only be executed once when your extension is
  // activated

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  console.log('STM32 for vscode has started');
  console.log('version', process.version);
  console.log('release', process.release);
  console.log('arch', process.arch);
  checkBuildTools(context);
  const openSettingsCommand = vscode.commands.registerCommand('stm32-for-vscode.openSettings', () => {
    vscode.commands.executeCommand('workbench.action.openSettings', `@ext:bmd.stm32-for-vscode`);
  });
  const installBuildTools = vscode.commands.registerCommand('stm32-for-vscode.installBuildTools', () => {

    getNode(context).then((nodeFileName) => {
      console.log('doanloading and extracting node was successfull, installation can be found at:', nodeFileName);
    }).catch((err) => {
      console.error('something went wrong with getting and installing latest nodeversion', err);
    });

    // console.log('getting nodejs latest');
    // getLatestNodeLink(context).then((latest) => {
    //   console.log(`latest node link ${latest}`);
    //   downloadLatestNode(context, latest).then((nodeDownloadPath) => {
    //     console.log('downloaded node to', nodeDownloadPath);
    //     console.log('extracting file');
    //     extractFile(context, nodeDownloadPath).then((fileName) => {
    //       console.log('extracted successfully to:', fileName);
    //     }).catch((err) => {
    //       console.error('something went wrong when extracting the file', err);
    //     });
    //   }). catch((err) => {  
    //     console.error(err);
    //   });

    // }).catch((err) => {
    //   console.log('error getting node link', err);
    // });
    // try {
    //   const curlGET = curl.get('https://nodejs.org/dist/latest/', {}, (err: any, response: any, body: any) => {
    //     console.log(err)
    //     console.log('body');
    //     console.log(body);
    //     console.log(response);
    //   });
    //   console.log(curlGET);
    // } catch (error) {
    //   console.log('get error', error);
    // }
    // installOpenOcd(context);
  });

  const buildToolsCommand = vscode.commands.registerCommand("stm32-for-vscode.checkBuildTools", () => {
    const hasBuildTools = checkBuildTools(context);

    // TODO: make this link back to the vscode commands panel.
  });
  // const buildCmd = vscode.commands.registerCommand(
  //   'stm32-for-vscode.build',
  //   async () => new Promise(async (resolve, reject) => {
  //     try {
  //       await buildSTM({});
  //       resolve();
  //     } catch (err) {
  //       reject(err);
  //     }
  //   }),
  // );
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
