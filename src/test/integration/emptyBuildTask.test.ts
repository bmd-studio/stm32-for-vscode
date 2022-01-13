import buildSTM from '../../BuildTask';
import * as Sinon from 'sinon';
import { expect, use } from 'chai';
import { test, suite, afterEach } from 'mocha';
import { workspace, WorkspaceFolder, window } from 'vscode';
import * as chaiAsPromised from 'chai-as-promised';
import { waitForWorkspaceFoldersChange } from '../helpers';
use(chaiAsPromised);


//TODO: this should also be tested in an integration test.
suite('MakefileInfoTest', () => {
  afterEach(() => {
    Sinon.restore();
  });
  beforeEach(() => {
    waitForWorkspaceFoldersChange();
  });
  test('errorOnNoWorkspace', async () => {

    if (!workspace.workspaceFolders || workspace.workspaceFolders.length === 0) {
      expect(buildSTM({})).to.eventually.be.rejected;
      expect(buildSTM({ cleanBuild: true })).to.be.rejected;
      expect(buildSTM({ flash: true })).to.be.rejected;
      expect(buildSTM({ flash: true, cleanBuild: true })).to.be.rejected;
    }
  }).timeout(5000);

});