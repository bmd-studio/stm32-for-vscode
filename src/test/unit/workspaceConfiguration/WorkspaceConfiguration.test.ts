import * as Sinon from 'sinon';
import * as chaiAsPromised from 'chai-as-promised';
import * as helpers from '../../../Helpers';

import LaunchTestFile, {
  attachFixture,
  attachFixtureWithSVD,
  debugFixture,
  debugFixtureWithSVD,
} from '../../fixtures/launchTaskFixture';
import { TaskDefinition, Uri, workspace } from 'vscode';
import { afterEach, beforeEach, suite, test } from 'mocha';
import { assert, expect, use } from 'chai';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import updateConfiguration, {
  updateLaunch,
  updateTasks
} from '../../../configuration/WorkspaceConfigurations';

import BuildTasks from '../../fixtures/tasksFixture';
import GithubSVDSResponseFixture from '../projectSetup/githubSVDResponseFixture';
import h7SVDResponseFixture from '../projectSetup/h7SVDFileFixture';
import { testMakefileInfo } from '../../fixtures/testSTMCubeMakefile';


use(chaiAsPromised);
suite('WorkspaceConfiguration', () => {

  let launchFixtures: {
    getWorkspaceConfigFake: Sinon.SinonSpy;
    updateConfigFake: Sinon.SinonSpy;
    getConfigInWorkspaceFake: Sinon.SinonSpy;
  } = {
    getWorkspaceConfigFake: Sinon.fake(),
    updateConfigFake: Sinon.fake.returns(Promise.resolve()),
    getConfigInWorkspaceFake: Sinon.fake(),
  };

  const setWorkspaceConfigFakeOutput = (output?: TaskDefinition[]): void => {
    launchFixtures.getConfigInWorkspaceFake = Sinon.fake.returns({
      get: launchFixtures.getWorkspaceConfigFake,
      update: launchFixtures.updateConfigFake,
    });
    if (output) {
      launchFixtures.getWorkspaceConfigFake = Sinon.fake.returns(output);
      launchFixtures.getConfigInWorkspaceFake = Sinon.fake.returns({
        get: launchFixtures.getWorkspaceConfigFake,
        update: launchFixtures.updateConfigFake,
      });
    }
    Sinon.replace(workspace, 'getConfiguration', launchFixtures.getConfigInWorkspaceFake);
    Sinon.replace(workspace.fs, 'writeFile', Sinon.fake.returns(Promise.resolve()));
  };

  beforeEach(() => {
    launchFixtures.getWorkspaceConfigFake = Sinon.fake.returns(LaunchTestFile);
    launchFixtures.updateConfigFake = Sinon.fake.returns(Promise.resolve());
  });
  afterEach(() => {
    Sinon.restore();
    launchFixtures = {
      getWorkspaceConfigFake: Sinon.fake(),
      updateConfigFake: Sinon.fake(),
      getConfigInWorkspaceFake: Sinon.fake(),
    };
  });

  test('do not overwrite launch config with the same name', async () => {
    setWorkspaceConfigFakeOutput();
    const { getWorkspaceConfigFake, getConfigInWorkspaceFake, updateConfigFake } = launchFixtures;
    const testUri = Uri.file('local');

    await updateLaunch(Uri.file('local'), { ...testMakefileInfo, target: 'othertesttarget' });
    expect(getWorkspaceConfigFake.calledOnce).to.be.true;
    expect(getConfigInWorkspaceFake.calledOnceWith('launch', testUri)).to.be.true;
    expect(updateConfigFake.calledOnce).to.be.false;
  });

  test('add launch config on empty config', async () => {
    setWorkspaceConfigFakeOutput([]);

    const { getWorkspaceConfigFake, updateConfigFake } = launchFixtures;
    const svdResponse: AxiosResponse = {
      data: GithubSVDSResponseFixture,
      status: 200,
      statusText: 'success',
      headers: {},
      config: {} as AxiosRequestConfig,
    };
    const axiosGetStub = Sinon.stub(axios, 'get').resolves(Promise.resolve(svdResponse));
    const h7Response = { ...svdResponse, data: h7SVDResponseFixture };
    axiosGetStub.withArgs(
      'https://raw.githubusercontent.com/posborne/cmsis-svd/master/data/STMicro/STM32H753x.svd'
    ).returns(Promise.resolve(h7Response));

    await updateLaunch(Uri.file('local'), { ...testMakefileInfo, target: 'othertesttarget' });
    expect(axiosGetStub.calledTwice).to.be.true;
    expect(getWorkspaceConfigFake.callCount).to.equal(1);
    expect(getWorkspaceConfigFake.calledOnce).to.be.true;
    expect(updateConfigFake.calledOnce).to.be.true;
    expect(updateConfigFake.getCall(0).args[1].find((task: any) => debugFixture.name === task?.name)).to.deep.equal({
      ...debugFixtureWithSVD,
      executable: "./build/othertesttarget.elf"
    });
    expect(updateConfigFake.getCall(0).args[1].find((task: any) => attachFixture.name === task?.name)).to.deep.equal({
      ...attachFixtureWithSVD,
      executable: "./build/othertesttarget.elf"
    });
  });

  test('adds all new tasks', async () => {
    setWorkspaceConfigFakeOutput([]);
    const { getWorkspaceConfigFake, getConfigInWorkspaceFake, updateConfigFake } = launchFixtures;
    const testUri = Uri.file('local');
    await updateTasks(testUri);
    expect(getWorkspaceConfigFake.calledOnce).to.be.true;
    expect(getConfigInWorkspaceFake.calledOnceWith('tasks', testUri)).to.be.true;
    expect(updateConfigFake.calledOnce).to.be.true;
    expect(updateConfigFake.getCall(0).args[1]).to.deep.equal(BuildTasks);
  });
  test('update tasks when one task is missing', async () => {
    setWorkspaceConfigFakeOutput([BuildTasks[0], BuildTasks[1]]);
    const { getWorkspaceConfigFake, getConfigInWorkspaceFake, updateConfigFake } = launchFixtures;
    const testUri = Uri.file('local');
    await updateTasks(testUri);
    expect(getWorkspaceConfigFake.calledOnce).to.be.true;
    expect(getConfigInWorkspaceFake.calledOnceWith('tasks', testUri)).to.be.true;
    expect(updateConfigFake.calledOnce).to.be.true;
    expect(updateConfigFake.getCall(0).args[1]).to.deep.equal(BuildTasks);
  });
  test('do not add task when similar task is present', async () => {
    const similarTask = { ...BuildTasks[0], device: 'someRandoDevice' };
    setWorkspaceConfigFakeOutput([similarTask, BuildTasks[1], BuildTasks[2]]);
    const { getWorkspaceConfigFake, getConfigInWorkspaceFake, updateConfigFake } = launchFixtures;
    const testUri = Uri.file('local');
    await updateTasks(testUri);
    expect(getWorkspaceConfigFake.calledOnce).to.be.true;
    expect(getConfigInWorkspaceFake.calledOnceWith('tasks', testUri)).to.be.true;
    expect(updateConfigFake.calledOnce).to.be.false;
  });
  test('does nothing when all tasks are present', async () => {
    setWorkspaceConfigFakeOutput([BuildTasks[0], BuildTasks[1], BuildTasks[2]]);
    const { getWorkspaceConfigFake, getConfigInWorkspaceFake, updateConfigFake } = launchFixtures;
    const testUri = Uri.file('local');
    await updateTasks(testUri);
    expect(getWorkspaceConfigFake.calledOnce).to.be.true;
    expect(getConfigInWorkspaceFake.calledOnceWith('tasks', testUri)).to.be.true;
    expect(updateConfigFake.calledOnce).to.be.false;
  });
  test('update configuration completes once everything is done', async () => {
    // setWorkspaceConfigFakeOutput([BuildTasks[0], BuildTasks[1], BuildTasks[2]]);
    // const writeFileInWorkspaceFake = Sinon.fake();
    // const findFileInWorkspaceFake = Sinon.fake.returns(Promise.resolve([]));
    // Sinon.replace(helpers, 'writeFileInWorkspace', writeFileInWorkspaceFake);
    // Sinon.replace(workspace, 'findFiles', findFileInWorkspaceFake);
    // const testUri = Uri.file('local');
    // expect(updateConfiguration(testUri, testMakefileInfo)).to.eventually.be.fulfilled;
    // //
    // try {
    //   await updateConfiguration(testUri, testMakefileInfo);
    // } catch (err) {
    //   if (err) {
    //     assert(err);
    //   }
    // }
  });
});