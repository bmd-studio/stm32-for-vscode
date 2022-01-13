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
  test('errorOnNoWorkspace', async () => {
    let workspaceFoldersToReAdd: WorkspaceFolder[] | null = null;
    if (workspace.workspaceFolders && workspace.workspaceFolders.length > 0) {
      workspaceFoldersToReAdd = workspace.workspaceFolders.map((entry) => (entry));
      console.log('workspaceFolders', workspace.workspaceFolders);
      if (workspace.updateWorkspaceFolders(0, workspace.workspaceFolders.length)) {
        await waitForWorkspaceFoldersChange();
      } else {
        throw Error('something went wrong with updating the workspace folders');
      }
    }

    expect(buildSTM({})).to.eventually.be.rejected;
    expect(buildSTM({ cleanBuild: true })).to.be.rejected;
    expect(buildSTM({ flash: true })).to.be.rejected;
    expect(buildSTM({ flash: true, cleanBuild: true })).to.be.rejected;

    if (workspaceFoldersToReAdd && workspaceFoldersToReAdd.length > 0) {
      workspaceFoldersToReAdd.forEach(async (entry) => {
        workspace.updateWorkspaceFolders(0, null, entry);
        await waitForWorkspaceFoldersChange();
      });
    }
  });

});