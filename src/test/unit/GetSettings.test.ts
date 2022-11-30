import * as Sinon from 'sinon';
import { forEach, get, set } from 'lodash';

import { ToolChain, ToolChainInterface } from '../../types/MakeInfo';
import { afterEach, suite, test } from 'mocha';
import { expect } from 'chai';
import { getExtensionSettings } from '../../getInfo/getSettings';
import { workspace, WorkspaceConfiguration } from 'vscode';

// class MockConfig {
//   public constructor(options?: object) {
//     const defaultToolchain = new ToolChain();
//     _.assign(this, defaultToolchain);
//     if (options) {
//       _.assign(this, options);
//     }
//   }

//   public get(key: string): string {
//     return _.get(this, key);
//   }
// }
interface MockWorkspaceConfig extends ToolChainInterface {
  get: (key: string) => string;
}



function mockConfig(options?: object): MockWorkspaceConfig {
  const defaultToolchain = new ToolChain();
  let configuration: MockWorkspaceConfig = {} as MockWorkspaceConfig;
  configuration = { ...configuration, ...defaultToolchain };
  if (options) {
    configuration = { ...configuration, ...options };
  }
  configuration.get = function (this: MockWorkspaceConfig, key: string) {
    return get(this, key);
  };
  return configuration;
}

suite('get settings', () => {
  afterEach(() => {
    Sinon.restore();
  });
  test('test default settings', () => {
    const getConfigurationFake = Sinon.fake.returns(mockConfig() as unknown as WorkspaceConfiguration);
    Sinon.replace(workspace, 'getConfiguration', getConfigurationFake);
    const settings = getExtensionSettings();
    expect(settings).to.deep.equal(new ToolChain());
    expect(getConfigurationFake.calledOnce).to.be.true;
  });
  test('test all empty settings, expect them to be ToolChain defaults', () => {
    const emptySettings = new ToolChain();
    forEach(emptySettings, (_entry, key) => {
      set(emptySettings, key, '');
    });

    const getConfigurationFake = Sinon.fake.returns(mockConfig(emptySettings) as unknown as WorkspaceConfiguration);
    Sinon.replace(workspace, 'getConfiguration', getConfigurationFake);
    const settings = getExtensionSettings();
    expect(settings).to.deep.equal(new ToolChain());
    expect(getConfigurationFake.calledOnce).to.be.true;
  });
  test('all different settings, expect them to be all different settings', () => {
    const differentSettings = new ToolChain();
    differentSettings.armToolchainPath = 'toArms!';
    differentSettings.makePath = 'bobTheBuilder';
    differentSettings.openOCDPath = 'perfect name for the more neurotic programmer';

    const differentSettingsResult = mockConfig(differentSettings);

    const getConfigurationFake = Sinon.fake.returns(differentSettingsResult as unknown as WorkspaceConfiguration);
    Sinon.replace(workspace, 'getConfiguration', getConfigurationFake);
    const settings = getExtensionSettings();
    expect(settings).to.deep.equal(differentSettings);
    expect(getConfigurationFake.calledOnce).to.be.true;
  });
});