import * as Sinon from 'sinon';
 

import { afterEach, suite, test } from 'mocha';

import { convertToolPathToAbsolutePath } from '../../Helpers';
import { expect } from 'chai';
import { platform } from 'process';
import which = require('which');

suite('Helper tests', () => {
  afterEach(() => {
    Sinon.restore();
  });
  test('if convertToolPathToAbsolutePath converts to posix and only selects dir', () => {
    const returnString = platform === 'win32' ?
      'C:\\Some\\fake\\path\\arm-none-eabi-gcc' : '/Some/fake/path/arm-none-eabi-gcc';
    const outputString = platform === 'win32' ?
      'C:/Some/fake/path' : '/Some/fake/path';
    const fakeAbsPath = Sinon.fake.returns(returnString);
    // converted to unkown and any because the type magic was too strong
    Sinon.replace(which, 'sync', fakeAbsPath as unknown as any);
    const absPath = convertToolPathToAbsolutePath('arm-none-eabi', true);
    expect(absPath).to.equal(outputString);
  });
  test('if convertToolPathToAbsolutePath outputs the right path', () => {
    const returnString = platform === 'win32' ?
      'C:\\Some\\fake\\path\\arm-none-eabi-gcc' : '/Some/fake/path/arm-none-eabi-gcc';
    const outputString = platform === 'win32' ?
      'C:/Some/fake/path/arm-none-eabi-gcc' : '/Some/fake/path/arm-none-eabi-gcc';

    // converted to unkown and any because the type magic was too strong
    const fakeAbsPath = Sinon.fake.returns(returnString);
    Sinon.replace(which, 'sync', fakeAbsPath as unknown as any);
    const absPath = convertToolPathToAbsolutePath('arm-none-eabi');
    expect(absPath).to.equal(outputString);
  });

});