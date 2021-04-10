import * as Sinon from 'sinon';
import * as shelljs from 'shelljs';

import { after, before, beforeEach, suite } from 'mocha';

suite('Requirements test', () => {
  let shellJSStub: Sinon.SinonStub;
  before(() => {
    shellJSStub = Sinon.stub(shelljs, 'which').returns(null);
    shellJSStub.returns(null);
  });
  beforeEach(() => {
    shellJSStub.returns(null);
  });
  after(() => {
    Sinon.restore();
  });
  // test('checkToolPath does not have tool test', () => {
  //   shellJSStub.returns(null);
  //   expect(checkToolPath(openocdDefinition, '.')).to.be.false;
  //   expect(checkToolPath(openocdDefinition, '/fakepath')).to.be.false;
  // });

  // test('checkToolPath does have tool', () => {
  //   // assert.equal(checkToolPath(fakeCMDDefinition, '.'), false);
  //   shellJSStub.returns('/usr/bin/open-ocd');
  //   // const ocdPath = path.resolve('/usr/bin/open-ocd');
  //   expect(
  //     checkToolPath(openocdDefinition, '/usr/bin/open-ocd')
  //   ).to.equal('/usr/bin/open-ocd');
  //   shellJSStub.returns(null);
  //   let resolvedPath = path.resolve('/usr/bin', 'openocd');
  //   shellJSStub.withArgs(resolvedPath).returns(resolvedPath);
  //   const checkToolPathRes = checkToolPath(openocdDefinition, '/usr/bin/');
  //   expect(checkToolPathRes).to.equal(resolvedPath);

  //   shellJSStub.returns(null);
  //   shellJSStub.withArgs(resolvedPath).returns(null); // reset
  //   resolvedPath = path.resolve('/usr/bin', 'open-ocd');
  //   shellJSStub.withArgs(resolvedPath).returns(resolvedPath);
  //   shellJSStub.withArgs('/usr/bin/open-ocd').returns('/usr/bin/open-ocd');

  //   expect(checkToolPath(openocdDefinition, '/usr/bin/')).to.equal(resolvedPath);
  //   // expect(checkToolPath(openocdDefinition, '/usr/')).to.be.false;
  //   // expect(checkToolPath(openocdDefinition, '/usr/bin/open-ocd')).to.equal('/usr/bin/open-ocd');
  //   shellJSStub.withArgs(resolvedPath).returns(null); // reset
  // });
  // test('checkToolPath does not have folder', () => {
  //   shellJSStub.returns(null);
  //   expect(checkToolPath(armNoneEabiDefinition, '.')).to.be.false;
  //   expect(checkToolPath(armNoneEabiDefinition, './arm-none-eabi-g++')).to.be.false;
  // });

  // // TODO: check folders, resolving the folder makes the whole thing have an absolute path;
  // test('checkToolPath for folder definitions', () => {
  //   shellJSStub.returns(null);
  //   const armNoneEabiPathGPP = path.resolve('usr/bin/arm-none-eabi/arm-none-eabi-g++');
  //   const armNoneEabiPath = path.resolve('usr/bin/arm-none-eabi/');
  //   shellJSStub.withArgs(armNoneEabiPathGPP).returns(armNoneEabiPathGPP);
  //   expect(checkToolPath(armNoneEabiDefinition, './')).to.be.false;
  //   expect(checkToolPath(armNoneEabiDefinition, './bin')).to.equal(false);
  //   expect(checkToolPath(armNoneEabiDefinition, 'usr/more/slashes/to.test/')).to.be.false;

  //   expect(checkToolPath(armNoneEabiDefinition, armNoneEabiPath)).to.equal(armNoneEabiPath);
  //   expect(checkToolPath(armNoneEabiDefinition, armNoneEabiPathGPP)).to.equal(armNoneEabiPath);
  //   shellJSStub.withArgs(armNoneEabiPath).returns(null);
  // });
  // test('checkToolPath has standard cmd', () => {
  // });
});