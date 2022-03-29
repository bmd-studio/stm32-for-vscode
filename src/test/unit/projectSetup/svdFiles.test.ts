import { getSVDFileForChip, getSVDFileList } from '../../../projectSetup/svdFiles';

import { expect } from 'chai';

suite('SVD files', () => {
  test('getSVDFileList', async () => {
    const fileList = await getSVDFileList();
    expect(fileList.length).to.be.greaterThan(30);
    const h7Files = fileList.filter(file => file.name.indexOf('H7') !== -1);
    expect(h7Files.length).to.be.greaterThan(10);
  });
  test('getSVDFileForChip', async () => {
    const SVDFile = await getSVDFileForChip('STM32H753');
    expect(SVDFile.data.length).to.be.greaterThan(250);

  });
  test('getSVDFileForChip lowercase', async () => {
    const SVDFileLowerCase = await getSVDFileForChip('STM32H753'.toLowerCase());
    expect(SVDFileLowerCase.data.length).to.be.greaterThan(250);
  });

  test('no SVD file found', async () => {
    expect(getSVDFileForChip('no_chip_found')).to.eventually.Throw();
  });
});

