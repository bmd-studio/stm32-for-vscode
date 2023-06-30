/* eslint-disable max-len */
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

/*
 * Set of functions for creating a makefile based on STM32
 * makefile info and the Src, Inc and Lib folders
 * Created by Jort Band - Bureau Moeilijke Dingen
*/

import 'process';

import { isEmpty, isString, uniq } from 'lodash';

import MakeInfo from './types/MakeInfo';
import { fsPathToPosix } from './Helpers';
import { STM32_ENVIRONMENT_VARIABLE_NAME, makefileName, stm32EnvironmentFile } from './Definitions';


/**
 * @description formats an array of string into one string with line endings per array entry.
 * @param {string[]} arr
 */
export function createStringList(arr: string[], prefix?: string): string {
  let output = '';
  const sortedArray = uniq(arr).sort();
  sortedArray.map((entry: string, ind: number) => {
    if (prefix) {
      output += prefix;
    }
    output += `${entry}`;
    if (ind < sortedArray.length - 1) {
      output += ' \\';
    }
    output += '\n';
  });

  return output;
}

/**
 * @description formats an array of strings into one string with spaces between entries.
 * @param {string[]} arr
 */
export function createSingleLineStringList(arr: string[], prefix?: string): string {
  let output = '';
  const sortedArray = uniq(arr).sort();
  sortedArray.map((entry) => {
    if (prefix) {
      output += prefix;
    }
    output += `${entry} `;
  });
  return output;
}

export function createGCCPathOutput(makeInfo: MakeInfo): string {
  if (makeInfo.tools.armToolchainPath && isString(makeInfo.tools.armToolchainPath)) {
    if (makeInfo?.tools?.armToolchainPath && !isEmpty(makeInfo.tools.armToolchainPath) && makeInfo.tools.armToolchainPath !== '.') {
      return `GCC_PATH="${fsPathToPosix(makeInfo.tools.armToolchainPath)}`;
    }
  }
  return '';
}
/**
 * Gives a prefix to an input string and checks if it already exists. If the input is empty the prefix is not added.
 */
function createPrefixWhenNoneExists(input: string, prefix: string): string {
  if (!input || input.length === 0) {
    return '';
  }
  if (input.indexOf(prefix) >= 0) {
    return input;
  }
  return `${prefix}${input}`;
}

/**
 * Create a string with compatible makefile rules.
 * @param makeInfo makeInfo
 * @returns a string containing custom makefile rules which can be embedded in the makefile
 */
function customMakefileRules(makeInfo: MakeInfo): string {

  if (makeInfo.customMakefileRules) {
    // reduces the makefile rules and returns them
    return makeInfo.customMakefileRules.reduce(
      (previousString, currentValue) => {
        const { command, rule, dependsOn = '' } = currentValue;
        const newRule =
          `
#######################################
# ${command}
#######################################
${command}: ${dependsOn}
\t${rule}
			`;
        return `${previousString}\n\n${newRule}`;
      }, '');

  }
  // returns empty when no customMakefileRules are found
  return '';
}

