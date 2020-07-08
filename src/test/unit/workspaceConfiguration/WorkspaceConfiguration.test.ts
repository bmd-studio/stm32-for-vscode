import * as Sinon from 'sinon';
import * as _ from 'lodash';
// import { workspace, Uri, WorkspaceFolder, window } from 'vscode';
import * as chaiAsPromised from 'chai-as-promised';

import { TaskDefinition, Uri, workspace } from 'vscode';
import { afterEach, beforeEach, suite, test } from 'mocha';
import { expect, use } from 'chai';
import updateConfiguration, { updateLaunch, updateTasks } from '../../../workspaceConfiguration/WorkspaceConfigurations';

import BuildTasks from '../../fixtures/tasksFixture';
import LaunchTestFile from '../../fixtures/launchTaskFixture';
import { testMakefileInfo } from '../../fixtures/testSTMCubeMakefile';

// import {SinonFake } from '@types/sinon';

use(chaiAsPromised);
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
  const setWorkspaceConfigFakeOutput = (output?: TaskDefinition[]): void => {
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
    Sinon.replace(workspace, 'getConfiguration', launchFixtures.getConfigInWorkspaceFake);
  };

  beforeEach(() => {
    launchFixtures.getWorkspaceConfigFake = Sinon.fake.returns([LaunchTestFile]);
    launchFixtures.updateConfigFake = Sinon.fake();
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
  test('update tasks when one task is missing', () => {
    setWorkspaceConfigFakeOutput([BuildTasks[0], BuildTasks[1]]);
    const { getWorkspaceConfigFake, getConfigInWorkspaceFake, updateConfigFake} = launchFixtures;
    const testUri = Uri.file('local');
    updateTasks(testUri);
    expect(getWorkspaceConfigFake.calledOnce).to.be.true;
    expect(getConfigInWorkspaceFake.calledOnceWith('tasks', testUri)).to.be.true;
    expect(updateConfigFake.calledOnce).to.be.true;
    expect(updateConfigFake.getCall(0).args[1]).to.deep.equal(BuildTasks);
  });
  test('add task when similar task is present', () => {
    const similarTask = { ...BuildTasks[0], device: 'someRandoDevice'};
    setWorkspaceConfigFakeOutput([similarTask, BuildTasks[1], BuildTasks[2]]);
    const { getWorkspaceConfigFake, getConfigInWorkspaceFake, updateConfigFake} = launchFixtures;
    const testUri = Uri.file('local');
    updateTasks(testUri);
    expect(getWorkspaceConfigFake.calledOnce).to.be.true;
    expect(getConfigInWorkspaceFake.calledOnceWith('tasks', testUri)).to.be.true;
    expect(updateConfigFake.calledOnce).to.be.true;
    expect(_.sortBy(updateConfigFake.getCall(0).args[1], ['command', 'device'])).to.deep.equal(_.sortBy([similarTask, BuildTasks[0], BuildTasks[1], BuildTasks[2]], ['command', 'device']));
  });
});