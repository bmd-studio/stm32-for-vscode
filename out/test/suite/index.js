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