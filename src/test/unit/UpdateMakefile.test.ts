import * as Sinon from 'sinon';
import * as chaiAsPromised from 'chai-as-promised';

import { Uri, workspace } from 'vscode';
import { afterEach, suite, test } from 'mocha';
import { expect, use } from 'chai';
import { getCurrentMakefile, writeMakefile } from '../../UpdateMakefile';

const fs = workspace.fs;
use(chaiAsPromised);
suite('Update makefile', () => {
  afterEach(() => {
    Sinon.restore();
  });
  test('get current makefile with existing file', () => {
    const testString = 'hello';
    const testUInt8Arr = Uint8Array.from(Buffer.from(testString));
    const workspaceFSReadFileFake = Sinon.fake.returns(Promise.resolve(testUInt8Arr));
    Sinon.replace(fs, 'readFile', workspaceFSReadFileFake);
    const makefilePath = './Makefile';
    expect(getCurrentMakefile(makefilePath)).to.eventually.equal(testString);
    expect(workspaceFSReadFileFake.calledOnceWith(Uri.file(makefilePath))).to.be.true;
  });
  test('get current makefile without existing file', () => {
    const testUInt8Arr = new Uint8Array(0);
    const workspaceFSReadFileFake = Sinon.fake.returns(Promise.resolve(testUInt8Arr));
    Sinon.replace(fs, 'readFile', workspaceFSReadFileFake);
    const makefilePath = './Makefile';
    expect(getCurrentMakefile(makefilePath)).to.eventually.be.rejected;
    expect(workspaceFSReadFileFake.calledOnceWith(Uri.file(makefilePath))).to.be.true;
  });
});