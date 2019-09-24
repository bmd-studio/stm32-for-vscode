"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getDirCaseFree = getDirCaseFree;
exports.checkForRequiredFiles = checkForRequiredFiles;
exports.trySearchforFiles = trySearchforFiles;
exports.sortFiles = sortFiles;
exports.getIncludes = getIncludes;
exports["default"] = getFileList;
exports.fileList = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _fs = _interopRequireDefault(require("fs"));

var _recursiveReaddir = _interopRequireDefault(require("recursive-readdir"));

var _vscode = _interopRequireDefault(require("vscode"));

var _path = _interopRequireDefault(require("path"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/* When a standard project is initialised  this is the file structure:
 |-${projectName}.ioc
 |-Drivers
 |-Inc
 |-Middlewares (optional)
 |-Makefile
 |-Src
 |-startup_${target}xx
 |-${TARGETCHIP}x_FLASH.ld
 */
var fileList = {
  includeDirectories: [],
  cFiles: [],
  cxxFiles: [],
  headerFiles: [],
  asmFiles: [],
  testFiles: {
    cFiles: [],
    cxxFiles: [],
    headerFiles: [],
    asmFiles: [],
    includeDirectories: []
  }
};
/**
 * @description gets dir ignoring upper or lower case
 */

exports.fileList = fileList;

function getDirCaseFree(dirName, directories) {
  var lowerDirName = _lodash["default"].toLower(dirName);

  var index = _lodash["default"].findIndex(directories, function (o) {
    return _lodash["default"].toLower(o) === lowerDirName;
  });

  if (index === -1) return null;
  return directories[index];
}
/**
 * @description Checks if the Makefile, Src, Inc and Drivers directories/files are present.
 * @param {string[] | ArrayLike<string>} directoryFiles
 */


function checkForRequiredFiles(directoryFiles) {
  // required files/directories are: makefile, Src, Inc and Drivers
  var check = true;

  if (_lodash["default"].indexOf(directoryFiles, 'Makefile') === -1) {
    // should show warning
    _vscode["default"].window.showWarningMessage('No Makefile is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');

    check = false;
  }

  if (!getDirCaseFree('Src', directoryFiles)) {
    _vscode["default"].window.showWarningMessage('No Src directory is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');

    check = false;
  }

  if (!getDirCaseFree('Inc', directoryFiles)) {
    _vscode["default"].window.showWarningMessage('No Inc directory is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');

    check = false;
  }

  if (!getDirCaseFree('Drivers', directoryFiles)) {
    _vscode["default"].window.showWarningMessage('No Drivers directory is present, please initialize your project using CubeMX, and under Code Generator make sure that the "Copy all user libraries into the project folder" option is selected.');

    check = false;
  }

  return check;
}
/**
 * @description Recursively searches through a whole directory.
 * @param {string} location - Directory to search e.g. ~/src
 */


function searchForFiles(_x) {
  return _searchForFiles.apply(this, arguments);
}
/**
 * @description Tries to search for file in a location.
 * If it does not find the location it returns an empty array
 * @param {string} location
 */


function _searchForFiles() {
  _searchForFiles = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(location) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              (0, _recursiveReaddir["default"])(location, function (err, files) {
                if (err) {
                  reject(err);
                  return;
                }

                resolve(files);
              });
            }));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _searchForFiles.apply(this, arguments);
}

function trySearchforFiles(_x2) {
  return _trySearchforFiles.apply(this, arguments);
}
/**
 * @description Sorts files according to their extension.
 * @param {{
 * includeDirectories?: string[];
 * cFiles: string[];
 * cxxFiles: string[];
 * headerFiles: string[];
 * asmFiles: string[];
 * testFiles?: {
  * cFiles: any[];
  * cxxFiles: any[];
  * headerFiles: any[];
  * asmFiles: any[];
 *  };
 * }} fileObj
 * @param {any[]} list
 */


function _trySearchforFiles() {
  _trySearchforFiles = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3(location) {
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            return _context3.abrupt("return", new Promise(
            /*#__PURE__*/
            function () {
              var _ref = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee2(resolve) {
                var output;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        _context2.prev = 0;
                        _context2.next = 3;
                        return searchForFiles(location);

                      case 3:
                        output = _context2.sent;
                        resolve(output);
                        _context2.next = 10;
                        break;

                      case 7:
                        _context2.prev = 7;
                        _context2.t0 = _context2["catch"](0);
                        resolve([]);

                      case 10:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2, null, [[0, 7]]);
              }));

              return function (_x4) {
                return _ref.apply(this, arguments);
              };
            }()));

          case 1:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _trySearchforFiles.apply(this, arguments);
}

function sortFiles(fileObj, list) {
  /**
   * @param {{ split: (arg0: string) => { pop: () => string; }; }} entry
   */
  // Guard assign the key when none exist.
  if (!fileObj.cxxFiles) _lodash["default"].set(fileObj, 'cxxFiles', []);
  if (!fileObj.cFiles) _lodash["default"].set(fileObj, 'cFiles', []);
  if (!fileObj.headerFiles) _lodash["default"].set(fileObj, 'headerFiles', []);
  if (!fileObj.asmFiles) _lodash["default"].set(fileObj, 'asmFiles', []);

  _lodash["default"].map(list, function (entry) {
    var extension = _lodash["default"].toLower(entry.split('.').pop());

    if (extension === 'cpp' || extension === 'cxx') {
      fileObj.cxxFiles.push(entry);
    } else if (extension === 'c') {
      fileObj.cFiles.push(entry);
    } else if (extension === 'h' || extension === 'hpp') {
      fileObj.headerFiles.push(entry);
    } else if (extension === 's') {
      fileObj.asmFiles.push(entry);
    }
  });

  _lodash["default"].forEach(fileObj, function (entry) {
    if (_lodash["default"].isArray(entry)) {
      entry.sort();
    }
  });

  return fileObj;
}
/**
 * @description creates a list of directories which include headers
 * @param {string[]} headerList - list of headerfiles
 */


