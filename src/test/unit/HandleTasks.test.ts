import * as Sinon from 'sinon';
import * as chaiAsPromised from 'chai-as-promised';

import { Uri, workspace } from 'vscode';
import { expect, use } from 'chai';
import { suite, test } from 'mocha';

import executeTask from '../../HandleTasks';

use(chaiAsPromised);
suite("Handle Tasks", () => {
  test('test if shell process is executed at workspaceFolder', () => {
    const localUri = Uri.file('./');
    Sinon.replaceGetter(workspace, 'workspaceFolders', () => [{
      uri: localUri,
      name: 'test workspace',
      index: 0,
    }]);
    expect(executeTask('shell', 'test task', ['echo test task'], {})).to.eventually.be.fulfilled;
    Sinon.restore();
  });
  test('test if shell throws error when no workspaceFolder is present', () => {
    Sinon.replaceGetter(workspace, 'workspaceFolders', () => undefined);
    expect(executeTask('shell', 'test task', ['echo test task'], {})).to.eventually.be.rejected;
    Sinon.restore();
  });
  test('test if it rejects when an unexpected exitcode is provided', () => {
    const localUri = Uri.file('./');
    Sinon.replaceGetter(workspace, 'workspaceFolders', () => [{
      uri: localUri,
      name: 'test workspace',
      index: 0,
    }]);
    expect(
      executeTask('shell', 'test task', ['echo test task && exit 1337'], {})
    ).to.eventually.be.rejectedWith('1337');
    Sinon.restore();
  });
});