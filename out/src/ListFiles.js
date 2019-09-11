"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _ = require('lodash');

var fs = require('fs');

var fsRecursive = require('recursive-readdir');

var vscode = require('vscode');
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
 * @description Checks if the Makefile, Src, Inc and Drivers directories/files are present.
 * @param {string[] | ArrayLike<string>} directoryFiles
 */

function checkForRequiredFiles(directoryFiles) {
  // required files/directories are: makefile, Src, Inc and Drivers
  var check = true;

  if (_.indexOf(directoryFiles, 'Makefile') === -1) {
    // should show warning
    vscode.window.showWarningMessage('No Makefile is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');
    check = false;
  }

  if (_.indexOf(directoryFiles, 'Src') === -1) {
    vscode.window.showWarningMessage('No Src directory is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');
    check = false;
  }

  if (_.indexOf(directoryFiles, 'Inc') === -1) {
    vscode.window.showWarningMessage('No Inc directory is present, please initialize your project using CubeMX, with the Toolchain set to Makefile under the project manager');
    check = false;
  }

  if (_.indexOf(directoryFiles, 'Drivers') === -1) {
    vscode.window.showWarningMessage('No Drivers directory is present, please initialize your project using CubeMX, and under Code Generator make sure that the "Copy all user libraries into the project folder" option is selected.');
    check = false;
  }

  return check;
}
/**
 * @description Tries to search for file in a location. If it does not find the location it returns an empty array
 * @param {string} location
 */


function trySearchforFiles(_x) {
  return _trySearchforFiles.apply(this, arguments);
}
/**
 * @description Recursively searches through a whole directory.
 * @param {string} location - Directory to search e.g. ~/src
 */


function _trySearchforFiles() {
  _trySearchforFiles = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(location) {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            return _context2.abrupt("return", new Promise(
            /*#__PURE__*/
            function () {
              var _ref = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee(resolve) {
                var output;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        _context.prev = 0;
                        _context.next = 3;
                        return searchForFiles(location);

                      case 3:
                        output = _context.sent;
                        resolve(output);
                        _context.next = 10;
                        break;

                      case 7:
                        _context.prev = 7;
                        _context.t0 = _context["catch"](0);
                        resolve([]);

                      case 10:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, null, [[0, 7]]);
              }));

              return function (_x4) {
                return _ref.apply(this, arguments);
              };
            }()));

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _trySearchforFiles.apply(this, arguments);
}

function searchForFiles(_x2) {
  return _searchForFiles.apply(this, arguments);
}
/**
 * @description Sorts files according to their extension.
 * @param {{ includeDirectories?: string[]; cFiles: string[]; cxxFiles: string[]; headerFiles: string[]; asmFiles: string[]; testFiles?: { cFiles: any[]; cxxFiles: any[]; headerFiles: any[]; asmFiles: any[]; }; }} fileObj
 * @param {any[]} list
 */


