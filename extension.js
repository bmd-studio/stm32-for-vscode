// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const _ = require('lodash');
const {init} = require('./init');
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
	// init().then((output) => {
	// 	console.log('init output', output);
	// });
	const disposable = vscode.commands.registerCommand('extension.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		console.log('dicks');
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World!');
	}),
	 initCmd = vscode.commands.registerCommand('extension.init', () => {
		// init();
		console.log('dicks1');
		init();

	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(initCmd);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}


module.exports = {
	activate,
	deactivate
}