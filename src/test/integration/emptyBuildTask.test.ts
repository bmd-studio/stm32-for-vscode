import * as Sinon from 'sinon';
import chaiAsPromised from 'chai-as-promised';

import { afterEach, beforeEach, suite, test } from 'mocha';
import { expect, use } from 'chai';

import buildSTM from '../../BuildTask';
import { waitForWorkspaceFoldersChange, getContext } from '../helpers';
import { workspace } from 'vscode';


use(chaiAsPromised);

const extensionContext = getContext();

//TODO: this should also be tested in an integration test.
suite('MakefileInfoTest', () => {
  afterEach(() => {
    Sinon.restore();
  });
  beforeEach(() => {
    waitForWorkspaceFoldersChange();
  });
  test('errorOnNoWorkspace', async () => {

    if (!workspace.workspaceFolders || workspace?.workspaceFolders?.length === 0) {
      expect(buildSTM(extensionContext, {})).to.eventually.be.rejected;
      expect(buildSTM(extensionContext, { cleanBuild: true })).to.be.rejected;
      expect(buildSTM(extensionContext, { flash: true })).to.be.rejected;
      expect(buildSTM(extensionContext, { flash: true, cleanBuild: true })).to.be.rejected;
    }
  }).timeout(5000);

});
