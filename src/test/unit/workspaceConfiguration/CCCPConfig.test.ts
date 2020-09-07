import * as Sinon from 'sinon';
import * as _ from 'lodash';
import * as chaiAsPromised from 'chai-as-promised';
import * as helpers from '../../../Helpers';

import { Uri, workspace } from 'vscode';
import { afterEach, suite, test } from 'mocha';
import { expect, use } from 'chai';
import {
  getCPropertiesConfig,
  getDefinitions,
  getIncludePaths,
  getWorkspaceConfigFile,
  updateCProperties
} from '../../../workspaceConfiguration/CCCPConfig';

import MakeInfo from '../../../types/MakeInfo';
import { TextEncoder } from 'util';
import { newMakeInfo } from '../../fixtures/makeInfoFixture';
import { standardOpenOCDInterface } from '../../../Definitions';
import { testMakefileInfo } from '../../fixtures/testSTMCubeMakefile';

const fs = workspace.fs;
use(chaiAsPromised);
suite('CCCPConfig test (c_cpp_properties configuration', () => {
  afterEach(() => {
    Sinon.restore();
  });
  test('includePath conversion', () => {
    // as include paths start with -I for the makefile, these should be converted back to regular paths
    const testIncludes = ['-IsomeInclude/Path', '-ISome/other/1nclud3p@th/w1th5omeW135DCh@r$'];
    const finalIncludes = ['someInclude/Path', 'Some/other/1nclud3p@th/w1th5omeW135DCh@r$'];
    const info: Partial<MakeInfo> = { cIncludes: testIncludes };
    expect(getIncludePaths(info as MakeInfo)).to.deep.equal(finalIncludes);
  });
  test('definitionConversion', () => {
    const testDefs: { cDefs: string[]; cxxDefs: string[]; asDefs: string[] } = {
      cDefs: ['-DdefSomeC', '-DdefSomeD'],
      cxxDefs: ['-DefineThis', '-Definethat'],
      asDefs: ['-DasDefinition', '-DescriptiveDef']
    };
    const result = ['defSomeC', 'defSomeD', 'efineThis', 'efinethat', 'asDefinition', 'escriptiveDef'].sort();
    expect(getDefinitions(testDefs).sort()).to.deep.equal(result);
  });
  test('getCProperties', () => {
    const ingoing: MakeInfo = newMakeInfo({
      cDefs: ['-DdefSomeC', '-DdefSomeD'],
      cxxDefs: ['-DefineThis', '-Definethat'],
      asDefs: ['-DasDefinition', '-DescriptiveDef'],
      cIncludes: ['-IsomeInclude/Path', '-ISome/other/1nclud3p@th/w1th5omeW135DCh@r$'],
      tools: {
        armToolchainPath: 'start/somelocation/',  //TODO: check if the slash is always added
        openOCDPath: true,
        cMakePath: true,
        makePath: true,
        openOCDInterface: standardOpenOCDInterface,
      },
    });

    const testDef = {
      name: 'STM32',
      includePath: ['someInclude/Path', 'Some/other/1nclud3p@th/w1th5omeW135DCh@r$'].sort(),
      defines: ['defSomeC', 'defSomeD', 'efineThis', 'efinethat', 'asDefinition', 'escriptiveDef'].sort(),
    };
    const testOutput = getCPropertiesConfig(ingoing);
    testOutput.includePath.sort();
    testOutput.defines.sort();
    expect(testOutput).to.deep.equal(testDef);
  });
  test('update c properties without earlier file present', async () => {
    //should test bootstrapping and updating
    const writeFileInWorkspaceFake = Sinon.fake();
    const findFileInWorkspaceFake = Sinon.fake.returns([]);
    Sinon.replace(helpers, 'writeFileInWorkspace', writeFileInWorkspaceFake);
    Sinon.replace(workspace, 'findFiles', findFileInWorkspaceFake);
    const expectedResult = JSON.stringify({
      configurations: [{
        name: 'STM32',
        includePath: _.uniq(getIncludePaths(testMakefileInfo)).sort(),
        defines: _.uniq(getDefinitions(testMakefileInfo)).sort(),
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
    const findFileInWorkspaceFake = Sinon.fake.returns([Uri.file('c_cpp_properties.json')]);
    const readFileInWorkspaceFake = Sinon.fake.returns(new TextEncoder().encode(JSON.stringify({
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
    }, null, 2)));
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
          includePath: _.uniq(getIncludePaths(testMakefileInfo)).sort(),
          defines: _.uniq(getDefinitions(testMakefileInfo)).sort(),
        }
      ],
      "version": 4
    }, null, 2);
    Sinon.replace(helpers, 'writeFileInWorkspace', writeFileInWorkspaceFake);
    Sinon.replace(workspace, 'findFiles', findFileInWorkspaceFake);
    Sinon.replace(fs, 'readFile', readFileInWorkspaceFake);
    await updateCProperties(mockWorkspaceUri, testMakefileInfo);
    expect(writeFileInWorkspaceFake.calledOnce).to.be.true;
    expect(findFileInWorkspaceFake.calledOnce).to.be.true;
    expect(readFileInWorkspaceFake.calledOnce).to.be.true;
    expect(writeFileInWorkspaceFake.getCall(0).args[2]).to.deep.equal(expectedResult);
  });
  test('do not update c properties when same config is present', async () => {
    const mockWorkspaceUri = Uri.file('./localworkspace');
    const writeFileInWorkspaceFake = Sinon.fake();
    const findFileInWorkspaceFake = Sinon.fake.returns([Uri.file('c_cpp_properties.json')]);
    const expectedResult = JSON.stringify({
      configurations: [{
        name: 'STM32',
        includePath: _.uniq(getIncludePaths(testMakefileInfo)).sort(),
        defines: _.uniq(getDefinitions(testMakefileInfo)).sort(),
      }
      ],
      version: 4,
    }, null, 2);
    const readFileInWorkspaceFake = Sinon.fake.returns(new TextEncoder().encode(expectedResult));
    Sinon.replace(helpers, 'writeFileInWorkspace', writeFileInWorkspaceFake);
    Sinon.replace(workspace, 'findFiles', findFileInWorkspaceFake);
    Sinon.replace(fs, 'readFile', readFileInWorkspaceFake);
    await updateCProperties(mockWorkspaceUri, testMakefileInfo);
    expect(writeFileInWorkspaceFake.callCount).to.equal(0);
    expect(findFileInWorkspaceFake.calledOnce).to.be.true;
    expect(readFileInWorkspaceFake.calledOnce).to.be.true;

  });
  test('update c properties, with several other definitions present', async () => {
    const writeFileInWorkspaceFake = Sinon.fake();
    const findFileInWorkspaceFake = Sinon.fake.returns([Uri.file('c_cpp_properties.json')]);
    const readFileInWorkspaceFake = Sinon.fake.returns(new TextEncoder().encode(JSON.stringify({
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
    }, null, 2)));
    Sinon.replace(helpers, 'writeFileInWorkspace', writeFileInWorkspaceFake);
    Sinon.replace(workspace, 'findFiles', findFileInWorkspaceFake);
    Sinon.replace(fs, 'readFile', readFileInWorkspaceFake);
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
          getIncludePaths(testMakefileInfo)
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
    const findFilesFake = Sinon.fake.returns([Uri.file('file')]);
    const fakeReadFile = Sinon.fake.returns(new TextEncoder().encode(resultingJSONString));
    Sinon.replace(workspace, 'findFiles', findFilesFake);
    Sinon.replace(fs, 'readFile', fakeReadFile);
    const result = await getWorkspaceConfigFile();
    expect(findFilesFake.calledOnceWith('**/c_cpp_properties.json')).to.be.true;
    expect(fakeReadFile.calledOnceWith(Uri.file('file')));
    expect(result).to.deep.equal(resultingJSON);
    Sinon.restore();
  });
  test('getWorkspaceConfigFile while file absent', () => {
    const findFilesFake = Sinon.fake.returns([]);
    Sinon.replace(workspace, 'findFiles', findFilesFake);
    expect(getWorkspaceConfigFile()).to.be.rejected;
  });

});