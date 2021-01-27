import {expect} from 'chai';
import { test, suite} from 'mocha';
import * as Sinon from 'sinon';
import * as STM32Config from '../../../configuration/stm32Config';
import {configurationFixture} from '../../fixtures/extensionConfigurationFixture';
import * as vscode from 'vscode';
import * as Helpers from '../../../Helpers';

suite('STM32Config',  () => {
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