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
/**
 *
 * Functions to check and get the required tools.
 * Created by Jort Band - Bureau Moeilijke Dingen.
 */

interface BuildToolDefinition {
  name: string;
  standardCmd: string;
  otherCmds: string[];
  folder: boolean;
  missingMessage: string;
  download: {
    standard?: string;
    darwin?: string | null;
    linux?: string | null;
    windows?: string | null;
  };
  brewCmd?: string | null;
  aptGetCmd?: string | null;
  winCmd?: string | null;
  requiredByCortexDebug: boolean;
  configName: string;
}



export const openocdDefinition: BuildToolDefinition = {
  name: 'openOCD',
  standardCmd: 'openocd',
  otherCmds: ['open-ocd'],
  folder: false,
  // eslint-disable-next-line max-len
  missingMessage: 'OpenOCD is missing, please include the path to the openocd executable e.g. usr/bin/openocd, install it, or add it to your PATH variable',
  download: {
    standard: 'http://openocd.org/getting-openocd/',
  },
  brewCmd: 'brew install openocd',
  aptGetCmd: 'apt-get install openocd',
  winCmd: null,
  requiredByCortexDebug: true,
  configName: 'openOCDPath',
};

const makeDefinition: BuildToolDefinition = {
  name: 'make',
  standardCmd: 'make',
  otherCmds: ['gmake'],
  folder: false,
  missingMessage:
    // eslint-disable-next-line max-len
    'Make is missing, please include the path to the make executable e.g. usr/bin/make, install it, or add it to your PATH variable',
  download: {
    darwin: 'https://stackoverflow.com/questions/10265742/how-to-install-make-and-gcc-on-a-mac',
    windows:
      // eslint-disable-next-line max-len
      'https://sourceforge.net/projects/gnuwin32/files/make/3.81/make-3.81.exe/download?use_mirror=datapacket&download=',

  },
  brewCmd: 'brew install make',
  requiredByCortexDebug: false,
  configName: 'makePath',
};

const cmakeDefinition: BuildToolDefinition = {
  name: 'cmake',
  standardCmd: 'cmake',
  otherCmds: [],
  folder: false,
  missingMessage:
    // eslint-disable-next-line max-len
    'cMake is missing, please include the path to the make executable e.g. usr/bin/cMake, install it, or add it to your PATH variable',
  download: {
    standard: 'https://cmake.org/download/',
  },
  brewCmd: 'brew install cmake',
  aptGetCmd: 'sudo apt-get install cmake',
  requiredByCortexDebug: false,
  configName: 'cmakePath',
};

export const armNoneEabiDefinition: BuildToolDefinition = {
  name: 'Arm toolchain',
  standardCmd: 'arm-none-eabi-g++',
  otherCmds: ['arm-none-eabi-g++', 'arm-none-eabi-gcc', 'arm-none-eabi-objcopy', 'arm-none-eabi-size'],
  folder: true,
  missingMessage:
    // eslint-disable-next-line max-len
    'The GNU Arm Embedded toolchain is missing, please include the path to the arm-none-eabi-g++ executable e.g. usr/bin/local/arm-none-eabi/bin, install it, or add the arm-none-eabi tooling to your path variable',
  download: {
    standard:
      // eslint-disable-next-line max-len
      'https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-rm/downloads',
  },
  requiredByCortexDebug: true,
  configName: 'armToolchainPath',
};
