import { ConfigurationTarget, workspace } from 'vscode';

import MakeInfo from '../types/MakeInfo';
import {isString} from 'lodash';

export default function setCortexDebugWorkspaceConfiguration(info: MakeInfo): void {
  const cortexConfig = workspace.getConfiguration('cortex-debug');
  const currentArmToolchainPath = cortexConfig.get('armToolchainPath');
  const currentOpenOCDPath = cortexConfig.get('openocdPath');

  const posixArmToolchainPath = `${info.tools.armToolchainPath}`;
  const posixOpenOCDPath = `${info.tools.openOCDPath}`;

  if (isString(info.tools.armToolchainPath) && currentArmToolchainPath !== posixArmToolchainPath) {
    cortexConfig.update('armToolchainPath', posixArmToolchainPath, ConfigurationTarget.Workspace);
  }
  if (isString(info.tools.openOCDPath) && currentOpenOCDPath !== posixOpenOCDPath) {
    cortexConfig.update('openocdPath', posixOpenOCDPath, ConfigurationTarget.Workspace);
  }
}