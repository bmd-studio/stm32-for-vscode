import * as Helpers from '../../../Helpers';
import * as STM32Config from '../../../configuration/stm32Config';
import * as Sinon from 'sinon';
import * as vscode from 'vscode';

import { beforeEach, suite, test } from 'mocha';

import { TextEncoder } from 'util';
import { configurationFixture } from '../../fixtures/extensionConfigurationFixture';
import { expect } from 'chai';
import { makeFSOverWritable } from '../../helpers/fsOverwriteFunctions';

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
    const configuration = STM32Config.parseConfigfile(configFile);
    expect(configuration).to.deep.equal(configurationFixture);
    Sinon.restore();
  });
});