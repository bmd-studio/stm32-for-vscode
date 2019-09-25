import assert from 'assert';
import { before, test, suite } from 'mocha';
import {
  extractMultiLineInfo, extractSingleLineInfo, extractMakefileInfo, getTargetSTM,
} from '../../src/MakefileInfo';
import testMakefile from './TestMakefile';


// import vscode from 'vscode';
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// const myExtension = require('../extension');
const cSources = [
  'Src/main.c',
  'Src/stm32h7xx_it.c',
  'Src/stm32h7xx_hal_msp.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_cortex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_eth.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_eth_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_tim.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_tim_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_uart.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_uart_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pcd.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pcd_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_ll_usb.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_rcc.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_rcc_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_flash.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_flash_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_gpio.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_hsem.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_dma.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_dma_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_mdma.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pwr.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pwr_ex.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_i2c.c',
  'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_i2c_ex.c',
  'Src/system_stm32h7xx.c',
];
const cDefs = ['-DUSE_HAL_DRIVER', '-DSTM32H743xx', '-DUSE_HAL_DRIVER', '-DSTM32H743xx'];
const cIncludes = [
  '-IInc',
  '-IDrivers/STM32H7xx_HAL_Driver/Inc',
  '-IDrivers/STM32H7xx_HAL_Driver/Inc/Legacy',
  '-IDrivers/CMSIS/Device/ST/STM32H7xx/Include',
  '-IDrivers/CMSIS/Include',
  '-IDrivers/CMSIS/Include',
];

const asmSources = ['startup_stm32h743xx.s'];
const floatAbi = '-mfloat-abi=hard';
const fpu = '-mfpu=fpv5-d16';

export const makefileInfoTemplate = {
  target: '',
  cpu: '',
  targetMCU: '',
  fpu: '',
  floatAbi: '',
  mcu: '',
  ldscript: '',
  cSources: [],
  cxxSources: [],
  asmSources: [],
  cDefs: [],
  cxxDefs: [],
  asDefs: [],
  cIncludes: [],
  cxxIncludes: [],
  asIncludes: [],
};

export const makefileInfoTest = {
  target: 'Clean_project_h7',
  cpu: '-mcpu=cortex-m7',
  targetMCU: 'stm32h7x',
  fpu,
  floatAbi,
  mcu: '$(CPU) -mthumb $(FPU) $(FLOAT-ABI)',
  ldscript: 'STM32H743ZITx_FLASH.ld',
  cSources,
  cxxSources: [],
  asmSources,
  cDefs,
  cxxDefs: [],
  asDefs: [],
  cIncludes,
  cxxIncludes: [],
  asIncludes: [],
};

suite('MakefileInfoTest', () => {
  // before(() => {
  //   vscode.window.showInformationMessage('Start all tests.');
  // });
  before(() => {
  });
  test('extractSingleLineInfo', () => {
    // assert.
    assert.equal(extractSingleLineInfo('target', testMakefile), 'Clean_project_h7');
    assert.equal(extractSingleLineInfo('C_SOURCES', testMakefile), ' \\');
    assert.equal(extractSingleLineInfo('PREFIX', testMakefile), 'arm-none-eabi-');
    assert.equal(extractSingleLineInfo('CPU', testMakefile), '-mcpu=cortex-m7');
    assert.equal(extractSingleLineInfo('LIBS', testMakefile), '-lc -lm -lnosys');
  });
  test('extractMultiLineInfo', () => {
    assert.deepEqual(extractMultiLineInfo('C_DEFS', testMakefile), ['-DUSE_HAL_DRIVER', '-DSTM32H743xx', '-DUSE_HAL_DRIVER', '-DSTM32H743xx']);
    assert.deepEqual(extractMultiLineInfo('c_sources', testMakefile), cSources);
    assert.deepEqual(extractMultiLineInfo('target', testMakefile), []);
  });
  test('extractMakefileInfo', () => {
    assert.deepEqual(extractMakefileInfo({ cSources: [] }, testMakefile), { cSources });
    assert.deepEqual(extractMakefileInfo({ asmSources: [] }, testMakefile), { asmSources });
    assert.deepEqual(extractMakefileInfo({ floatAbi: '' }, testMakefile), { floatAbi });
    assert.deepEqual(extractMakefileInfo({ fpu: '' }, testMakefile), { fpu });
    assert.deepEqual(extractMakefileInfo({ nonesense: '' }, testMakefile), { nonesense: '' });
    assert.deepEqual(extractMakefileInfo({ noneSense: '' }, testMakefile), { noneSense: '' });
  });
  test('getTargetSTM', () => {
    assert.deepEqual(getTargetSTM(cSources), 'stm32h7x');
  });
});
