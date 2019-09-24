// @ts-nocheck
import assert from 'assert';
import { before, test, suite } from 'mocha';
import sinon from 'sinon';
import shelljs from 'shelljs';
import path from 'path';
import {
  checkToolPath, openocdDefinition, armNoneEabiDefinition,
} from '../../src/Requirements';


const shellJSStub = sinon.stub(shelljs, 'which').returns(false);
// const vscodeConfigStub = sinon.stub(vscode, 'workspace.getConfiguration').returns({set: (this)});

suite('Requirements test', () => {
  before(() => {

  });
  test('checkToolPath does not have tool test', () => {
    shellJSStub.returns(false);
    assert.equal(checkToolPath(openocdDefinition, '.'), false);
    assert.equal(checkToolPath(openocdDefinition, '/fakepath'), false);
  });

  test('checkToolPath does have tool', () => {
    // assert.equal(checkToolPath(fakeCMDDefinition, '.'), false);
    shellJSStub.returns(true);
    assert.equal(checkToolPath(openocdDefinition, '/usr/bin/open-ocd'), '/usr/bin/open-ocd');
    shellJSStub.returns(false);
    shellJSStub.withArgs('/usr/bin/openocd').returns(true);
    assert.equal(checkToolPath(openocdDefinition, '/usr/bin/'), '/usr/bin/openocd');
    shellJSStub.withArgs('/usr/bin/openocd').returns(false); // reset
    shellJSStub.withArgs('/usr/bin/open-ocd').returns(true);
    assert.equal(checkToolPath(openocdDefinition, '/usr/bin'), '/usr/bin/open-ocd');
    assert.equal(checkToolPath(openocdDefinition, 'usr/'), false);
    assert.equal(checkToolPath(openocdDefinition, '/usr/bin/open-ocd'), '/usr/bin/open-ocd');
    shellJSStub.withArgs('/usr/bin/open-ocd').returns(false); // reset
  });
  test('checkToolPath does not have folder', () => {
    shellJSStub.returns(false);
    assert.equal(checkToolPath(armNoneEabiDefinition, '.'), false);
    assert.equal(checkToolPath(armNoneEabiDefinition, './arm-none-eabi-g++'), false);
  });

  test('checkToolPath does have folder', () => {
    shellJSStub.returns(true);
    assert.equal(checkToolPath(armNoneEabiDefinition, './'), '.');
    assert.equal(checkToolPath(armNoneEabiDefinition, './bin'), './bin');
    assert.equal(checkToolPath(armNoneEabiDefinition, 'usr/more/slashes/to.test/'), 'usr/more/slashes/to.test');
    shellJSStub.returns(false);
    const armNoneEabiPath = path.resolve('usr/bin/arm-none-eabi/arm-none-eabi-g++');
    shellJSStub.withArgs(armNoneEabiPath).returns(true);
    assert.equal(checkToolPath(armNoneEabiDefinition, './'), false);
    assert.equal(checkToolPath(armNoneEabiDefinition, './bin'), false);
    assert.equal(checkToolPath(armNoneEabiDefinition, 'usr/more/slashes/to.test/'), false);

    assert.equal(checkToolPath(armNoneEabiDefinition, 'usr/bin/arm-none-eabi'), 'usr/bin/arm-none-eabi');
    assert.equal(checkToolPath(armNoneEabiDefinition, 'usr/bin/arm-none-eabi/'), 'usr/bin/arm-none-eabi');
    assert.equal(checkToolPath(armNoneEabiDefinition, 'usr/bin/arm-none-eabi/arm-none-eabi-g++'), 'usr/bin/arm-none-eabi');
    shellJSStub.withArgs(armNoneEabiPath).returns(false);
  });
  test('checkToolPath has standard cmd', () => {
  });
  // test('checkToolPath does have tool', () => {
  //   assert.equal(getDirCaseFree('noneExtistent', goodTestDir), null);
  // });
  // test('checkToolPath has folder tool test', () => {
  //   assert.equal(getDirCaseFree('noneExtistent', goodTestDir), null);
  // });
});
