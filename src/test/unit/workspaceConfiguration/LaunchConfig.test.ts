import { suite, test } from 'mocha';

import { expect } from 'chai';
import { debugFixture } from '../../fixtures/launchTaskFixture';
import getLaunchTask from '../../../configuration/LaunchTasksConfig';
import { testMakefileInfo } from '../../fixtures/testSTMCubeMakefile';

suite('Launch configuration test', () => {
  test('Returns correct config', () => {
    const res = getLaunchTask(testMakefileInfo);
    expect(res).to.deep.equal(debugFixture);
  });
});
