import axios from 'axios';
import { checkIfFileExists, checkIfFileExitsIfNotWrite, fsPathToPosix, getWorkspaceUri } from '../Helpers';
import * as path from 'path';
const DOCTEST_FILE_URL = "https://raw.githubusercontent.com/doctest/doctest/master/doctest/doctest.h";
const TEST_MAP = "test";
const DOCTEST_PATH = `${TEST_MAP}/doctest.h`;

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

  const checkIfExists = checkIfFileExists(doctestLocalPath);
  if (checkIfExists) { return; }

  const doctestFile = await getDoctestFile();

  await checkIfFileExitsIfNotWrite(doctestLocalPath, doctestFile);
}


async function sc


