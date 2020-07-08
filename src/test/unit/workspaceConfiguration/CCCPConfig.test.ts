import * as Sinon from 'sinon';
import * as chaiAsPromised from 'chai-as-promised';
import * as helpers from '../../../Helpers';

import { Uri, workspace } from 'vscode';
import { expect, use } from 'chai';
import { getCPropertiesConfig, getDefinitions, getIncludePaths, getWorkspaceConfigFile, updateCProperties } from '../../../workspaceConfiguration/CCCPConfig';
import { suite, test } from 'mocha';

import MakeInfo from '../../../types/MakeInfo';
import { TextEncoder } from 'util';
import expectedResult from '../../fixtures/launchTaskFixture';
import { newMakeInfo } from '../../fixtures/makeInfoFixture';
import { testMakefileInfo } from '../../fixtures/testSTMCubeMakefile';

const fs = workspace.fs;
use(chaiAsPromised);
suite('CCCPConfig test (c_cpp_properties configuration', () => {
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
        armToolchain: 'start/somelocation/',  //TODO: check if the slash is always added
        openOCD: true,
        cMake: true,
        make: true,
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
  test('update c properties', async () => {
    //should test bootstrapping and updating
    const writeFileInWorkspaceFake = Sinon.fake();
    Sinon.replace(helpers, 'writeFileInWorkspace', writeFileInWorkspaceFake);
    // Sinon.stub(writeFileInWorkspace);
    const mockWorkspaceUri = Uri.file('./localworkspace');
    await updateCProperties(mockWorkspaceUri, testMakefileInfo);
    expect(writeFileInWorkspaceFake.calledOnce).to.be.true;
    expect(writeFileInWorkspaceFake.calledOnceWith(
      mockWorkspaceUri, '.vscode/c_cpp_properties.json',
      JSON.stringify({
        configurations: [{
          name: 'STM32',
          includePath: getIncludePaths(testMakefileInfo),
          defines: getDefinitions(testMakefileInfo),
        }
        ],
        version: 4,
      })
    ));
    Sinon.restore();

  });
  test('getWorkspaceConfigFile while file present', async () => {
    const resultingJSON = {
      someKey: 'somevalue',
    };
    const resultingJSONString = JSON.stringify(resultingJSON);
    const findFilesFake =  Sinon.fake.returns([ Uri.file('file')]);
    const fakeReadFile = Sinon.fake.returns(new TextEncoder().encode(resultingJSONString));
    Sinon.replace(workspace, 'findFiles', findFilesFake);
    Sinon.replace(fs, 'readFile', fakeReadFile);
    const result = await getWorkspaceConfigFile();
    expect(findFilesFake.calledOnceWith('**/c_cpp_properties.json')).to.be.true;
    expect(fakeReadFile.calledOnceWith(Uri.file('file')));
    expect(result).should.equal(resultingJSON);
    Sinon.restore();
  });
  test('getWorkspaceConfigFile while file absent', () => {
    const findFilesFake = Sinon.fake.returns([]);
    Sinon.replace(workspace, 'findFiles', findFilesFake);
    expect(getWorkspaceConfigFile()).should.be.rejected;
  });

});