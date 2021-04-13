import * as Helpers from '../../../Helpers';
import * as STM32Config from '../../../configuration/stm32Config';
import * as Sinon from 'sinon';
import * as vscode from 'vscode';

import { suite, test } from 'mocha';

import { configurationFixture } from '../../fixtures/extensionConfigurationFixture';
import { expect } from 'chai';

suite('STM32Config', () => {
  test('test file conversion and parsing', async () => {
    const testConfig = STM32Config.createConfigFile(configurationFixture);
    const readFileFake = Sinon.fake.returns(Promise.resolve(testConfig));
    Sinon.replace(vscode.workspace.fs, 'readFile', readFileFake);
    Sinon.replace(Helpers, 'getWorkspaceUri', Sinon.fake.returns(vscode.Uri.file('')));
    const configFile = await STM32Config.readConfigFile();
    expect(configFile).to.deep.equal(configurationFixture);
    Sinon.restore();
  });
});