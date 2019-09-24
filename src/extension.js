// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import vscode from 'vscode';
import buildSTM from './BuildTask';

// // this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
export function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log('Congratulations, your extension "stm32-for-vscode" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const buildCmd = vscode.commands.registerCommand('stm32-for-vscode.build', async () => new Promise(async (resolve, reject) => {
    try {
      await buildSTM();
      resolve();
    } catch (err) {
      reject(err);
    }
  }));
  const flashCmd = vscode.commands.registerCommand('stm32-for-vscode.flash', async () => new Promise(async (resolve, reject) => {
    try {
      await buildSTM({ flash: true });
      resolve();
    } catch (err) {
      reject(err);
    }
  }));
  const cleanBuildCmd = vscode.commands.registerCommand('stm32-for-vscode.cleanBuild', async () => new Promise(async (resolve, reject) => {
    try {
      await buildSTM({ cleanBuild: true });
      resolve();
    } catch (err) {
      reject(err);
    }
  }));
  context.subscriptions.push(buildCmd);
  context.subscriptions.push(flashCmd);
  context.subscriptions.push(cleanBuildCmd);
}

// this method is called when your extension is deactivated
export function deactivate() { }
