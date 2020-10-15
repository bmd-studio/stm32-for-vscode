import * as Sinon from 'sinon';
import * as _ from 'lodash';

import { Stm32SettingsInterface, ToolChain } from '../../types/MakeInfo';
import { afterEach, suite, test } from 'mocha';

import { expect } from 'chai';
import { getWorkspaceSettings } from '../../getInfo/getSettings';
import { workspace } from 'vscode';

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
interface MockWorkspaceConfig extends Stm32SettingsInterface {
  get: (key: string) => string;
}



function MockConfig(options?: object): MockWorkspaceConfig {
  const defaultToolchain = new ToolChain();
  const configuration: MockWorkspaceConfig = {} as MockWorkspaceConfig;
  _.assign(configuration, defaultToolchain);
  if (options) {
    _.assign(configuration, options);
  }
  configuration.get = function (this: MockWorkspaceConfig, key: string) {
    return _.get(this, key);
  };
  return configuration;
}

suite('get settings', () => {
  afterEach(() => {
    Sinon.restore();
  });
  test('test default settings', () => {
    const getConfigurationFake = Sinon.fake.returns(MockConfig());
    Sinon.replace(workspace, 'getConfiguration', getConfigurationFake);
    const settings = getWorkspaceSettings();
    expect(settings).to.deep.equal(new ToolChain());
    expect(getConfigurationFake.calledOnce).to.be.true;
  });
  test('test all empty settings, expect them to be ToolChain defaults', () => {
    const emptySettings = new ToolChain();
    _.forEach(emptySettings, (_entry, key) => {
      _.set(emptySettings, key, '');
    });

    const getConfigurationFake = Sinon.fake.returns(MockConfig(emptySettings));
    Sinon.replace(workspace, 'getConfiguration', getConfigurationFake);
    const settings = getWorkspaceSettings();
    expect(settings).to.deep.equal(new ToolChain());
    expect(getConfigurationFake.calledOnce).to.be.true;
  });
  test('all different settings, expect them to be all different settings', () => {
    const differentSettings = new ToolChain();
    differentSettings.armToolchainPath = 'toArms!';
    differentSettings.makePath = 'bobTheBuilder';
    differentSettings.openOCDPath = 'perfect name for the more neurotic programmer';
    differentSettings.openOCDInterface = 'I wanna program it with something else';
    const differentSettingsResult = MockConfig(differentSettings);

    const getConfigurationFake = Sinon.fake.returns(differentSettingsResult);
    Sinon.replace(workspace, 'getConfiguration', getConfigurationFake);
    const settings = getWorkspaceSettings();
    expect(settings).to.deep.equal(differentSettings);
    expect(getConfigurationFake.calledOnce).to.be.true;
  });
});