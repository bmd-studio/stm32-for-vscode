import * as GetSettings from '../../../getInfo/getSettings';
import * as Sinon from 'sinon';
import * as path from 'path';
import * as shelljs from 'shelljs';
import * as vscode from 'vscode';

import { ToolChain } from '../../../types/MakeInfo';
import { afterEach } from 'mocha';
import { checkSettingsForBuildTools } from '../../../buildTools/validateToolchain';
import { expect } from 'chai';

suite('validate Toolchain Functions', () => {
  afterEach(() => {
    Sinon.restore();
  });
  test('checkSettingsForBuildTools with all build tools present', () => {
    const fakeToolchainResult = new ToolChain();
    fakeToolchainResult.armToolchainPath = 'armpath';
    fakeToolchainResult.cMakePath = 'cmakePath/cmake';
    fakeToolchainResult.makePath = 'makePath';
    const getSettingsFake = Sinon.fake.returns(fakeToolchainResult);
    Sinon.replace(GetSettings, 'getExtensionSettings', getSettingsFake);
    const fakeShell = (toolPath: string | boolean): any => {
      const validArmPath = path.join('armpath', 'arm-none-eabi-gcc');
      if (toolPath === validArmPath) {
        return validArmPath;
      }
      if (toolPath === 'cmakePath/cmake') {
        return toolPath;
      }
      const makePath = path.join('makePath', 'make');
      if (toolPath === makePath) {
        return makePath;
      }
      return false;
    };
    Sinon.replace(shelljs, 'which', fakeShell);
    const result = checkSettingsForBuildTools();
    expect(result.armToolchainPath).to.equal(fakeToolchainResult.armToolchainPath);
    expect(result.cMakePath).to.equal(fakeToolchainResult.cMakePath);
    expect(result.makePath).to.equal(path.join(fakeToolchainResult.makePath, 'make'));
  });


});