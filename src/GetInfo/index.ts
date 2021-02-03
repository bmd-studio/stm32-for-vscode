import * as Helpers from '../Helpers';

import { getExtensionSettings } from './getSettings';
import getFiles from './getFiles';
import getMakefileInfo from './getCubeMakefileInfo';
import { readConfigFile } from '../configuration/stm32Config';

// import {MakeInfo} from '../types/MakeInfo';


// TODO: should return all the information
export default async function getInfo(): Promise<void> {
  const workspaceFolder = Helpers.getWorkspaceUri();

  if (!workspaceFolder) { return Promise.resolve(); }
  const posixWorkspaceFolder = Helpers.fsPathToPosix(workspaceFolder.fsPath);
  const makefileInfo = await getMakefileInfo(posixWorkspaceFolder).catch((error) => {
    console.error('makefile error, continuing anyway, Error:', error);
  });
  const filesInfo = await getFiles(posixWorkspaceFolder);
  const extensionSettings = await getExtensionSettings();
  const configurationFileInfo = await readConfigFile().catch((error) => {
    console.error('configuration file error. This should not happen! Error: ', error);
  });


  // TODO: add the configuration file over here
  return Promise.resolve();
}



