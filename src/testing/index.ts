import axios from 'axios';
import { checkIfFileExists, checkIfFileExitsIfNotWrite, fsPathToPosix, getWorkspaceUri } from '../Helpers';
import * as path from 'path';
import MakeInfo from '../types/MakeInfo';
const DOCTEST_FILE_URL = "https://raw.githubusercontent.com/doctest/doctest/master/doctest/doctest.h";
const TEST_MAP = "tests";
const DOCTEST_FOLDER = `${TEST_MAP}/doctest`;
const DOCTEST_PATH = `${DOCTEST_FOLDER}/doctest.h`;
const TEST_README_PATH = `${TEST_MAP}/README.md`;
// import executeTask from '../HandleTasks';
// import setupLibrariesFolder from './libariesFolder';
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
  console.log({ info });
  // TODO: add libraries folder automatically (should be done in general configuration)
  // TODO: add tests folder automatically (should be done in general configuration)
  // TODO: add watch functionality. 
  // TODO: add individual tests to the sidebar and allow them all to be run or watch a single test.
  // TODO: create a good way to do a watch build cycle
  // TODO: create a way to configure a test e.g. another config file in the specific test folder.
  const testFiles = await getTestFiles(workspacUri);
  const testKeys = Object.keys(testFiles.tests);


  console.log({ testFiles });
}