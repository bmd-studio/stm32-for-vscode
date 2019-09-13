"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.makefileInfoTest = exports.makefileInfoTemplate = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _mocha = require("mocha");

var _MakefileInfo = require("../../src/MakefileInfo");

var _TestMakefile = _interopRequireDefault(require("./TestMakefile"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// import vscode from 'vscode';
// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
// const myExtension = require('../extension');
var cSources = ['Src/main.c', 'Src/stm32h7xx_it.c', 'Src/stm32h7xx_hal_msp.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_cortex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_eth.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_eth_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_tim.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_tim_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_uart.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_uart_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pcd.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pcd_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_ll_usb.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_rcc.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_rcc_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_flash.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_flash_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_gpio.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_hsem.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_dma.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_dma_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_mdma.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pwr.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pwr_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_i2c.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_i2c_ex.c', 'Src/system_stm32h7xx.c'];
var cDefs = ['-DUSE_HAL_DRIVER', '-DSTM32H743xx', '-DUSE_HAL_DRIVER', '-DSTM32H743xx'];
var cIncludes = ['-IInc', '-IDrivers/STM32H7xx_HAL_Driver/Inc', '-IDrivers/STM32H7xx_HAL_Driver/Inc/Legacy', '-IDrivers/CMSIS/Device/ST/STM32H7xx/Include', '-IDrivers/CMSIS/Include', '-IDrivers/CMSIS/Include'];
var asmSources = ['startup_stm32h743xx.s'];
var floatAbi = '-mfloat-abi=hard';
var fpu = '-mfpu=fpv5-d16';
var makefileInfoTemplate = {
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
  asIncludes: []
};
exports.makefileInfoTemplate = makefileInfoTemplate;
var makefileInfoTest = {
  target: 'Clean_project_h7',
  cpu: '-mcpu=cortex-m7',
  targetMCU: 'stm32h7x',
  fpu: fpu,
  floatAbi: floatAbi,
  mcu: '$(CPU) -mthumb $(FPU) $(FLOAT-ABI)',
  ldscript: 'STM32H743ZITx_FLASH.ld',
  cSources: cSources,
  cxxSources: [],
  asmSources: asmSources,
  cDefs: cDefs,
  cxxDefs: [],
  asDefs: [],
  cIncludes: cIncludes,
  cxxIncludes: [],
  asIncludes: []
};
exports.makefileInfoTest = makefileInfoTest;
(0, _mocha.suite)('MakefileInfoTest', function () {
  // before(() => {
  //   vscode.window.showInformationMessage('Start all tests.');
  // });
  (0, _mocha.before)(function () {});
  (0, _mocha.test)('extractSingleLineInfo', function () {
    // assert.
    _assert["default"].equal((0, _MakefileInfo.extractSingleLineInfo)('target', _TestMakefile["default"]), 'Clean_project_h7');

    _assert["default"].equal((0, _MakefileInfo.extractSingleLineInfo)('C_SOURCES', _TestMakefile["default"]), ' \\');

    _assert["default"].equal((0, _MakefileInfo.extractSingleLineInfo)('PREFIX', _TestMakefile["default"]), 'arm-none-eabi-');

    _assert["default"].equal((0, _MakefileInfo.extractSingleLineInfo)('CPU', _TestMakefile["default"]), '-mcpu=cortex-m7');

    _assert["default"].equal((0, _MakefileInfo.extractSingleLineInfo)('LIBS', _TestMakefile["default"]), '-lc -lm -lnosys');
  });
  (0, _mocha.test)('extractMultiLineInfo', function () {
    _assert["default"].deepEqual((0, _MakefileInfo.extractMultiLineInfo)('C_DEFS', _TestMakefile["default"]), ['-DUSE_HAL_DRIVER', '-DSTM32H743xx', '-DUSE_HAL_DRIVER', '-DSTM32H743xx']);

    _assert["default"].deepEqual((0, _MakefileInfo.extractMultiLineInfo)('c_sources', _TestMakefile["default"]), cSources);
  });
  (0, _mocha.test)('extractMakefileInfo', function () {
    _assert["default"].deepEqual((0, _MakefileInfo.extractMakefileInfo)({
      cSources: []
    }, _TestMakefile["default"]), {
      cSources: cSources
    });

    _assert["default"].deepEqual((0, _MakefileInfo.extractMakefileInfo)({
      asmSources: []
    }, _TestMakefile["default"]), {
      asmSources: asmSources
    });

    _assert["default"].deepEqual((0, _MakefileInfo.extractMakefileInfo)({
      floatAbi: ''
    }, _TestMakefile["default"]), {
      floatAbi: floatAbi
    });

    _assert["default"].deepEqual((0, _MakefileInfo.extractMakefileInfo)({
      fpu: ''
    }, _TestMakefile["default"]), {
      fpu: fpu
    });

    _assert["default"].deepEqual((0, _MakefileInfo.extractMakefileInfo)({
      nonesense: ''
    }, _TestMakefile["default"]), {
      nonesense: ''
    });

    _assert["default"].deepEqual((0, _MakefileInfo.extractMakefileInfo)({
      noneSense: ''
    }, _TestMakefile["default"]), {
      noneSense: ''
    });
  });
  (0, _mocha.test)('getTargetSTM', function () {
    _assert["default"].deepEqual((0, _MakefileInfo.getTargetSTM)(cSources), 'stm32h7x');
  });
});