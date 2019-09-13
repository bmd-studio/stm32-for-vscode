"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.activate = activate;
exports.deactivate = deactivate;

var _vscode = _interopRequireDefault(require("vscode"));

var _Info = require("./Info");

var _UpdateMakefile = _interopRequireDefault(require("./UpdateMakefile"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

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
  // const initCmd = vscode.commands.registerCommand('stm32-for-vscode.init', async () => {
  //   // // console.log('vscode in init', vscode);
  //   // const armPath = checkForRequirements(vscode.window.showWarningMessage, vscode);
  //   // init(vscode.workspace.getWorkspaceFolder, armPath);
  //   // used for testing....
  //   const fileList = getFileList(vscode.workspace.workspaceFolders[0].uri.fsPath);
  //   // const makefileInfo = getMakefileInfo(vscode.workspace.workspaceFolders[0].uri.fsPath);
  // });
  var buildCmd = _vscode["default"].commands.registerCommand('stm32-for-vscode.build',
  /*#__PURE__*/
  _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2() {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt("return", new Promise(
            /*#__PURE__*/
            function () {
              var _ref2 = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee(resolve, reject) {
                var currentWorkspaceFolder, info;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.prev = 0;
                        currentWorkspaceFolder = _vscode["default"].workspace.workspaceFolders[0].uri.fsPath;
                        _context.next = 4;
                        return (0, _Info.getInfo)(currentWorkspaceFolder);

                      case 4:
                        info = _context.sent;
                        _context.next = 7;
                        return (0, _UpdateMakefile["default"])(currentWorkspaceFolder, info);

                      case 7:
                        _context.next = 13;
                        break;

                      case 9:
                        _context.prev = 9;
                        _context.t0 = _context["catch"](0);

                        _vscode["default"].window.showErrorMessage('Something went wrong during the build process', _context.t0);

                        reject(_context.t0);

                      case 13:
                        resolve();

                      case 14:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, null, [[0, 9]]);
              }));

              return function (_x, _x2) {
                return _ref2.apply(this, arguments);
              };
            }()));

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
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
  // context.subscriptions.push(initCmd);


  context.subscriptions.push(buildCmd); // context.subscriptions.push(buildCmd);
  // context.subscriptions.push(buildCleanCmd);
} // this method is called when your extension is deactivated


function deactivate() {}