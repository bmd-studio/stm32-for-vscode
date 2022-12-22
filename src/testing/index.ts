import axios from 'axios';
import { checkIfFileExists, checkIfFileExitsIfNotWrite, fsPathToPosix, getWorkspaceUri } from '../Helpers';
import * as path from 'path';
import MakeInfo from '../types/MakeInfo';
const DOCTEST_FILE_URL = "https://raw.githubusercontent.com/doctest/doctest/master/doctest/doctest.h";
const TEST_MAP = "tests";
const DOCTEST_FOLDER = `${TEST_MAP}/doctest`;
const DOCTEST_PATH = `${DOCTEST_FOLDER}/doctest.h`;
const TEST_README_PATH = `${TEST_MAP}/README.md`;
import executeTask from '../HandleTasks';
import setupLibrariesFolder from './libariesFolder';
import { workspace, Uri, window } from 'vscode';
import getTestFiles from './getFiles';
// import testsReadmeMD from './testsMapReadme';



async function getDoctestFile(): Promise<string> {
  const response = await axios.get(DOCTEST_FILE_URL);
  if (response.status === 200) {
    return response.data;
  }
  else {
    throw new Error('Something wen wrong with fetching the doctest file');;
  }
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
  // try {
  //   await addDoctestFileToProject();
  //   await setupLibrariesFolder();
  //   // 
  //   await checkIfFileExitsIfNotWrite(path.join(fsPathToPosix(workspacUri.fsPath), TEST_README_PATH), testsReadmeMD);
  // } catch (error) {
  //   window.showErrorMessage(`Something went wrong with setting up the test folder. Error: ${error}`);
  //   return;
  // }


  // const filteredSourcesFiles = info.cSources.filter(
  //   (entry) => !(entry.includes('main.c') || entry.toLowerCase().includes('stm32'))
  // );
  // const filteredHeaderFiles = info.cIncludes.filter(
  //   (includePath) => !(includePath.includes('Middlewares') || includePath.includes('Drivers'))
  // );


  // const testSourceFiles = filteredSourcesFiles.concat(info.testInfo.sourceFiles);
  // const testHeaderFiles = filteredHeaderFiles.concat(info.testInfo.headerFiles);

  // const sourceFileListString = testSourceFiles.join(' ');
  // let testHeaderFilesListString = testHeaderFiles.map((headerDir) => `-I${headerDir}`).join(' ');
  // testHeaderFilesListString += ` -I${TEST_MAP}`;


  // const buildCommand = `${sourceFileListString} ${testHeaderFilesListString} -DTEST -o unitTests`;
  // await executeTask('build', 'build test', ['g++', buildCommand], {}, 'gcc');
  const testFiles = getTestFiles(workspacUri);
}