import assert from 'assert';
import { before, test, suite } from 'mocha';
import getOpenOcdTarget from '../../src/OpenOcdTargetFiles';

suite('Open OCD target test', () => {
  before(() => {
  });
  test('Test regular targets', () => {
    assert.equal(getOpenOcdTarget('stm32h7x'), 'stm32h7x.cfg');
    assert.equal(getOpenOcdTarget('stm32l0x'), 'stm32l0.cfg');
    assert.equal(getOpenOcdTarget('stm32l4x'), 'stm32l4x.cfg');
    assert.equal(getOpenOcdTarget('stm32f4x'), 'stm32f4x.cfg');
  });
  test('Test false targets', () => {
    assert.equal(getOpenOcdTarget('avr32'), false);
    assert.equal(getOpenOcdTarget('microchip'), false);
    assert.equal(getOpenOcdTarget('avr8'), false);
  });
});
