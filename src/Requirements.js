/**
 *
 * Functions to check and get the required tools.
 * Created by Jort Band - Bureau Moeilijke Dingen.
 */
import vscode, { window, workspace } from 'vscode';
import shelljs from 'shelljs';
import process from 'process';
import _ from 'lodash';


const { platform } = process;
const cortexDebugConfig = workspace.getConfiguration('cortex-debug');
const stm32Config = workspace.getConfiguration('stm32-for-vscode');

function checkInstallMethods() {
  if (platform === 'darwin' && shelljs.which('brew')) {
    return 'Brew Install';
  }
  if (platform === 'linux' && shelljs.which('apt-get')) {
    return ('Apt Get');
  }
  return null;
}

function checkToolPathValidity(standardPathName, toolPath) {

  if (_.toLower(toolPath).indexOf(standardPathName) !== -1) {
    if (toolPath === 'arm-none-eabi') {
      if (shelljs.which(`${toolPath}/arm-none-eabi-gcc`))
    } else {

    }
  }
  return false;
}
function checkForArmNonEabi(toolPath) {

}

function browseAndAddToConfig(standardPath, stm32ref, cortexDebugRef, toolName) {
  window.showOpenDialog({ canSelectFolders: standardPath === 'arm-none-eabi', filters: {} }).then((uri) => {
    if (!uri || !uri[0]) return;
    // check if it is a valid path
    if (_.lowerCase(uri[0].path).indexOf(standardPath) === -1 || !shelljs.which(uri[0].path)) {
      window.showErrorMessage('It seems that you did not select the required tool', 'Open again').then((selection) => {
        if (selection === 'Open again') {
          browseAndAddToConfig(standardPath, stm32ref, cortexDebugRef, toolName);
        }
      });
      return;
    }
    // if this checks out add it to the configuration.
    addToConfig(standardPath);
  });
}
function addToConfig(toolName, stm32ref, cortexDebugRef, toolPath) {
  if (stm32ref) { stm32Config.update(stm32ref, toolPath, true); }
  if (cortexDebugRef) { cortexDebugConfig.update(cortexDebugRef, toolPath, true); }
  window.showInformationMessage(
    `Set ${stm32ref ? 'STM32 for VSCode' : ''}${stm32ref && cortexDebugRef ? ' and ' : ''}${cortexDebugRef ? 'Cortex Debug' : ''} configuration for: ${toolName}, to: ${toolPath}`,
  );
}

function validateToolPath(path) {
  const p = _.toLower(path);
  if (p.indexOf('openocd') === -1
    && p.indexOf('bin') === -1
    && p.indexOf('make') === -1
    && p.indexOf('cMake') === -1
  ) {
    return 'The path does not have the required tool in the name';
  }
  return null;
}

function toolInstall(brewInstall, aptGet, brewName, aptGetName) {
  const cmd = '';
  if (brewInstall) {
    cmd = `brew install ${brewName}`;
  }
  if (aptGet) {
    cmd = `apt-get ${aptGetName}`;
  }
  if (cmd !== '') {
    const terminal = vscode.window.createTerminal();
    terminal.sendText(cmd);
    terminal.show();
  }
}

// TODO: check DebugConfigurationProvider (registerDebugConfigurationProvider)
export default function checkRequirements() {
  /*
   * The required tools are:
   * - openocd
   * - make
   * - arm toolchain
   * - cmake
   * - cortex-debug (already fixed in extensionDependencies in package.json)
   */
  const { workspace } = vscode;
  const makePath = 'make';
  const cmakePath = 'cmake';
  const brewInstall = (platform === 'darwin' && shelljs.which('brew'));
  const aptGet = (platform === 'linux' && shelljs.which('apt-get'));
  const installMethod = checkInstallMethods();
  console.log('stm config', stm32Config);

  // For this extension the priority of tools is stm32-for-vscode > cortex-debug > PATH
  const openOCDPath = checkToolPath('openocd', stm32Config.openocdPath, cortexDebugConfig.openocdPath);
  if (!openOCDPath || openOCDPath) {
    vscode.window.showWarningMessage('This extension requires: "openocd"', 'Download', 'Browse', 'Input path', installMethod).then((value) => {
      switch (value) {
        case 'Download':
          vscode.env.openExternal('http://openocd.org/getting-openocd/');
          break;
        case 'Brew Install': {
          const terminal = vscode.window.createTerminal();
          terminal.sendText('brew install openocd');
          terminal.show();
        }
          break;
        case 'Apt Get': { // FIXME: not tested
          const terminal = vscode.window.createTerminal();
          terminal.sendText('apt-get install openocd');
          terminal.show();
        }
          break;
        case 'Browse':
          browseAndAddToConfig('openocd', 'openocdPath', 'openocdPath');
          break;
        case 'Input path': {
          window.showInputBox({ placeHolder: 'Path to: openocd', validateInput: validateToolPath }).then((pathstring) => {
            console.log('the value is', pathstring);
          });
        }
          break;
        default:
      }
    });
  }
}


function checkToolPath(standardPath, stm32path, cortexDebugPath) {
  if (stm32path) {
    if (shelljs.which(stm32path)) {
      return stm32path;
    }
    if (shelljs.which(`${stm32path}/${standardPath}`)) {
      return `${stm32path}/${standardPath}`;
    }
  }
  if (cortexDebugPath) {
    if (shelljs.which(cortexDebugPath)) {
      return cortexDebugPath;
    }
    if (shelljs.which(`${cortexDebugPath}/${standardPath}`)) {
      return `${cortexDebugPath}/${standardPath}`;
    }
  }
  if (shelljs.which(standardPath)) {
    return standardPath;
  }
  return false;
}

export function getTools() {

}
