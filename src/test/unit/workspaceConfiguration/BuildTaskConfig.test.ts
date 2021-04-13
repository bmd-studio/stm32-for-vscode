import {expect} from 'chai';
import { test, suite} from 'mocha';
import {getBuildTask, getCleanBuildTask, getFlashTask} from '../../../configuration/BuildTasksConfig';

suite('BuildTaskConfiguration', () => {
  test('check if getters return true', () => {
    // this is more of a definition file so writing a lot of tests would be unnecessary,
    // however it is wise to test for the existence of functions and certain keys,
    // if some refactoring takes place they still will have the required definitions
    const build = getBuildTask();
    const clean = getCleanBuildTask();
    const flash = getFlashTask();
    expect(build).to.have.all.keys('label', 'type', 'command', 'options',  'group','problemMatcher');
    expect(clean).to.have.all.keys('label', 'type', 'command', 'options', 'group','problemMatcher');
    expect(flash).to.have.all.keys('label', 'type', 'command', 'options', 'group','problemMatcher');
    expect(build.options).to.have.keys('cwd');
    expect(clean.options).to.have.keys('cwd');
    expect(flash.options).to.have.keys('cwd');
  });
});