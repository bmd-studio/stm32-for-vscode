/**
* MIT License
*
* Copyright (c) 2020 Bureau Moeilijke Dingen
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getMakefile = getMakefile;
exports.extractSingleLineInfo = extractSingleLineInfo;
exports.extractMultiLineInfo = extractMultiLineInfo;
exports.getTargetSTM = getTargetSTM;
exports.extractMakefileInfo = extractMakefileInfo;
exports["default"] = getMakefileInfo;
exports.makefileInfo = void 0;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/*
 * MakefileInfo.js
 * Set of functions for to extract information out of a makefile
 * Information to get:
 *   TARGET
 *   CPU
 *   FPU
 *   FLOAT-ABI
 *   C_SOURCES
 *   ASM_SOURCES
 *   C_DEFS
 *   AS_INCLUDES
 *   C_INCLUDES
 *   LDSCRIPT
 * Created by Jort Band- Bureau Moeilijke Dingen
 */

/* eslint no-param-reassign: ["error", {
  "props": true, "ignorePropertyModificationsFor": ["infoDef"] }] */
var _ = require('lodash');

var fs = require('fs');

var _require = require('vscode'),
    window = _require.window;

var makefileInfo = {
  target: '',
  cpu: '',
  targetMCU: '',
  fpu: '',
  floatAbi: '',
  mcu: '',
  ldscript: '',
  cSources: [],
  cxxSources: [],
  asmSources: [],
  cDefs: [],
  cxxDefs: [],
  asDefs: [],
  cIncludes: [],
  cxxIncludes: [],
  asIncludes: []
}; // TODO: move this to getMakefileInfo() or extractMakefileInfo().

/**
 * @description
 * @param {string} location - location of the makefile e.g. /filepath/Makefile
 */

exports.makefileInfo = makefileInfo;

function getMakefile(_x) {
  return _getMakefile.apply(this, arguments);
}
/**
 * @description Extracts single line info from a makefile
 * @param {string} name - The name of the Makefile parameter to extract e.g. FLOAT-ABI
 * @param {string} makefile - A string representation of the Makefile
 */


function _getMakefile() {
  _getMakefile = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(location) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              fs.readFile(location, {
                encoding: 'utf8'
              }, function (err, data) {
                if (err) {
                  reject(err);
                  return;
                }

                resolve(data);
              });
            }));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _getMakefile.apply(this, arguments);
}

function extractSingleLineInfo(name, makefile) {
  var newPatt = new RegExp("".concat(name, "\\s=\\s(.*)"), 'gmi');
  var newRes = newPatt.exec(makefile);
  return _.last(newRes);
}
/**
 * @description Extracts multiline info from a makefile
 * @param {string} name - The name of the Makefile parameter to extract e.g. C_SOURCES
 * @param {string} makefile - A string representation of the Makefile
 */


function extractMultiLineInfo(name, makefile) {
  var splitData = makefile.split(/\r\n|\r|\n/);
  var startPattern = new RegExp("".concat(name, "\\s=\\s"), 'gmi'); // const endPattern = new RegExp('^-?[a-z].*\\$', 'gim');

  var endPattern = /^-?[a-z].*\b$/gim;
  var emptyPattern = /^(\s*)$/gim;
  var end = 0;
  var start = 0;
  var cleanStrings = [];

  _.map(splitData, function (line, ind) {
    if (start && !end) {
      if (emptyPattern.test(line)) {
        end = ind;
        return;
      }

      cleanStrings.push(line.replace(/(\s\\$)|(\s.$)/gim, ''));

      if (endPattern.test(line)) {
        end = ind;
      }
    }

    if (startPattern.test(line)) {
      start = ind;
    }
  });

  return cleanStrings;
}
/**
 * @description Function for getting the target from the hal_msp.c file
 * e.g getting the target stm32l4x from: Src/stm32l4xx_hal_msp.c
 * @param {string[]} cFiles
 */


function getTargetSTM(cFiles) {
  var regPattern = /(.*\/)?(.*)x_hal_msp.c/i;
  var output = '';

  _.map(cFiles, function (fileName) {
    if (regPattern.test(fileName)) {
      var regOut = regPattern.exec(fileName);
      output = _.last(regOut);
    }
  });

  return output;
}
/**
 * @description loops through an object file and tries to find the relevant documents
 * in the provided makefile
 * @param {object} infoDef - An object containing camelCased key of what should
 * be extracted from the makefile
 * @param {string} makefile - A string representation of the Makefile
 */


function extractMakefileInfo(infoDef, makefile) {
  _.forEach(infoDef, function (entry, key) {
    // converts the make file key from camelCase to makefile casing. e.g. from cSources to c_sources
    var makeFileKey = _.replace(_.kebabCase(key), '-', '_'); // Guard float-abi is the only key that does not hold the naming convention.


    if (makeFileKey === 'float_abi') {
      makeFileKey = 'float-abi';
    }

    var info = extractSingleLineInfo(makeFileKey, makefile);
    if (!info || info.length === 0) return;

    if (info.indexOf('\\') !== -1) {
      infoDef[key] = extractMultiLineInfo(makeFileKey, makefile);
    } else {
      infoDef[key] = info;
    }
  });

  if (_.isString(infoDef.targetMCU)) {
    // seperately get the tartgetMCU
    infoDef.targetMCU = getTargetSTM(infoDef.cSources);
  }

  return infoDef;
}
/**
 * @description async function for retrieving information from a makefile in JSON format.
 * @param {string} location - location of the makefile
 */


function getMakefileInfo(_x2) {
  return _getMakefileInfo.apply(this, arguments);
} // module.exports = {
//   getMakefileInfo,
//   makefileInfo,
// };


function _getMakefileInfo() {
  _getMakefileInfo = _asyncToGenerator(
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
              regeneratorRuntime.mark(function _callee2(resolve, reject) {
                var loc, makefile;
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        loc = './Makefile';

                        if (location && _.isString(location)) {
                          loc = location;
                        } // Guard for checking if the makefile name is actually appended to the location


                        if (loc.lastIndexOf('Makefile') === -1) {
                          if (loc.charAt(loc.length - 1) !== '/') {
                            loc = loc.concat('/');
                          }

                          loc = loc.concat('Makefile');
                        } // try getting the makefile


                        makefile = null;
                        _context2.prev = 4;
                        _context2.next = 7;
                        return getMakefile(loc);

                      case 7:
                        makefile = _context2.sent;
                        _context2.next = 15;
                        break;

                      case 10:
                        _context2.prev = 10;
                        _context2.t0 = _context2["catch"](4);
                        window.showErrorMessage('Something went wrong with getting the information from the makefile. Please make sure there is a makefile and that the project is initialized through STM32CubeMX.', _context2.t0);
                        reject(_context2.t0);
                        return _context2.abrupt("return");

                      case 15:
                        // when the makefile is found, extract the information according to the makefileInfo fields
                        resolve(extractMakefileInfo(makefileInfo, makefile));

                      case 16:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2, null, [[4, 10]]);
              }));

              return function (_x3, _x4) {
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
  return _getMakefileInfo.apply(this, arguments);
}