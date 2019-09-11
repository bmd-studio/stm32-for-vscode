"use strict";

var assert = require('assert');

var _require = require('mocha'),
    before = _require.before; // You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// const vscode = require('vscode');
// const myExtension = require('../extension');


suite('Extension Test Suite', function () {
  // before(() => {
  // 	vscode.window.showInformationMessage('Start all tests.');
  // });
  test('Sample test', function () {
    assert.equal(-1, [1, 2, 3].indexOf(5));
    assert.equal(-1, [1, 2, 3].indexOf(0));
  });
});