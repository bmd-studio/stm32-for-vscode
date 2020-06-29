
import * as Sinon from 'sinon';
import { expect, use } from 'chai';
import * as assert from 'assert';
import { before, test, suite, afterEach, beforeEach } from 'mocha';
// import { workspace, Uri, WorkspaceFolder, window } from 'vscode';
import * as chaiAsPromised from 'chai-as-promised';
import updateConfiguration, { updateLaunch, updateTasks } from '../../../workspaceConfiguration/WorkspaceConfigurations';
import { Uri, workspace, } from 'vscode';
import LaunchTestFile from '../../fixtures/launchTaskFixture';
import { testMakefileInfo } from '../../fixtures/testSTMCubeMakefile';
import BuildTasks from '../../fixtures/tasksFixture';
// import {SinonFake } from '@types/sinon';

use(chaiAsPromised);

// TODO: write tests for Workspace configuration. As of yet it is completely empty.

suite('WorkspaceConfiguration', () => {
  let launchFixtures: {
    getWorkspaceConfigFake: Sinon.SinonSpy;
    updateConfigFake: Sinon.SinonSpy;
    getConfigInWorkspaceFake: Sinon.SinonSpy;
  } = {
    getWorkspaceConfigFake: Sinon.fake(),
    updateConfigFake: Sinon.fake(),
    getConfigInWorkspaceFake: Sinon.fake(),
  };
  const setWorkspaceConfigFakeOutput = (output?: []): void => {
    launchFixtures.getConfigInWorkspaceFake = Sinon.fake.returns({
      get: launchFixtures.getWorkspaceConfigFake,
      update: launchFixtures.updateConfigFake,
    });
    if(output) {
      launchFixtures.getWorkspaceConfigFake = Sinon.fake.returns(output);
      launchFixtures.getConfigInWorkspaceFake = Sinon.fake.returns({
        get: launchFixtures.getWorkspaceConfigFake,
        update: launchFixtures.updateConfigFake,
      });
    }
    // const returningEmptyConfigFake = Sinon.fake.returns(output);
    // launchFixtures.getWorkspaceConfigFake = returningEmptyConfigFake;
    Sinon.replace(workspace, 'getConfiguration', launchFixtures.getConfigInWorkspaceFake);
  };

  beforeEach(() => {
    launchFixtures.getWorkspaceConfigFake = Sinon.fake.returns([LaunchTestFile]);
    launchFixtures.updateConfigFake = Sinon.fake();
    // Sinon.replace(workspace, 'getConfiguration', launchFixtures.getConfigInWorkspaceFake);

  });
  afterEach(() => {
    Sinon.restore();
    launchFixtures = {
      getWorkspaceConfigFake: Sinon.fake(),
      updateConfigFake: Sinon.fake(),
      getConfigInWorkspaceFake: Sinon.fake(),
    };
  });

  test('has launch config', () => {
    setWorkspaceConfigFakeOutput();
    const { getWorkspaceConfigFake, getConfigInWorkspaceFake, updateConfigFake } = launchFixtures;
    const testUri = Uri.file('local');

    updateLaunch(Uri.file('local'), testMakefileInfo);
    expect(getWorkspaceConfigFake.calledOnce).to.be.true;
    expect(getConfigInWorkspaceFake.calledOnceWith('launch', testUri)).to.be.true;
    expect(updateConfigFake.notCalled).to.be.true;
    Sinon.restore();
  });
  test('add launch config on similar config', () => {
    setWorkspaceConfigFakeOutput();
    const { getWorkspaceConfigFake, getConfigInWorkspaceFake, updateConfigFake } = launchFixtures;
    const testUri = Uri.file('local');

    updateLaunch(Uri.file('local'), { ...testMakefileInfo, target: 'othertesttarget' });
    expect(getWorkspaceConfigFake.calledOnce).to.be.true;
    expect(getConfigInWorkspaceFake.calledOnceWith('launch', testUri)).to.be.true;
    const configurations = [
      LaunchTestFile,
      { ...LaunchTestFile, executable: "./build/othertesttarget.elf" },
    ];
    expect(updateConfigFake.calledOnce).to.be.true;
    expect(updateConfigFake.getCall(0).args[1]).to.deep.equal(configurations);
  });
  test('add launch config on empty config', () => {
    setWorkspaceConfigFakeOutput([]);
    // Sinon.replace(workspace, 'getConfiguration', launchFixtures.getConfigInWorkspaceFake);

    // const returningEmptyConfigFake = Sinon.fake.returns([]);
    // Sinon.replace(launchFixtures, 'getWorkspaceConfigFake', returningEmptyConfigFake);
    const { getWorkspaceConfigFake, getConfigInWorkspaceFake, updateConfigFake } = launchFixtures;
    const testUri = Uri.file('local');

    updateLaunch(Uri.file('local'), { ...testMakefileInfo, target: 'othertesttarget' });
    expect(getWorkspaceConfigFake.callCount).to.equal(1);
    expect(getWorkspaceConfigFake.calledOnce).to.be.true;
    expect(getConfigInWorkspaceFake.calledOnceWith('launch', testUri)).to.be.true;
    expect(updateConfigFake.calledOnce).to.be.true;
    expect(updateConfigFake.getCall(0).args[1]).to.deep.equal([{ ...LaunchTestFile, executable: "./build/othertesttarget.elf" }]);
  });


  test('adds all new tasks', () => {
    setWorkspaceConfigFakeOutput([]);
    const { getWorkspaceConfigFake, getConfigInWorkspaceFake, updateConfigFake} = launchFixtures;
    const testUri = Uri.file('local');
    updateTasks(testUri);
    expect(getWorkspaceConfigFake.calledOnce).to.be.true;
    expect(getConfigInWorkspaceFake.calledOnceWith('tasks', testUri)).to.be.true;
    expect(updateConfigFake.calledOnce).to.be.true;
    expect(updateConfigFake.getCall(0).args[1]).to.deep.equal(BuildTasks);
  });
  test('update tasks', () => {

  });
  test('create new tasks', () => {

  });
});