function _searchForFiles() {
  _searchForFiles = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3(location) {
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            return _context3.abrupt("return", new Promise(function (resolve, reject) {
              fsRecursive(location, function (err, files) {
                if (err) {
                  reject(err);
                  return;
                }

                resolve(files);
              });
            }));

          case 1:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _searchForFiles.apply(this, arguments);
}

function sortFiles(fileObj, list) {
  /**
   * @param {{ split: (arg0: string) => { pop: () => string; }; }} entry
   */
  _.map(list, function (entry) {
    var extension = _.toLower(entry.split('.').pop());

    if (extension === 'cpp' || extension === 'cxx') {
      fileObj.cxxFiles.push(entry);
    } else if (extension === 'c') {
      fileObj.cFiles.push(entry);
    } else if (extension === 'h' || extension === 'hpp') {
      fileObj.headerFiles.push(entry);
    } else if (extension === 's') {
      fileObj.asmFiles.push(extension);
    }
  });

  _.forEach(fileObj, function (entry) {
    if (_.isArray(entry)) {
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

  _.map(headerList, function (entry) {
    var fileName = entry.split('/').pop();
    var incFolder = entry.replace(fileName, '');
    incList.push(incFolder);
  });

  incList = _.uniq(incList);
  return incList;
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
                var loc, dir, initialFileList, srcFiles, incFiles, libFiles, testFiles, testIndex;
                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                  while (1) {
                    switch (_context4.prev = _context4.next) {
                      case 0:
                        loc = './';

                        if (location && _.isString(location)) {
                          loc = location;
                        } // clear the fileList (multiple calls to this function will populate it again)


                        _.forEach(fileList, function (entry, key) {
                          if (_.isArray(entry)) {
                            fileList[key] = [];
                          }
                        });

                        _.forEach(fileList.testFiles, function (entry, key) {
                          if (_.isArray(entry)) {
                            fileList.testFiles[key] = [];
                          }
                        }); // first check if it has the required directories


                        dir = fs.readdirSync(loc); // should check for the required files/Directories and display a warning when they arent there.

                        if (!checkForRequiredFiles(dir)) {
                          reject(new Error('The required files and directories were not present'));
                        } // recursively find files in the project.


                        initialFileList = [];
                        _context4.prev = 7;
                        _context4.next = 10;
                        return searchForFiles("".concat(loc, "/Src"));

                      case 10:
                        srcFiles = _context4.sent;
                        _context4.next = 13;
                        return searchForFiles("".concat(loc, "/Inc"));

                      case 13:
                        incFiles = _context4.sent;
                        _context4.next = 16;
                        return trySearchforFiles("".concat(loc, "/Lib"));

                      case 16:
                        libFiles = _context4.sent;
                        _context4.t0 = libFiles;
                        _context4.next = 20;
                        return trySearchforFiles("".concat(loc, "/lib"));

                      case 20:
                        _context4.t1 = _context4.sent;

                        _context4.t0.concat.call(_context4.t0, _context4.t1);

                        _.map(srcFiles, function (entry) {
                          initialFileList.push(entry);
                        });

                        _.map(incFiles, function (entry) {
                          initialFileList.push(entry);
                        });

                        _context4.next = 30;
                        break;

                      case 26:
                        _context4.prev = 26;
                        _context4.t2 = _context4["catch"](7);
                        vscode.window.showWarningMessage('Something went wrong with reading the files', _context4.t2);
                        reject(_context4.t2);

                      case 30:
                        testFiles = null;
                        testIndex = _.findIndex(dir, function (o) {
                          return o === 'test' || o === 'Test';
                        });

                        if (!(testIndex >= 0)) {
                          _context4.next = 43;
                          break;
                        }

                        _context4.prev = 33;
                        _context4.next = 36;
                        return searchForFiles("".concat(loc, "/").concat(dir[testIndex]));

                      case 36:
                        testFiles = _context4.sent;
                        sortFiles(fileList.testFiles, testFiles);
                        fileList.testFiles.includeDirectories = _.cloneDeep(getIncludes(fileList.testFiles.headerFiles));
                        _context4.next = 43;
                        break;

                      case 41:
                        _context4.prev = 41;
                        _context4.t3 = _context4["catch"](33);

                      case 43:
                        // should sort files and add them to fileList.
                        sortFiles(fileList, initialFileList);
                        fileList.includeDirectories = _.cloneDeep(getIncludes(fileList.headerFiles));
                        return _context4.abrupt("return", fileList);

                      case 46:
                      case "end":
                        return _context4.stop();
                    }
                  }
                }, _callee4, null, [[7, 26], [33, 41]]);
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

module.exports = {
  getFileList: getFileList,
  fileList: fileList,
  getIncludes: getIncludes,
  sortFiles: sortFiles,
  searchForFiles: searchForFiles,
  trySearchforFiles: trySearchforFiles,
  checkForRequiredFiles: checkForRequiredFiles
};