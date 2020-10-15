import * as _ from 'lodash';
import * as process from 'process';
import * as vscode from 'vscode';

import { checkBuildTools } from '.';
import { exec } from 'child_process';
import { openocdDefinition } from './toolChainDefinitions';

export function installOpenOcd(context: vscode.ExtensionContext): void {
  const pathToSaveTo = context.globalStoragePath;
  const env = process.env;
  _.set(env, 'XPACKS_SYSTEM_FOLDER', pathToSaveTo);
  _.set(env, 'XPACKS_REPO_FOLDER', pathToSaveTo);
  const execOptions = {
    env,
  };
  console.log(env);
  console.log('installing openocd: ', `npx xpm install --global ${openocdDefinition.installation.xpm}`);
  exec(`npx xpm install --global ${openocdDefinition.installation.xpm}`, execOptions, (error, stdout, stderr) => {
    console.log('openocd');
    if (error) {
      console.error(error);
    }
    if (stderr) {
      console.error(stderr);
    }
    console.log(stdout);
  });
}