export default function createMakefile(makeInfo: MakeInfo): string {
  // NOTE: check for the correct info needs to be given beforehand
  return `##########################################################################################################################
# File automatically-generated by STM32forVSCode
##########################################################################################################################

# ------------------------------------------------
# Generic Makefile (based on gcc)
#
# ChangeLog :
#\t2017-02-10 - Several enhancements + project update mode
#   2015-07-22 - first version
#   2023-06-16 - Added .stm32env file inclusion
# ------------------------------------------------

######################################
# environment variables
######################################
include ${stm32EnvironmentFile}

######################################
# target
######################################
TARGET = ${makeInfo.target}

######################################
# building variables
######################################
# debug build?
# can be overwritten using the environment variable
DEBUG ?= 1

# optimization
# can be overwritten using environment variables. If this is not done
# the default optimization in the configuration yaml file is used

OPT ?= ${makeInfo.optimization}

#######################################
# paths
#######################################
# Build path
BUILD_DIR ?= build

######################################
# source
######################################
# C sources
C_SOURCES +=  ${'\\'}
${createStringList(makeInfo.cSources)}

CPP_SOURCES += ${'\\'}
${createStringList(makeInfo.cxxSources)}

# ASM sources
ASM_SOURCES +=  ${'\\'}
${createStringList(makeInfo.asmSources)}


#######################################
# Tools
#######################################
ARM_PREFIX = arm-none-eabi-
POSTFIX = "
PREFIX = "
# The gcc compiler bin path can be defined in the make command via GCC_PATH variable (e.g.: $make GCC_PATH=xxx)
# or it can be added to the PATH environment variable.
# By default the variable be used from the environment file: ${STM32_ENVIRONMENT_VARIABLE_NAME}.

ifdef ARM_GCC_PATH
		CC = $(PREFIX)$(GCC_PATH)/$(ARM_PREFIX)gcc$(POSTFIX)
		CXX = $(PREFIX)$(GCC_PATH)/$(ARM_PREFIX)g++$(POSTFIX)
		AS = $(PREFIX)$(GCC_PATH)/$(ARM_PREFIX)gcc$(POSTFIX) -x assembler-with-cpp
		CP = $(PREFIX)$(GCC_PATH)/$(ARM_PREFIX)objcopy$(POSTFIX)
		SZ = $(PREFIX)$(GCC_PATH)/$(ARM_PREFIX)size$(POSTFIX)
else
	CC ?= $(ARM_PREFIX)gcc
	CXX ?= $(ARM_PREFIX)g++$
  AS ?= $(ARM_PREFIX)gcc -x assembler-with-cpp
  CP ?= $(ARM_PREFIX)objcopy
  SZ ?= $(ARM_PREFIX)size
endif

HEX = $(CP) -O ihex
BIN = $(CP) -O binary -S

#Flash and debug tools
OPENOCD ?= openocd

#######################################
# CFLAGS
#######################################
# cpu
CPU = ${createPrefixWhenNoneExists(makeInfo.cpu, '-mcpu=')}

# fpu
FPU = ${createPrefixWhenNoneExists(makeInfo.fpu, '-mfpu=')}

# float-abi
FLOAT-ABI = ${createPrefixWhenNoneExists(makeInfo.floatAbi, '-mfloat-abi=')}

# mcu
MCU = $(CPU) -mthumb $(FPU) $(FLOAT-ABI)

# macros for gcc
# AS defines
AS_DEFS = 

# C defines
C_DEFS =  ${'\\'}
${createStringList(makeInfo.cDefs, '-D')}

# CXX defines
CXX_DEFS =  ${'\\'}
${createStringList(makeInfo.cxxDefs, '-D')}

# AS includes
AS_INCLUDES = ${'\\'}

# C includes
C_INCLUDES =  ${'\\'}
${createStringList(makeInfo.cIncludes, '-I')}


# Combining the compilation flags with language specific flags and MCU specific flags
ASFLAGS = $(MCU) $(AS_DEFS) $(AS_INCLUDES) $(OPT) 
CFLAGS = $(MCU) $(C_DEFS) $(C_INCLUDES) $(OPT) 
CXXFLAGS = $(MCU) $(CXX_DEFS) $(C_INCLUDES) $(OPT) 

# debug flags when debug is defined
ifeq ($(DEBUG), 1)
CFLAGS += -g -gdwarf -ggdb
CXXFLAGS += -g -gdwarf -ggdb
endif

# Add additional flags
CFLAGS += ${createSingleLineStringList(makeInfo.cFlags)}
ASFLAGS += ${createSingleLineStringList(makeInfo.assemblyFlags)}
CXXFLAGS += ${createSingleLineStringList(makeInfo.cxxFlags)}

# Generate dependency information
CFLAGS += -MMD -MP -MF"$(@:%.o=%.d)"
CXXFLAGS += -MMD -MP -MF"$(@:%.o=%.d)"

#######################################
# LDFLAGS
#######################################
# link script
LDSCRIPT = ${makeInfo.ldscript}

# libraries
LIBS = ${createSingleLineStringList(makeInfo.libs, '-l')}
LIBDIR = ${'\\'}
${createStringList(makeInfo.libdir, '-L')}

# Additional LD Flags from config file
ADDITIONALLDFLAGS = ${createSingleLineStringList(makeInfo.ldFlags)}

LDFLAGS = $(MCU) $(ADDITIONALLDFLAGS) -T$(LDSCRIPT) $(LIBDIR) $(LIBS) -Wl,-Map=$(BUILD_DIR)/$(TARGET).map,--cref -Wl,--gc-sections

# default action: build all
all: $(BUILD_DIR)/$(TARGET).elf $(BUILD_DIR)/$(TARGET).hex $(BUILD_DIR)/$(TARGET).bin


#######################################
# build the application
#######################################
# list of cpp program objects
OBJECTS = $(addprefix $(BUILD_DIR)/,$(notdir $(CPP_SOURCES:.cpp=.o)))
vpath %.cpp $(sort $(dir $(CPP_SOURCES)))

# list of C objects
OBJECTS += $(addprefix $(BUILD_DIR)/,$(notdir $(C_SOURCES:.c=.o)))
vpath %.c $(sort $(dir $(C_SOURCES)))

# list of ASM program objects
UPPER_CASE_ASM_SOURCES = $(filter %.S,$(ASM_SOURCES))
LOWER_CASE_ASM_SOURCES = $(filter %.s,$(ASM_SOURCES))

OBJECTS += $(addprefix $(BUILD_DIR)/,$(notdir $(UPPER_CASE_ASM_SOURCES:.S=.o)))
OBJECTS += $(addprefix $(BUILD_DIR)/,$(notdir $(LOWER_CASE_ASM_SOURCES:.s=.o)))
vpath %.s $(sort $(dir $(ASM_SOURCES)))

$(BUILD_DIR)/%.o: %.cpp ${makefileName} | $(BUILD_DIR) 
\t$(CXX) -c $(CXXFLAGS) -Wa,-a,-ad,-alms=$(BUILD_DIR)/$(notdir $(<:.cpp=.lst)) $< -o $@

$(BUILD_DIR)/%.o: %.cxx ${makefileName} | $(BUILD_DIR) 
\t$(CXX) -c $(CXXFLAGS) -Wa,-a,-ad,-alms=$(BUILD_DIR)/$(notdir $(<:.cxx=.lst)) $< -o $@

$(BUILD_DIR)/%.o: %.c ${makefileName} | $(BUILD_DIR) 
\t$(CC) -c $(CFLAGS) -Wa,-a,-ad,-alms=$(BUILD_DIR)/$(notdir $(<:.c=.lst)) $< -o $@

$(BUILD_DIR)/%.o: %.s STM32Make.make | $(BUILD_DIR)
	$(AS) -c $(CFLAGS) $< -o $@

$(BUILD_DIR)/%.o: %.S STM32Make.make | $(BUILD_DIR)
	$(AS) -c $(CFLAGS) $< -o $@

$(BUILD_DIR)/$(TARGET).elf: $(OBJECTS) ${makefileName}
\t$(${makeInfo.language === 'C' ? 'CC' : 'CXX'}) $(OBJECTS) $(LDFLAGS) -o $@
\t$(SZ) $@

$(BUILD_DIR)/%.hex: $(BUILD_DIR)/%.elf | $(BUILD_DIR)
\t$(HEX) $< $@

$(BUILD_DIR)/%.bin: $(BUILD_DIR)/%.elf | $(BUILD_DIR)
\t$(BIN) $< $@

$(BUILD_DIR):
\tmkdir $@

#######################################
# flash
#######################################
flash: $(BUILD_DIR)/$(TARGET).elf
\t$(OPENOCD) -f ./openocd.cfg -c "program $(BUILD_DIR)/$(TARGET).elf verify reset exit"

#######################################
# erase
#######################################
erase: $(BUILD_DIR)/$(TARGET).elf
\t$(OPENOCD) -f ./openocd.cfg -c "init; reset halt; ${makeInfo.targetMCU} mass_erase 0; exit"

#######################################
# clean up
#######################################
REMOVE_DIRECTORY_COMMAND = rm -fR
ifeq ($(OS),Windows_NT)
	REMOVE_DIRECTORY_COMMAND = cmd /c rd /s /q
endif

clean:
\t$(REMOVE_DIRECTORY_COMMAND) $(BUILD_DIR)

#######################################
# custom makefile rules
#######################################

${customMakefileRules(makeInfo)}
	
#######################################
# dependencies
#######################################
-include $(wildcard $(BUILD_DIR)/*.d)

# *** EOF ***`;
}