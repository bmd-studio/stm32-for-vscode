import { ToolChain } from '../../../types/MakeInfo';
import { afterEach } from 'mocha';
import { expect } from 'chai';
import { getPlatformSpecificNodeLink } from '../../../buildTools/installTools';
import { latestNodeHTML } from './latestNodeHTML';

suite('install Tools tests', () => {
  test('getPlatformSpecificNodeLink', () => {
    expect(getPlatformSpecificNodeLink(latestNodeHTML, 'win32', 'x32')).to.equal("node-v15.0.1-win-x86.zip");
    expect(getPlatformSpecificNodeLink(latestNodeHTML, 'win32', 'x64')).to.equal("node-v15.0.1-win-x64.zip");
    expect(getPlatformSpecificNodeLink(latestNodeHTML, 'darwin', 'x64')).to.equal("node-v15.0.1-darwin-x64.tar.gz");
    expect(getPlatformSpecificNodeLink(latestNodeHTML, 'darwin', 'x32')).to.equal(null);
    expect(getPlatformSpecificNodeLink(latestNodeHTML, 'linux', 'x64')).to.equal("node-v15.0.1-linux-x64.tar.gz");
    expect(getPlatformSpecificNodeLink(latestNodeHTML, 'linux', 'arm')).to.equal("node-v15.0.1-linux-armv7l.tar.gz");
    expect(getPlatformSpecificNodeLink(latestNodeHTML, 'linux', 'arm64')).to.equal("node-v15.0.1-linux-arm64.tar.gz");
  });
});