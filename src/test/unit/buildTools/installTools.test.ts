import * as Sinon from 'sinon';
import * as process from 'process';

import { getLatestNodeLink, getPlatformSpecificNodeLink } from '../../../buildTools/installTools';

import { afterEach } from 'mocha';
import axios from 'axios';
import { expect } from 'chai';
import { latestNodeHTML } from './latestNodeHTML';

suite('install Tools tests', () => {
  afterEach(() => {
    Sinon.restore();
  });
  test('getPlatformSpecificNodeLink', () => {
    expect(getPlatformSpecificNodeLink(latestNodeHTML, 'win32', 'x32')).to.equal("node-v15.0.1-win-x86.zip");
    expect(getPlatformSpecificNodeLink(latestNodeHTML, 'win32', 'x64')).to.equal("node-v15.0.1-win-x64.zip");
    expect(getPlatformSpecificNodeLink(latestNodeHTML, 'darwin', 'x64')).to.equal("node-v15.0.1-darwin-x64.tar.gz");
    expect(getPlatformSpecificNodeLink(latestNodeHTML, 'darwin', 'x32')).to.equal(undefined);
    expect(getPlatformSpecificNodeLink(latestNodeHTML, 'linux', 'x64')).to.equal("node-v15.0.1-linux-x64.tar.gz");
    expect(getPlatformSpecificNodeLink(latestNodeHTML, 'linux', 'arm')).to.equal("node-v15.0.1-linux-armv7l.tar.gz");
    expect(getPlatformSpecificNodeLink(latestNodeHTML, 'linux', 'arm64')).to.equal("node-v15.0.1-linux-arm64.tar.gz");
  });

  // test('getLatestNodeLink good html response', () => {
  //   const fakeAxios = Sinon.fake.returns(Promise.resolve(latestNodeHTML));
  //   Sinon.replace(axios, 'get', fakeAxios);
  //   expect(getLatestNodeLink()).to.eventually.equal(
  //     getPlatformSpecificNodeLink(latestNodeHTML, process.platform, process.arch)
  //   );
  // });
  // test('getLatestNodeLink empty html response', () => {
  //   const fakeAxios = Sinon.fake.returns(Promise.resolve(''));
  //   Sinon.replace(axios, 'get', fakeAxios);
  //   expect(getLatestNodeLink()).to.eventually.be.rejected;
  // });
  // test('getLatestNodeLink rejected html response', () => {
  //   const fakeAxios = Sinon.fake.returns(Promise.reject(new Error('')));
  //   Sinon.replace(axios, 'get', fakeAxios);
  //   expect(getLatestNodeLink()).to.eventually.be.rejected;
  // });

});

