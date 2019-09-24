"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.activate = activate;
exports.deactivate = deactivate;

var _vscode = _interopRequireDefault(require("vscode"));

var _util = require("util");

var _Info = require("./Info");

var _UpdateMakefile = _interopRequireDefault(require("./UpdateMakefile"));

var _Requirements = _interopRequireDefault(require("./Requirements"));

var _BuildTask = _interopRequireDefault(require("./BuildTask"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var extensionTerminal; // // this method is called when your extension is activated
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
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.prev = 0;
                        _context.next = 3;
                        return (0, _BuildTask["default"])();

                      case 3:
                        resolve();
                        _context.next = 9;
                        break;

                      case 6:
                        _context.prev = 6;
                        _context.t0 = _context["catch"](0);
                        reject(_context.t0);

                      case 9:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, null, [[0, 6]]);
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
  })));

  var flashCmd = _vscode["default"].commands.registerCommand('stm32-for-vscode.flash',
  /*#__PURE__*/
  _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4() {
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            return _context4.abrupt("return", new Promise(
            /*#__PURE__*/
            function () {
              var _ref4 = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee3(resolve, reject) {
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.prev = 0;
                        _context3.next = 3;
                        return (0, _BuildTask["default"])({
                          flash: true
                        });

                      case 3:
                        resolve();
                        _context3.next = 9;
                        break;

                      case 6:
                        _context3.prev = 6;
                        _context3.t0 = _context3["catch"](0);
                        reject(_context3.t0);

                      case 9:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3, null, [[0, 6]]);
              }));

              return function (_x3, _x4) {
                return _ref4.apply(this, arguments);
              };
            }()));

          case 1:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  })));

  var cleanBuildCmd = _vscode["default"].commands.registerCommand('stm32-for-vscode.cleanBuild',
  /*#__PURE__*/
  _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee6() {
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            return _context6.abrupt("return", new Promise(
            /*#__PURE__*/
            function () {
              var _ref6 = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee5(resolve, reject) {
                return regeneratorRuntime.wrap(function _callee5$(_context5) {
                  while (1) {
                    switch (_context5.prev = _context5.next) {
                      case 0:
                        _context5.prev = 0;
                        _context5.next = 3;
                        return (0, _BuildTask["default"])({
                          cleanBuild: true
                        });

                      case 3:
                        resolve();
                        _context5.next = 9;
                        break;

                      case 6:
                        _context5.prev = 6;
                        _context5.t0 = _context5["catch"](0);
                        reject(_context5.t0);

                      case 9:
                      case "end":
                        return _context5.stop();
                    }
                  }
                }, _callee5, null, [[0, 6]]);
              }));

              return function (_x5, _x6) {
                return _ref6.apply(this, arguments);
              };
            }()));

          case 1:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  })));

  context.subscriptions.push(buildCmd);
  context.subscriptions.push(flashCmd);
  context.subscriptions.push(cleanBuildCmd);
} // this method is called when your extension is deactivated


function deactivate() {}