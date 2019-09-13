"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = updateMakefile;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _vscode = _interopRequireDefault(require("vscode"));

var _CreateMakefile = _interopRequireDefault(require("./CreateMakefile"));

var _Definitions = require("./Definitions");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function getCurrentMakefile(_x) {
  return _getCurrentMakefile.apply(this, arguments);
}

function _getCurrentMakefile() {
  _getCurrentMakefile = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(makefilePath) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              _fs["default"].readFile(makefilePath, {
                encoding: 'utf8'
              }, function (err, currentMakefile) {
                if (err) {
                  reject(err);
                  return;
                }

                resolve(currentMakefile);
              });
            }));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _getCurrentMakefile.apply(this, arguments);
}

function writeMakefile(_x2, _x3) {
  return _writeMakefile.apply(this, arguments);
}
/**
 * @description creates a new makefile based on the current info and checks if it
 * should update the old makefile.
 * @param {string} workspaceLocation location of the current workspace
 * @param {object} info object containing the information neccessary for compilation
 */


function _writeMakefile() {
  _writeMakefile = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(makefilePath, makefile) {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt("return", new Promise(function (resolve, reject) {
              _fs["default"].writeFile(makefilePath, makefile, {
                encoding: 'utf8'
              }, function (err) {
                if (err) {
                  _vscode["default"].window.showErrorMessage('Something went wrong with writing to the new makefile', err);

                  reject(err);
                  return;
                }

                resolve();
              });
            }));

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _writeMakefile.apply(this, arguments);
}

function updateMakefile(_x4, _x5) {
  return _updateMakefile.apply(this, arguments);
}

function _updateMakefile() {
  _updateMakefile = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4(workspaceLocation, info) {
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            return _context4.abrupt("return", new Promise(
            /*#__PURE__*/
            function () {
              var _ref = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee3(resolve, reject) {
                var makefilePath, oldMakefile, newMakefile;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        makefilePath = _path["default"].resolve(workspaceLocation, _Definitions.makefileName);
                        _context3.prev = 1;
                        _context3.next = 4;
                        return getCurrentMakefile(makefilePath);

                      case 4:
                        oldMakefile = _context3.sent;
                        _context3.next = 10;
                        break;

                      case 7:
                        _context3.prev = 7;
                        _context3.t0 = _context3["catch"](1);
                        oldMakefile = null;

                      case 10:
                        newMakefile = (0, _CreateMakefile["default"])(info);

                        if (!(newMakefile !== oldMakefile)) {
                          _context3.next = 23;
                          break;
                        }

                        _context3.prev = 12;
                        _context3.next = 15;
                        return writeMakefile(makefilePath, newMakefile);

                      case 15:
                        _context3.next = 22;
                        break;

                      case 17:
                        _context3.prev = 17;
                        _context3.t1 = _context3["catch"](12);

                        _vscode["default"].window.showErrorMessage('Something went wrong with creating the new makefile', _context3.t1);

                        reject(_context3.t1);
                        return _context3.abrupt("return");

                      case 22:
                        resolve(newMakefile);

                      case 23:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3, null, [[1, 7], [12, 17]]);
              }));

              return function (_x6, _x7) {
                return _ref.apply(this, arguments);
              };
            }()));

          case 1:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _updateMakefile.apply(this, arguments);
}