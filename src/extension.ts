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

import * as vscode from 'vscode';

import buildSTM from './BuildTask';
import setupTestFiles from './testing/SetupTestFiles';

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
  const buildCmd = vscode.commands.registerCommand(
    'stm32-for-vscode.build',
    async () => new Promise(async (resolve, reject) => {
      try {
        await buildSTM({});
        resolve();
      } catch (err) {
        reject(err);
      }
    }),
  );
  const flashCmd = vscode.commands.registerCommand(
    'stm32-for-vscode.flash',
    async () => new Promise(async (resolve, reject) => {
      try {
        await buildSTM({
          flash: true,
        });
        resolve();
      } catch (err) {
        reject(err);
      }
    }),
  );
  const cleanBuildCmd = vscode.commands.registerCommand(
    'stm32-for-vscode.cleanBuild',
    async () => new Promise(async (resolve, reject) => {
      try {
        await buildSTM({
          cleanBuild: true,
        });
        resolve();
      } catch (err) {
        reject(err);
      }
    }),
  );
  const buildTest = vscode.commands.registerCommand(
    'stm32-for-vscode.buildTest',
    async () => new Promise(async (resolve, reject) => {
      try {
        if (!vscode.workspace.workspaceFolders) { throw Error('no workspace folder is open'); }
        await setupTestFiles(vscode.workspace.workspaceFolders[0].uri);
        resolve();
      } catch (err) {
        reject(err);
      }
    }),
  );
  context.subscriptions.push(buildCmd);
  context.subscriptions.push(flashCmd);
  context.subscriptions.push(cleanBuildCmd);
  context.subscriptions.push(buildTest);
}

// // this method is called when your extension is deactivated
// export function deactivate(): void { }
