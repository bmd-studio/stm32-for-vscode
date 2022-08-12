import * as Sinon from 'sinon';
import * as vscode from 'vscode';

import { suite, test, beforeEach } from 'mocha';

import { expect } from 'chai';
import { TextEncoder } from 'util';
import { configurationFixture } from '../../fixtures/extensionConfigurationFixture';
import { makeFSOverWritable } from '../../helpers/fsOverwriteFunctions';
import * as STM32Config from '../../../configuration/stm32Config';
import * as Helpers from '../../../Helpers';

suite('STM32Config', () => {
  beforeEach(() => {
    makeFSOverWritable(vscode);
  });

  test('test file conversion and parsing', async () => {
    const encoder = new TextEncoder();
    const testConfig = STM32Config.createConfigFile(configurationFixture);
    const readFileFake = Sinon.fake.returns(Promise.resolve(encoder.encode(testConfig)));
    Sinon.replace(vscode.workspace.fs, 'readFile', readFileFake);
    Sinon.replace(Helpers, 'getWorkspaceUri', Sinon.fake.returns(vscode.Uri.file('')));
    const configFile = await STM32Config.readConfigFile();
    expect(configFile).to.deep.equal(configurationFixture);
    Sinon.restore();
  });
});
