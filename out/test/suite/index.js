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

var path = require('path');

var Mocha = require('mocha');

var glob = require('glob');

function run() {
  // Create the mocha test
  var mocha = new Mocha({
    ui: 'tdd'
  }); // Use any mocha API

  mocha.useColors(true);
  var testsRoot = path.resolve(__dirname, '..');
  return new Promise(function (c, e) {
    glob('**/**.test.js', {
      cwd: testsRoot
    }, function (err, files) {
      if (err) {
        return e(err);
      } // Add files to the test suite


      files.forEach(function (f) {
        return mocha.addFile(path.resolve(testsRoot, f));
      });

      try {
        // Run the mocha test
        mocha.run(function (failures) {
          if (failures > 0) {
            e(new Error("".concat(failures, " tests failed.")));
          } else {
            c();
          }
        });
      } catch (err) {
        e(err);
      }
    });
  });
}

module.exports = {
  run: run
};