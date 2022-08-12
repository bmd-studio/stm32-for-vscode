import * as path from 'path';

import { Uri, window, workspace } from 'vscode';
import {
  checkIfFileExists,
  checkIfFileExitsIfNotWrite,
  fsPathToPosix,
  getWorkspaceUri,
  writeFileInWorkspace,
} from '../Helpers';

import MakeInfo from '../types/MakeInfo';
import axios from 'axios';
import executeTask from '../HandleTasks';
import setupLibrariesFolder from './modulesFolder';
import testsReadmeMD from './testsMapReadme';

const DOCTEST_FILE_URL = 'https://raw.githubusercontent.com/doctest/doctest/master/doctest/doctest.h';
const TEST_MAP = 'tests';
const DOCTEST_FOLDER = `${TEST_MAP}/doctest`;
const DOCTEST_PATH = `${DOCTEST_FOLDER}/doctest.h`;
const TEST_README_PATH = `${TEST_MAP}/README.md`;
const TEST_MAKEFILE_PATH = 'unit-tests.make';

// TODO: implement a new configuration for intellisense for testing

async function getDoctestFile(): Promise<string> {
  const response = await axios.get(DOCTEST_FILE_URL);
  if (response.status === 200) {
    return response.data;
  }

  throw new Error('Something wen wrong with fetching the doctest file');
}

/**
 * Adds the Doctest testing framework to the project in test.
 * @returns nothing
 */
async function addDoctestFileToProject(): Promise<void> {
  const workspacUri = getWorkspaceUri();
  if (!workspacUri) {
    throw Error('could not determine workspace');
  }
  const doctestLocalPath = path.join(fsPathToPosix(workspacUri.fsPath), DOCTEST_PATH);

  const checkIfExists = await checkIfFileExists(doctestLocalPath);
  if (checkIfExists) { return; }

  const doctestFile = await getDoctestFile();
  if (!await checkIfFileExists(DOCTEST_FOLDER)) {
    await workspace.fs.createDirectory(Uri.file(path.join(fsPathToPosix(workspacUri.fsPath), DOCTEST_FOLDER)));
  }
  await checkIfFileExitsIfNotWrite(doctestLocalPath, doctestFile);
}

export default async function buildTest(info: MakeInfo): Promise<void> {
  const workspacUri = getWorkspaceUri();
  if (!workspacUri) {
    return;
  }
  try {
    await addDoctestFileToProject();
    await setupLibrariesFolder();
    //
    await checkIfFileExitsIfNotWrite(path.join(fsPathToPosix(workspacUri.fsPath), TEST_README_PATH), testsReadmeMD);
  } catch (error) {
    window.showErrorMessage(`Something went wrong with setting up the test folder. Error: ${error}`);
    return;
  }

  const sourceFileListString = 
  `${info.testInfo.cSources.join(' ')} ${info.testInfo.cxxSources.join(' ')} ${info.testInfo.asmSources.join(' ')}`;

  let testHeaderFilesListString = info.testInfo.headerFiles.map((headerDir) => `-I${headerDir}`).join(' ');
  testHeaderFilesListString += ` -I${TEST_MAP}`;
  testHeaderFilesListString += ` -I${DOCTEST_FOLDER}`;

  const testMakefilePath = path.join(fsPathToPosix(workspacUri.fsPath), TEST_MAKEFILE_PATH);
  await writeFileInWorkspace(workspacUri, TEST_MAKEFILE_PATH, createTestMakefile(info));

  // TODO: Add default flags in the config yaml.
  const buildCommand = 
  `${sourceFileListString} ${testHeaderFilesListString} -DTEST -DDOCTEST_CONFIG_IMPLEMENT_WITH_MAIN -o unitTests`;
  await executeTask('build', 'build test', ['make', '-f', TEST_MAKEFILE_PATH], {}, 'gcc');
}

// function getFilteredLibraries(info: MakeInfo)

// FIXME: add .exe to windows
// TODO: add assembly support and test it
function createTestMakefile(info: MakeInfo): string {
  const testMakefile = `
######################################
# target
######################################
TARGET = ${info.target}-unit-tests

#######################################
# paths
#######################################
# Build path
BUILD_DIR = build/tests
OBJECT_DIR = $(BUILD_DIR)/objects
  
C_SOURCES = ${info.testInfo.cSources.join(' ')}
CXX_SOURCES = ${info.testInfo.cxxSources.join(' ')}
ASM_SOURCES = ${info.testInfo.asmSources.join(' ')}
C_INCLUDES = ${info.testInfo.headerFiles.concat([TEST_MAP, DOCTEST_FOLDER]).map(((headerDir) => `-I${headerDir}`)).join(' ')}
LIBS = -lc -lm 
LIBDIR = 


C_DEFINITIONS = -DTEST -DDOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
C_FLAGS = $(C_DEFINITIONS) -Wall -fdata-sections -ffunction-sections 
LDFLAGS = $(LIBDIR) $(LIBS) $(C_DEFINITIONS)

#######################################
# Compiler
#######################################
CXX = g++

# default action: build all
all: $(BUILD_DIR)/$(TARGET)

OBJECTS = $(addprefix $(BUILD_DIR)/,$(notdir $(C_SOURCES:.c=.o)))
vpath %.c $(sort $(dir $(C_SOURCES)))

OBJECTS += $(addprefix $(OBJECT_DIR)/,$(notdir $(CXX_SOURCES:.cpp=.o)))
vpath %.cpp $(sort $(dir $(CXX_SOURCES)))

OBJECTS += $(addprefix $(OBJECT_DIR)/,$(notdir $(ASM_SOURCES:.s=.o)))
vpath %.s $(sort $(dir $(ASM_SOURCES)))

$(OBJECT_DIR)/%.o: %.c ${TEST_MAKEFILE_PATH} | $(OBJECT_DIR) 
	$(CXX) -c $(C_FLAGS) $(C_INCLUDES) $< -o $@

$(OBJECT_DIR)/%.o: %.cpp ${TEST_MAKEFILE_PATH} | $(OBJECT_DIR) 
	$(CXX) -c $(C_FLAGS) $(C_INCLUDES) -std=c++20 $< -o $@

$(OBJECT_DIR)/%.o: %.s ${TEST_MAKEFILE_PATH} | $(OBJECT_DIR) 
	$(CXX) -c $(C_FLAGS) $(C_INCLUDES) -std=c++20 $< -o $@

$(OBJECT_DIR)/%.o: %.cxx ${TEST_MAKEFILE_PATH} | $(OBJECT_DIR) 
	$(CXX) -c $(C_FLAGS) $(C_INCLUDES) $< -o $@

$(BUILD_DIR)/$(TARGET): $(OBJECTS) ${TEST_MAKEFILE_PATH}
	$(CXX) $(OBJECTS) $(LDFLAGS)  -o $@

$(BUILD_DIR): 
	mkdir $@

$(OBJECT_DIR):
	mkdir -p $@

#######################################
# dependencies
#######################################
-include $(wildcard $(OBJECT_DIR)/*.d)
`;
  return testMakefile;
}
