"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.combineArraysIntoObject = combineArraysIntoObject;
exports.checkAndConvertCpp = checkAndConvertCpp;
exports.combineInfo = combineInfo;
exports.getInfo = getInfo;
exports["default"] = void 0;

var _lodash = _interopRequireDefault(require("lodash"));

var _vscode = _interopRequireDefault(require("vscode"));

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _MakefileInfo = _interopRequireDefault(require("./MakefileInfo"));

var _ListFiles = _interopRequireDefault(require("./ListFiles"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var info = {
  makefile: {},
  config: {}
};
var _default = info;
/**
 *
 * @param {string[]} arr1
 * @param {string[]} arr2
 * @param {string} key
 * @param {object} obj
 */

exports["default"] = _default;

function combineArraysIntoObject(arr1, arr2, key, obj) {
  // GUARD: against empty or null arrays.
  if (!arr2 || !_lodash["default"].isArray(arr2)) {
    if (arr1 && _lodash["default"].isArray(arr1)) {
      _lodash["default"].set(obj, key, arr1.sort());

      return obj;
    }

    _lodash["default"].set(obj, key, []);

    return obj;
  }

  if (!arr1 || !_lodash["default"].isArray(arr1)) {
    _lodash["default"].set(obj, key, arr2);

    return obj;
  }

  var totalArray = arr1.concat(arr2);
  totalArray = _lodash["default"].uniq(totalArray).sort();

  _lodash["default"].set(obj, key, totalArray);

  return obj;
}
/**
 * @description Check if the programm is a c++ or c program and automatically converts.
 * @param {object} info combined info of the makefile and filelist
 */


function checkAndConvertCpp(info) {
  var newInfo = _lodash["default"].cloneDeep(info);

  if (!(_lodash["default"].indexOf(info.cxxSources, 'main.cpp') === -1) || !(_lodash["default"].indexOf(info.cxxSources, 'Main.cpp') === -1)) {
    // then it has a main.cpp file
    // check for a main.c file
    var indMain = _lodash["default"].indexOf(info.cSources, 'main.c');

    if (indMain === -1) {
      indMain = _lodash["default"].indexOf(info.cSources, 'Main.c');
    }

    if (indMain >= 0) {
      // remove the main. file.
      newInfo.cSources.splice(indMain, 1);
    }
  } else if (!_lodash["default"].isEmpty(info.cxxSources)) {
    _vscode["default"].window.showWarningMessage('You have several cxx/cpp files, however no main.cpp file. Will ignore these files for now'); // should clear the current files


    newInfo.cxxSources = [];
  }

  return newInfo;
}
/**
 * @description Combines the information from the Makefile and the FileList
 * @param {object} makefileInfo
 * @param {object} fileList
 */


function combineInfo(makefileInfo, fileList) {
  var bundledInfo = {}; // Bundling info which both the makeFile and the Filelist have

  combineArraysIntoObject(makefileInfo.cSources, fileList.cFiles, 'cSources', bundledInfo);
  combineArraysIntoObject(makefileInfo.cxxSources, fileList.cxxFiles, 'cxxSources', bundledInfo);
  combineArraysIntoObject(makefileInfo.asmSources, fileList.asmFiles, 'asmSources', bundledInfo);
  combineArraysIntoObject(makefileInfo.cIncludes, fileList.cIncludes, 'cIncludes', bundledInfo);
  combineArraysIntoObject(makefileInfo.cxxIncludes, null, 'cxxIncludes', bundledInfo);
  combineArraysIntoObject(makefileInfo.asIncludes, null, 'asIncludes', bundledInfo); // now assign makelist values

  _lodash["default"].set(bundledInfo, 'target', makefileInfo.target);

  _lodash["default"].set(bundledInfo, 'cpu', makefileInfo.cpu);

  _lodash["default"].set(bundledInfo, 'fpu', makefileInfo.fpu);

  _lodash["default"].set(bundledInfo, 'floatAbi', makefileInfo.floatAbi);

  _lodash["default"].set(bundledInfo, 'mcu', makefileInfo.mcu);

  _lodash["default"].set(bundledInfo, 'ldscript', makefileInfo.ldscript);

  _lodash["default"].set(bundledInfo, 'cDefs', makefileInfo.cDefs);

  _lodash["default"].set(bundledInfo, 'cxxDefs', makefileInfo.cxxDefs);

  _lodash["default"].set(bundledInfo, 'asDefs', makefileInfo.asDefs);

  return bundledInfo;
}
/**
 * @description function for getting all the info combined. After this
 * the info is accesible at the default exported info.
 * Combines the makefile info and files in workspace info, also checks
 * if a project is a C or C++ project and converts accordingly.
 * @param {string} location location of the workspace
 */


function getInfo(_x) {
  return _getInfo.apply(this, arguments);
}

function _getInfo() {
  _getInfo = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee(location) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return", new Promise(function (resolve, reject) {
              var makefileInfoPromise = (0, _MakefileInfo["default"])(location);
              var listFilesInfoPromise = (0, _ListFiles["default"])(location); // TODO: also add a get config in here

              Promise.all([makefileInfoPromise, listFilesInfoPromise]).then(function (values) {
                var _values = _slicedToArray(values, 2),
                    makefileInfo = _values[0],
                    fileInfo = _values[1];

                var newMakefile = combineInfo(makefileInfo, fileInfo);
                newMakefile = checkAndConvertCpp(newMakefile);
                info.makefile = newMakefile;
                resolve(info);
              })["catch"](function (err) {
                _vscode["default"].window.showErrorMessage('Something went wrong with scanning directories and reading files', err);
              });
            }));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _getInfo.apply(this, arguments);
}