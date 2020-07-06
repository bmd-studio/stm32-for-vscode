import buildSTM from '../../BuildTask';
import * as Sinon from 'sinon';
import { expect, use } from 'chai';
import { test, suite, afterEach } from 'mocha';
import { workspace, WorkspaceFolder, window } from 'vscode';
import * as chaiAsPromised from 'chai-as-promised';
use(chaiAsPromised);


//TODO: this should also be tested in an integration test.
suite('MakefileInfoTest', () => {
  afterEach(() => {
    Sinon.restore();
  });
  test('errorOnNoWorkspace', () => {
    let workspaceFoldersToReAdd: WorkspaceFolder[] | null = null;
    if (workspace.workspaceFolders) {
      workspaceFoldersToReAdd = workspace.workspaceFolders;
      workspace.updateWorkspaceFolders(0, workspace.workspaceFolders.length);
    }
    const errorMsg = Sinon.fake();
    Sinon.replace(window, 'showErrorMessage', errorMsg);

    expect(buildSTM({})).to.eventually.be.rejected;
    expect(buildSTM({ cleanBuild: true })).to.be.rejected;
    expect(buildSTM({ flash: true })).to.be.rejected;
    expect(buildSTM({ flash: true, cleanBuild: true })).to.be.rejected;

    expect(errorMsg.callCount).to.equal(4);
    if (workspaceFoldersToReAdd) {
      workspaceFoldersToReAdd.forEach((entry) => {
        workspace.updateWorkspaceFolders(0, null, entry);
      });
    }
  });

});