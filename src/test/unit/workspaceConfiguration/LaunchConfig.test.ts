
import * as Sinon from 'sinon';
import {expect, use} from 'chai';
import * as assert from 'assert';
import { before, test, suite, afterEach, it } from 'mocha';
import getLaunchTask from '../../../workspaceConfiguration/LaunchTasksConfig';
import {testMakefileInfo} from '../../fixtures/testSTMCubeMakefile';
import LaunchTestFile from '../../fixtures/launchTaskFixture';

suite('Launch configuration test', () => {
  test('Returns correct config', () => {
    const res = getLaunchTask(testMakefileInfo);
    expect(res).to.deep.equal(LaunchTestFile);
  });
});
