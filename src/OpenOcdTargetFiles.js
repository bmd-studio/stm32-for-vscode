import fs from 'fs';
import _ from 'lodash';

const configFiles = [
  'stm32f0x.cfg', 'stm32f0x_stlink.cfg',
  'stm32f1x.cfg', 'stm32f1x_stlink.cfg',
  'stm32f2x.cfg', 'stm32f2x_stlink.cfg',
  'stm32f3x.cfg', 'stm32f3x_stlink.cfg',
  'stm32f4x.cfg', 'stm32f4x_stlink.cfg',
  'stm32f7x.cfg', 'stm32h7x.cfg',
  'stm32h7x_dual_bank.cfg', 'stm32l0.cfg',
  'stm32l0_dual_bank.cfg', 'stm32l1.cfg',
  'stm32l1x_dual_bank.cfg', 'stm32l4x.cfg',
  'stm32lx_stlink.cfg', 'stm32w108xx.cfg',
  'stm32w108_stlink.cfg', 'stm32xl.cfg',
  'stm32_stlink.cfg',
];

export default function getTargetConfig(target) {
  const cleanTarget = _.toLower(
    _.trimEnd(
      _.trimEnd(target, 'cfg'),
      'x',
    ),
  );
  const ind = _.findIndex(
    configFiles, entry => (_.toLower(entry).indexOf(cleanTarget) >= 0),
  );
  if (ind >= 0) {
    return configFiles[ind];
  }
  return false;
}

// TODO: add config path to opencod.
// TODO: add STM32G0 stuff to assets dir
