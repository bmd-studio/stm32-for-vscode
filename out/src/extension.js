"use strict";

require("vscode");

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

//= require('vscode');
var _ = require('lodash');

var shell = require('shelljs'); // const {
//   init,
//   checkForRequirements,
// } = require('./init');
// const makeCmd = require('./makeCmd');
// const { getFileList } = require('./src/ListFiles');
// const { getMakefileInfo } = require('./src/MakefileInfo');
// // this method is called when your extension is activated
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
  var initCmd = vscode.commands.registerCommand('stm32-for-vscode.init',
  /*#__PURE__*/
  _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var makefileInfo;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // // console.log('vscode in init', vscode);
            // const armPath = checkForRequirements(vscode.window.showWarningMessage, vscode);
            // init(vscode.workspace.getWorkspaceFolder, armPath);
            // used for testing....
            // const fileList = getFileList(vscode.workspace.workspaceFolders[0].uri.fsPath);
            makefileInfo = getMakefileInfo(vscode.workspace.workspaceFolders[0].uri.fsPath);

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }))); //   const buildCmd = vscode.commands.registerCommand('stm32-for-vscode.build', () => {
  //     const armPath = checkForRequirements(vscode.window.showWarningMessage, vscode);
  //     // console.log('the root', vscode.env.appRoot);
  //     init(vscode.workspace.getWorkspaceFolder, armPath).then(() => {
  //       let terminal = vscode.window.activeTerminal;
  //       if (!terminal) {
  //         terminal = vscode.window.createTerminal();
  //       }
  //       const cmd = makeCmd(armPath);
  //       terminal.sendText(cmd);
  //     });
  //   });
  //   const buildCleanCmd = vscode.commands.registerCommand('stm32-for-vscode.cleanBuild', () => {
  //     const armPath = checkForRequirements(vscode.window.showWarningMessage, vscode);
  //     let terminal = vscode.window.activeTerminal;
  //     if (!terminal) {
  //       terminal = vscode.window.createTerminal();
  //     }
  //     const cleanCmd = makeCmd(armPath);
  //     terminal.sendText(`${cleanCmd} clean`);
  //     init(vscode.workspace.getWorkspaceFolder, armPath).then(() => {
  //       terminal = vscode.window.activeTerminal;
  //       if (!terminal) {
  //         terminal = vscode.window.createTerminal();
  //       }
  //       const cmd = makeCmd(armPath);
  //       terminal.sendText(cmd);
  //     });
  //   });

  context.subscriptions.push(initCmd); // context.subscriptions.push(buildCmd);
  // context.subscriptions.push(buildCleanCmd);
}

exports.activate = activate; // this method is called when your extension is deactivated

function deactivate() {}

module.exports = {
  activate: activate,
  deactivate: deactivate
};