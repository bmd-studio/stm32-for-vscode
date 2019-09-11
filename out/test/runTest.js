"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var path = require('path');

var _require = require('vscode-test'),
    runTests = _require.runTests;

function main() {
  return _main.apply(this, arguments);
}

function _main() {
  _main = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    var extensionDevelopmentPath, extensionTestsPath;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            // The folder containing the Extension Manifest package.json
            // Passed to `--extensionDevelopmentPath`
            extensionDevelopmentPath = path.resolve(__dirname, '../../'); // The path to the extension test script
            // Passed to --extensionTestsPath

            extensionTestsPath = path.resolve(__dirname, './suite/index'); // Download VS Code, unzip it and run the integration test

            _context.next = 5;
            return runTests({
              extensionDevelopmentPath: extensionDevelopmentPath,
              extensionTestsPath: extensionTestsPath,
              launchArgs: ['--disable-extensions']
            });

          case 5:
            _context.next = 11;
            break;

          case 7:
            _context.prev = 7;
            _context.t0 = _context["catch"](0);
            console.error('Failed to run tests');
            process.exit(1);

          case 11:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[0, 7]]);
  }));
  return _main.apply(this, arguments);
}

main();