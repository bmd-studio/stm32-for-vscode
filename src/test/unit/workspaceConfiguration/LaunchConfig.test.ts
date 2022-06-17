import { suite, test } from 'mocha';

import {debugFixture} from '../../fixtures/launchTaskFixture';
import { expect } from 'chai';
import getLaunchTask from '../../../configuration/LaunchTasksConfig';
import { testMakefileInfo } from '../../fixtures/testSTMCubeMakefile';

suite('Launch configuration test', () => {
  test('Returns correct config', () => {
    const res = getLaunchTask(testMakefileInfo);
    expect(res).to.deep.equal(debugFixture);
  });
});
