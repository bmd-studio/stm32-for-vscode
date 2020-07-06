
import { expect } from 'chai';
import { test, suite } from 'mocha';
import getLaunchTask from '../../../workspaceConfiguration/LaunchTasksConfig';
import { testMakefileInfo } from '../../fixtures/testSTMCubeMakefile';
import LaunchTestFile from '../../fixtures/launchTaskFixture';

suite('Launch configuration test', () => {
  test('Returns correct config', () => {
    const res = getLaunchTask(testMakefileInfo);
    expect(res).to.deep.equal(LaunchTestFile);
  });
});
