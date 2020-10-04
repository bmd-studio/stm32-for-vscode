import * as _ from 'lodash';
import * as shelljs from 'shelljs';
import * as path from 'path';

import { BuildToolDefinition, openocdDefinition, INSTALLATION_PATHS } from './ToolChainDefintions';
import {getNewestToolchainVersion} from './extensionToolchainHelpers';
import * as vscode from 'vscode';

import MakeInfo, { MakeInfo } from '../types/MakeInfo';
import { standardOpenOCDInterface } from '../Definitions';
import { set } from 'lodash';

export function validateDefault(tool: BuildToolDefinition): string | boolean {
  if (shelljs.which(tool.standardCmd)) { return tool.standardCmd; }
  let standardCommand = '';
  tool.otherCmds.map((command) => {
    if (shelljs.which(command)) { standardCommand = command; }
  });
  if (_.isEmpty(standardCommand)) {
    return false;
  }
  return standardCommand;
}

export function validateSTM32ForVSCodeToolPath(tool: BuildToolDefinition): string | boolean {
  // is installed as ~/stm32-for-vscode/packs/@xpack-dev-tools/PACKNAME/x.x.x-x.x/.content/bin

}

export function validatePath(path: string): boolean {
  if (!shelljs.which(path)) { return false; }
  return true;
}

export function checkTool(tool: BuildToolDefinition, settingsPath: string | boolean): string | boolean {
  if (settingsPath && _.isString(settingsPath) && validatePath(settingsPath)) {
    return settingsPath;
  }
  const defaultRes = validateDefault(tool);
  if (_.isString(defaultRes)) { return defaultRes; }
  return false;
}

export function checkArmNoneEabi(tool: BuildToolDefinition, settingsPath: string | boolean): string | boolean {
  // should check the regular path and the path with arm-none-eabi-gcc added.
  if(settingsPath && _.isString(settingsPath)) {
    if(validatePath(settingsPath)) {return settingsPath;}
    const joinedPath = path.join(settingsPath, 'arm-none-eabi-gcc');
    if(validatePath(joinedPath)) {return joinedPath;} 
  }


}
