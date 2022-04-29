import * as Sinon from 'sinon';

import {afterEach, beforeEach} from 'mocha';
import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import { getSVDFileForChip, getSVDFileList } from '../../../projectSetup/svdFiles';

import GithubSVDSResponseFixture from './githubSVDResponseFixture';
import { expect } from 'chai';
import h7SVDResponseFixture from './githubSVDResponseFixture';

suite('SVD files', () => {
  const svdResponse: AxiosResponse = {
    data: GithubSVDSResponseFixture,
    status: 200,
    statusText: 'success',
    headers: {},
    config: {} as AxiosRequestConfig,
  };
  beforeEach(() => {
    
   
  });
  afterEach(() => {
    Sinon.restore();
  });
  test('getSVDFileList', async () => {
    const axiosGetStub = Sinon.stub(axios, 'get').resolves(Promise.resolve(svdResponse));
    const fileList = await getSVDFileList();
    expect(fileList.length).to.be.greaterThan(30);
    const h7Files = fileList.filter(file => file.name.indexOf('H7') !== -1);
    expect(h7Files.length).to.be.greaterThan(10);
    expect(axiosGetStub.calledOnce).to.be.true;
  });
  test('getSVDFileForChip', async () => {
    const axiosGetStub = Sinon.stub(axios, 'get').resolves(Promise.resolve(svdResponse));
    const h7Response = {...svdResponse, data: h7SVDResponseFixture};
    axiosGetStub.withArgs(
      'https://raw.githubusercontent.com/posborne/cmsis-svd/master/data/STMicro/STM32H753x.svd'
    ).returns(Promise.resolve(h7Response));
    const svdFile = await getSVDFileForChip('STM32H753');
    expect(svdFile.data).to.equal(h7SVDResponseFixture);

  });
  test('getSVDFileForChip lowercase', async () => {
    const axiosGetStub = Sinon.stub(axios, 'get').resolves(Promise.resolve(svdResponse));
    const h7Response = {...svdResponse, data: h7SVDResponseFixture};
    axiosGetStub.withArgs(
      'https://raw.githubusercontent.com/posborne/cmsis-svd/master/data/STMicro/STM32H753x.svd'
    ).returns(Promise.resolve(h7Response));
    const svdFileLowerCase = await getSVDFileForChip('STM32H753'.toLowerCase());
    expect(svdFileLowerCase.data).to.equal(h7SVDResponseFixture);
  });

  test('no SVD file found', async () => {
    const axiosGetStub = Sinon.stub(axios, 'get').resolves(Promise.resolve(svdResponse));
    expect(getSVDFileForChip('no_chip_found')).to.eventually.Throw();
  });
});

