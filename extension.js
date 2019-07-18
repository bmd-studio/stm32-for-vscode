// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const _ = require('lodash');
const { init, checkForRequirements } = require('./init');
const shell = require('shelljs');
const makeCmd = require('./makeCmd');
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  // console.log('Congratulations, your extension "stm32-for-vscode" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const initCmd = vscode.commands.registerCommand('extension.init', () => {
    console.log('vscode in init', vscode);
    const armPath = checkForRequirements(vscode.window.showWarningMessage, vscode);
    init(vscode.workspace.rootPath, armPath);
  });
  const buildCmd = vscode.commands.registerCommand('extension.build', () => {
    const armPath = checkForRequirements(vscode.window.showWarningMessage, vscode);
    init(vscode.workspace.rootPath, armPath).then(() => {
      let terminal = vscode.window.activeTerminal;
      if (!terminal) {
        terminal = vscode.window.createTerminal();
      }
      const cmd = makeCmd(armPath);
      terminal.sendText(cmd);
    });
  });
  context.subscriptions.push(initCmd);
  context.subscriptions.push(buildCmd);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}


module.exports = {
  activate,
  deactivate,
};
