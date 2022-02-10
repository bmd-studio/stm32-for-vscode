import * as CCCPConfig from '../../../configuration/CCCPConfig';
import * as Sinon from 'sinon';
import * as _ from 'lodash';
import * as chaiAsPromised from 'chai-as-promised';
import * as helpers from '../../../Helpers';
import * as shelljs from 'shelljs';
import * as vscode from 'vscode';
import { Uri } from 'vscode';
import { afterEach, beforeEach, suite, test } from 'mocha';
import { expect, use } from 'chai';

import MakeInfo from '../../../types/MakeInfo';
import { TextEncoder } from 'util';
import { newMakeInfo } from '../../fixtures/makeInfoFixture';
import { testMakefileInfo } from '../../fixtures/testSTMCubeMakefile';
import { makeFSOverWritable } from '../../helpers/fsOverwriteFunctions';

const {
  getCPropertiesConfig,
  getDefinitions,
  getWorkspaceConfigFile,
  updateCProperties,
  // getAbsoluteCompilerPath,
} = CCCPConfig;


// const fs = workspace.fs;
use(chaiAsPromised);
suite('CCCPConfig test (c_cpp_properties configuration', () => {
  beforeEach(() => {
    makeFSOverWritable(vscode);
  });
  afterEach(() => {
    Sinon.restore();
  });
  beforeEach(() => {
    Sinon.replace(shelljs, 'which', Sinon.fake.returns('arm-none-eabi-gcc'));
    Sinon.replace(CCCPConfig, 'getAbsoluteCompilerPath', Sinon.fake.returns('arm-none-eabi-gcc'));
  });

  test('definitionConversion', () => {
    const testDefs: { cDefinitions: string[]; cxxDefinitions: string[]; assemblyDefinitions: string[] } = {
      cDefinitions: ['-DdefSomeC', '-DdefSomeD'],
      cxxDefinitions: ['-DefineThis', '-Definethat'],
      assemblyDefinitions: ['-DasDefinition', '-DescriptiveDef']
    };
    const result = ['defSomeC', 'defSomeD', 'efineThis', 'efinethat', 'asDefinition', 'escriptiveDef'].sort();
    expect(getDefinitions(testDefs).sort()).to.deep.equal(result);
  });
  test('getCProperties', () => {

    const ingoing: MakeInfo = newMakeInfo({
      cDefinitions: ['defSomeC', 'defSomeD'],
      cxxDefinitions: ['efineThis', 'efinethat'],
      assemblyDefinitions: ['asDefinition', 'escriptiveDef'],
      cIncludeDirectories: ['someInclude/Path', 'Some/other/1nclud3p@th/w1th5omeW135DCh@r$'],
      tools: {
        armToolchainPath: 'start/somelocation/',
        openOCDPath: true,
        makePath: true,
      },
    });

    const testDef = {
      name: 'STM32',
      includePath: ['someInclude/Path', 'Some/other/1nclud3p@th/w1th5omeW135DCh@r$'].sort(),
      defines: ['defSomeC', 'defSomeD', 'efineThis', 'efinethat', 'asDefinition', 'escriptiveDef'].sort(),
      compilerPath: 'arm-none-eabi-gcc',
    };

    const testOutput = getCPropertiesConfig(ingoing);
    testOutput.includePath.sort();
    testOutput.defines.sort();
    expect(testOutput).to.deep.equal(testDef);
  });
  test('update c properties without earlier file present', async () => {
    //should test bootstrapping and updating
    const writeFileInWorkspaceFake = Sinon.fake();
    const findFileInWorkspaceFake = Sinon.fake.returns(Promise.resolve([]));
    Sinon.replace(helpers, 'writeFileInWorkspace', writeFileInWorkspaceFake);
    Sinon.replace(vscode.workspace, 'findFiles', findFileInWorkspaceFake);
    const expectedResult = JSON.stringify({
      configurations: [{
        name: 'STM32',
        includePath: _.uniq(testMakefileInfo.cIncludeDirectories).sort(),
        defines: _.uniq(getDefinitions(testMakefileInfo)).sort(),
        compilerPath: 'arm-none-eabi-gcc',
      }
      ],
      version: 4,
    }, null, 2);

    // Sinon.stub(writeFileInWorkspace);
    const mockWorkspaceUri = Uri.file('./localworkspace');
    await updateCProperties(mockWorkspaceUri, testMakefileInfo);
    expect(writeFileInWorkspaceFake.calledOnce).to.be.true;
    expect(writeFileInWorkspaceFake.getCall(0).args[2]).to.deep.equal(expectedResult);
    expect(writeFileInWorkspaceFake.calledOnceWith(
      mockWorkspaceUri, '.vscode/c_cpp_properties.json',
      expectedResult,
    )).to.be.true;
    Sinon.restore();
  });
  test('update c properties, while another config is present', async () => {
    const mockWorkspaceUri = Uri.file('./localworkspace');
    const writeFileInWorkspaceFake = Sinon.fake();
    const findFileInWorkspaceFake = Sinon.fake.returns(Promise.resolve([Uri.file('c_cpp_properties.json')]));
    const readFileInWorkspaceFake = Sinon.fake.returns(Promise.resolve(new TextEncoder().encode(JSON.stringify({
      configurations: [
        {
          name: "SomeOtherConfig",
          includePath: [
            "somenonStandard/Include/Path",
          ],
          defines: [
            "iWillNotBeDefined"
          ],
          compilerPath: "arm-none-eabi-gcc",
          cStandard: "c11",
          cppStandard: "c++11"
        }
      ],
      "version": 4
    }, null, 2))));
    const expectedResult = JSON.stringify({
      configurations: [
        {
          name: "SomeOtherConfig",
          includePath: [
            "somenonStandard/Include/Path",
          ],
          defines: [
            "iWillNotBeDefined"
          ],
          compilerPath: "arm-none-eabi-gcc",
          cStandard: "c11",
          cppStandard: "c++11"
        },
        {
          name: 'STM32',
          includePath: _.uniq(testMakefileInfo.cIncludeDirectories).sort(),
          defines: _.uniq(getDefinitions(testMakefileInfo)).sort(),
          compilerPath: "arm-none-eabi-gcc",
        }
      ],
      "version": 4
    }, null, 2);
    Sinon.replace(helpers, 'writeFileInWorkspace', writeFileInWorkspaceFake);
    Sinon.replace(vscode.workspace, 'findFiles', findFileInWorkspaceFake);
    Sinon.replace(vscode.workspace.fs, 'readFile', readFileInWorkspaceFake);
    await updateCProperties(mockWorkspaceUri, testMakefileInfo);
    expect(writeFileInWorkspaceFake.calledOnce).to.be.true;
    expect(findFileInWorkspaceFake.calledOnce).to.be.true;
    expect(readFileInWorkspaceFake.calledOnce).to.be.true;
    expect(writeFileInWorkspaceFake.getCall(0).args[2]).to.deep.equal(expectedResult);
  });
  test('do not update c properties when same config is present', async () => {
    const mockWorkspaceUri = Uri.file('./localworkspace');
    const writeFileInWorkspaceFake = Sinon.fake();
    const findFileInWorkspaceFake = Sinon.fake.returns(Promise.resolve([Uri.file('c_cpp_properties.json')]));
    const expectedResult = JSON.stringify({
      configurations: [{
        name: 'STM32',
        includePath: _.uniq(testMakefileInfo.cIncludeDirectories).sort(),
        defines: _.uniq(getDefinitions(testMakefileInfo)).sort(),
        compilerPath: 'arm-none-eabi-gcc',
      }
      ],
      version: 4,
    }, null, 2);
    const readFileInWorkspaceFake = Sinon.fake.returns(Promise.resolve(new TextEncoder().encode(expectedResult)));
    Sinon.replace(helpers, 'writeFileInWorkspace', writeFileInWorkspaceFake);
    Sinon.replace(vscode.workspace, 'findFiles', findFileInWorkspaceFake);
    Sinon.replace(vscode.workspace.fs, 'readFile', readFileInWorkspaceFake);
    await updateCProperties(mockWorkspaceUri, testMakefileInfo);
    expect(writeFileInWorkspaceFake.callCount).to.equal(0);
    expect(findFileInWorkspaceFake.calledOnce).to.be.true;
    expect(readFileInWorkspaceFake.calledOnce).to.be.true;

  });
  test('update c properties, with several other definitions present', async () => {
    const writeFileInWorkspaceFake = Sinon.fake();
    const findFileInWorkspaceFake = Sinon.fake.returns(Promise.resolve([Uri.file('c_cpp_properties.json')]));
    const readFileInWorkspaceFake = Sinon.fake.returns(Promise.resolve(new TextEncoder().encode(JSON.stringify({
      configurations: [
        {
          name: "STM32",
          includePath: [
            "somenonStandard/Include/Path",
          ],
          defines: [
            "iWillNotBeDefined"
          ],
          compilerPath: "arm-none-eabi-gcc",
          cStandard: "c11",
          cppStandard: "c++11"
        }
      ],
      "version": 4
    }, null, 2))));
    Sinon.replace(helpers, 'writeFileInWorkspace', writeFileInWorkspaceFake);
    Sinon.replace(vscode.workspace, 'findFiles', findFileInWorkspaceFake);
    Sinon.replace(vscode.workspace.fs, 'readFile', readFileInWorkspaceFake);
    // Sinon.stub(writeFileInWorkspace);
    const mockWorkspaceUri = Uri.file('./localworkspace');
    await updateCProperties(mockWorkspaceUri, testMakefileInfo);
    expect(writeFileInWorkspaceFake.calledOnce).to.be.true;
    const expectedCallResult = {
      configurations: [
        {
          name: "STM32",
          includePath: [
            "somenonStandard/Include/Path",
          ],
          defines: [
            "iWillNotBeDefined"
          ],
          compilerPath: "arm-none-eabi-gcc",
          cStandard: "c11",
          cppStandard: "c++11"
        }
      ],
      "version": 4
    };
    expectedCallResult.configurations[0].includePath =
      _.uniq(
        expectedCallResult.configurations[0].includePath.concat(
          testMakefileInfo.cIncludeDirectories
        )).sort();
    expectedCallResult.configurations[0].defines =
      _.uniq(
        expectedCallResult.configurations[0].defines.concat(
          getDefinitions(testMakefileInfo)
        )).sort();
    expect(writeFileInWorkspaceFake.getCall(0).args[2]).to.deep.equal(JSON.stringify(expectedCallResult, null, 2));
    expect(writeFileInWorkspaceFake.calledOnceWith(
      mockWorkspaceUri, '.vscode/c_cpp_properties.json',
      JSON.stringify(expectedCallResult, null, 2)
    )).to.be.true;
    Sinon.restore();
  });
  test('getWorkspaceConfigFile while file present', async () => {
    const resultingJSON = {
      someKey: 'somevalue',
    };
    const resultingJSONString = JSON.stringify(resultingJSON);
    const findFilesFake = Sinon.fake.returns(Promise.resolve([Uri.file('file')]));
    const fakeReadFile = Sinon.fake.returns(Promise.resolve(new TextEncoder().encode(resultingJSONString)));
    Sinon.replace(vscode.workspace, 'findFiles', findFilesFake);
    Sinon.replace(vscode.workspace.fs, 'readFile', fakeReadFile);
    const result = await getWorkspaceConfigFile();
    expect(findFilesFake.calledOnceWith('**/c_cpp_properties.json')).to.be.true;
    expect(fakeReadFile.calledOnceWith(Uri.file('file')));
    expect(result).to.deep.equal(resultingJSON);
    Sinon.restore();
  });
  test('getWorkspaceConfigFile while file absent', () => {
    const findFilesFake = Sinon.fake.returns(Promise.resolve([]));
    Sinon.replace(vscode.workspace, 'findFiles', findFilesFake);
    expect(getWorkspaceConfigFile()).to.be.rejected;
  });

});