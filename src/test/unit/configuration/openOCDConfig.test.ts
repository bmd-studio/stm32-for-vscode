import * as Helpers from '../../../Helpers';
import * as OpenOCDConfig from '../../../configuration/openOCDConfig';
import * as Sinon from 'sinon';
import * as vscode from 'vscode';

import { afterEach, suite, test } from 'mocha';

import { OpenOCDConfiguration } from '../../../types';
import { expect } from 'chai';

suite('OpenOCD Configuration', () => {
  afterEach(() => {
    Sinon.restore();
  });
  test('create configuration when none exist', async () => {
    const readFake = Sinon.fake.returns(new Promise(() => {
      throw vscode.FileSystemError.FileNotFound();
    }));
    const writeFake = Sinon.fake.returns(Promise.resolve());
    const WorkspaceFake = Sinon.fake.returns(vscode.Uri.file('local'));
    Sinon.replace(vscode.workspace.fs, 'readFile', readFake);
    Sinon.replace(Helpers, 'writeFileInWorkspace', writeFake);
    Sinon.replace(Helpers, 'getWorkspaceUri', WorkspaceFake);
    const config = new OpenOCDConfiguration('STM32LTest');
    await OpenOCDConfig.readOrCreateConfigFile(config);
    expect(readFake.calledOnce).to.be.true;
    expect(writeFake.calledOnce).to.be.true;
    expect(writeFake.getCall(0).args[1]).to.deep.equal('openocd.cfg');
    expect(writeFake.getCall(0).lastArg).to.deep.equal(OpenOCDConfig.create(config));
  });
  test('do nothing when config exists', () => {
    const readFake = Sinon.fake.returns(Promise.resolve('somefile'));
    const writeFake = Sinon.fake.returns(Promise.resolve());
    const WorkspaceFake = Sinon.fake.returns(vscode.Uri.file('local'));
    Sinon.replace(vscode.workspace.fs, 'readFile', readFake);
    Sinon.replace(vscode.workspace.fs, 'writeFile', writeFake);
    Sinon.replace(Helpers, 'getWorkspaceUri', WorkspaceFake);
    const config = new OpenOCDConfiguration('STM32LTest');
    OpenOCDConfig.readOrCreateConfigFile(config);
    expect(readFake.calledOnce).to.be.true;
    expect(writeFake.notCalled).to.be.true;
    // expect(writeFake.args[2]).to.deep.equal(OpenOCDConfig.create(config));
  });
  test('change programmer', async () => {
    const readFake = Sinon.fake.returns(
      Promise.resolve(
        Buffer.from(
          OpenOCDConfig.create(
            new OpenOCDConfiguration('STM32LTest')
          )
        )
      )
    );
    const writeFake = Sinon.fake.returns(Promise.resolve());
    const WorkspaceFake = Sinon.fake.returns(vscode.Uri.file('local'));
    Sinon.replace(vscode.workspace.fs, 'readFile', readFake);
    Sinon.replace(Helpers, 'writeFileInWorkspace', writeFake);
    Sinon.replace(Helpers, 'getWorkspaceUri', WorkspaceFake);
    await OpenOCDConfig.changeProgrammer('testProgrammer');

    const testProgrammerConfig = new OpenOCDConfiguration('STM32LTest');
    testProgrammerConfig.interface = 'testProgrammer';

    expect(readFake.calledOnce).to.be.true;
    expect(writeFake.calledOnce).to.be.true;
    expect(writeFake.lastCall.lastArg).to.deep.equal((OpenOCDConfig.create(testProgrammerConfig)));

  });
});