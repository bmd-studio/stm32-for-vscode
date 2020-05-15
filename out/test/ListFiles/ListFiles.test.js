"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.totalList = void 0;

var _assert = _interopRequireDefault(require("assert"));

var _mocha = require("mocha");

var _ListFiles = require("../../src/ListFiles");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
* MIT License
*
* Copyright (c) 2020 Bureau Moeilijke Dingen
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
*/
// TODO: perhaps also test the total ListFiles flow, however this means looking into mocking
var goodTestDir = ['Src', 'Inc', 'lib', 'Drivers', 'Middlewares'];
var fileList = ['Src/main.cpp', 'Src/RandomDriver.cpp', 'Src/stm32h7xx_it.c', 'Src/stm32h7xx_hal_msp.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_cortex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_eth.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_eth_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_tim.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_tim_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_uart.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_uart_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pcd.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pcd_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_ll_usb.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_rcc.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_rcc_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_flash.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_flash_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_gpio.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_hsem.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_dma.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_dma_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_mdma.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pwr.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pwr_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_i2c.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_i2c_ex.c', 'Src/system_stm32h7xx.c', 'Src/stm32h7xx_it.h', 'Src/stm32h7xx_hal_msp.h', 'Inc/RandomDriver.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_cortex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_eth.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_eth_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_tim.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_tim_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_uart.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_uart_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_pcd.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_pcd_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_ll_usb.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_rcc.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_rcc_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_flash.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_flash_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_gpio.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_hsem.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_dma.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_dma_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_mdma.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_pwr.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_pwr_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_i2c.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_i2c_ex.h', 'Inc/system_stm32h7xx.h', 'startup_stm32h743xx.s'];
var headerFiles = ['Inc/RandomDriver.h', 'Src/stm32h7xx_it.h', 'Src/stm32h7xx_hal_msp.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_cortex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_eth.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_eth_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_tim.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_tim_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_uart.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_uart_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_pcd.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_pcd_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_ll_usb.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_rcc.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_rcc_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_flash.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_flash_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_gpio.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_hsem.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_dma.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_dma_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_mdma.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_pwr.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_pwr_ex.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_i2c.h', 'Drivers/STM32H7xx_HAL_Driver/Inc/stm32h7xx_hal_i2c_ex.h', 'Inc/system_stm32h7xx.h'];
var asmFiles = ['startup_stm32h743xx.s'];
var cFiles = ['Src/stm32h7xx_it.c', 'Src/stm32h7xx_hal_msp.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_cortex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_eth.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_eth_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_tim.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_tim_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_uart.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_uart_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pcd.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pcd_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_ll_usb.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_rcc.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_rcc_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_flash.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_flash_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_gpio.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_hsem.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_dma.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_dma_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_mdma.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pwr.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_pwr_ex.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_i2c.c', 'Drivers/STM32H7xx_HAL_Driver/Src/stm32h7xx_hal_i2c_ex.c', 'Src/system_stm32h7xx.c'];
var cxxFiles = ['Src/main.cpp', 'Src/RandomDriver.cpp'];
var cIncludes = ['-IInc', '-ISrc', '-IDrivers/STM32H7xx_HAL_Driver/Inc'];
var totalList = {
  cFiles: cFiles.sort(),
  headerFiles: headerFiles.sort(),
  cxxFiles: cxxFiles.sort(),
  asmFiles: asmFiles.sort()
};
exports.totalList = totalList;
(0, _mocha.suite)('ListFiles test', function () {
  (0, _mocha.before)(function () {});
  (0, _mocha.test)('getDirCaseFree', function () {
    _assert["default"].equal((0, _ListFiles.getDirCaseFree)('noneExtistent', goodTestDir), null);

    _assert["default"].equal((0, _ListFiles.getDirCaseFree)('src', goodTestDir), 'Src');

    _assert["default"].equal((0, _ListFiles.getDirCaseFree)('Inc', goodTestDir), 'Inc');

    _assert["default"].equal((0, _ListFiles.getDirCaseFree)('Lib', goodTestDir), 'lib');
  });
  (0, _mocha.test)('sortFiles', function () {
    _assert["default"].deepEqual((0, _ListFiles.sortFiles)({}, fileList), totalList);
  });
  (0, _mocha.test)('getIncludes', function () {
    _assert["default"].deepEqual((0, _ListFiles.getIncludes)(headerFiles), cIncludes.sort());
  });
});