function getIncludes(headerList) {
  var incList = [];

  _lodash["default"].map(headerList, function (entry) {
    var fileName = entry.split('/').pop();
    var incFolder = entry.replace(fileName, '');

    if (incFolder.charAt(incFolder.length - 1) === '/') {
      incFolder = incFolder.substring(0, incFolder.length - 1);
    }

    incList.push(incFolder);
  });

  incList = _lodash["default"].uniq(incList); // should prepend the -I

  incList = _lodash["default"].map(incList, function (entry) {
    return "-I".concat(entry);
  });
  return incList;
}

function convertToRelative(files, loc) {
  var relativeFiles = _lodash["default"].map(files, function (file) {
    return _path["default"].relative(loc, file);
  });

  return relativeFiles;
}
/**
 * @description Locates the files in the Src, Inc and Lib folder.
 * @param {string} location - the location of the project, in which it should search for files
 */


function getFileList(_x3) {
  return _getFileList.apply(this, arguments);
}

function _getFileList() {
  _getFileList = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee5(location) {
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            return _context5.abrupt("return", new Promise(
            /*#__PURE__*/
            function () {
              var _ref2 = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee4(resolve, reject) {
                var loc, dir, initialFileList, srcFiles, incFiles, libFiles, testFiles, testIndex, includes;
                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        loc = './';

                        if (location && _lodash["default"].isString(location)) {
                          loc = location;
                        } // clear the fileList (multiple calls to this function will populate it again)


                        _lodash["default"].forEach(fileList, function (entry, key) {
                          if (_lodash["default"].isArray(entry)) {
                            fileList[key] = [];
                          }
                        });

                        _lodash["default"].forEach(fileList.testFiles, function (entry, key) {
                          if (_lodash["default"].isArray(entry)) {
                            fileList.testFiles[key] = [];
                          }
                        }); // first check if it has the required directories


                        dir = _fs["default"].readdirSync(loc); // should check for the required files/Directories and display a warning when they arent there.

                        if (!checkForRequiredFiles(dir)) {
                          reject(new Error('The required files and directories were not present'));
                        } // recursively find files in the project.


                        initialFileList = [];
                        _context4.prev = 7;
                        _context4.next = 10;
                        return searchForFiles("".concat(loc, "/").concat(getDirCaseFree('Src', dir)));

                      case 10:
                        srcFiles = _context4.sent;
                        _context4.next = 13;
                        return searchForFiles("".concat(loc, "/").concat(getDirCaseFree('Inc', dir)));

                      case 13:
                        incFiles = _context4.sent;
                        _context4.next = 16;
                        return trySearchforFiles("".concat(loc, "/").concat(getDirCaseFree('Lib', dir)));

                      case 16:
                        libFiles = _context4.sent;
                        initialFileList = initialFileList.concat(srcFiles);
                        initialFileList = initialFileList.concat(incFiles);
                        initialFileList = initialFileList.concat(libFiles);
                        _context4.next = 26;
                        break;

                      case 22:
                        _context4.prev = 22;
                        _context4.t0 = _context4["catch"](7);

                        _vscode["default"].window.showWarningMessage('Something went wrong with reading the files', _context4.t0);

                        reject(_context4.t0);

                      case 26:
                        testFiles = null;
                        testIndex = _lodash["default"].findIndex(dir, function (o) {
                          return o === 'test' || o === 'Test';
                        });

                        if (!(testIndex >= 0)) {
                          _context4.next = 40;
                          break;
                        }

                        _context4.prev = 29;
                        _context4.next = 32;
                        return searchForFiles("".concat(loc, "/").concat(dir[testIndex]));

                      case 32:
                        testFiles = _context4.sent;
                        sortFiles(fileList.testFiles, testFiles);
                        includes = getIncludes(fileList.testFiles.headerFiles);
                        fileList.testFiles.includeDirectories = _lodash["default"].cloneDeep(includes);
                        _context4.next = 40;
                        break;

                      case 38:
                        _context4.prev = 38;
                        _context4.t1 = _context4["catch"](29);

                      case 40:
                        // convert to relative paths.
                        initialFileList = convertToRelative(initialFileList, loc); // should sort files and add them to fileList.

                        sortFiles(fileList, initialFileList);
                        fileList.cIncludes = _lodash["default"].cloneDeep(getIncludes(fileList.headerFiles));
                        resolve(fileList);

                      case 44:
                      case "end":
                        return _context4.stop();
                    }
                  }
                }, _callee4, null, [[7, 22], [29, 38]]);
              }));

              return function (_x5, _x6) {
                return _ref2.apply(this, arguments);
              };
            }()));

          case 1:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));
  return _getFileList.apply(this, arguments);
}