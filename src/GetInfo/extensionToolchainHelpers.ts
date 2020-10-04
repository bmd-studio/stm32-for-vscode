import * as vscode from 'vscode';
import * as path from 'path';
import { BuildToolDefinition,INSTALLATION_PATH, TOOL_FOLDER_PATH } from './ToolChainDefintions';


export interface XPMToolVersion  {
  toolVersion: number[];
  xpmVersion: number[];
  fileName: string;
}

export function parseXPMVersionNumbers(fileName: string): XPMToolVersion {
  const [toolVersion = '', xpmVersion = ''] = fileName.split('-');
  const [major = 0, middle = 0, minor = 0] = toolVersion.split('.').map((number) => {
    return parseInt(number);
  });
  const [xpmMajor, xpmMiddle = 0, xpmMinor = 0] = xpmVersion.split('.').map((number) => {
    return parseInt(number);
  });
  return {
    toolVersion: [major, middle, minor],
    xpmVersion: [xpmMajor, xpmMiddle, xpmMinor],
    fileName,
  };
}

export function isVersionFile(version: XPMToolVersion): boolean {
  const toolVersions = version.toolVersion;
  if(toolVersions[0] === 0 && toolVersions[1] === 0 && toolVersions[2] === 0) {
    return false;
  }
  return true;
}

export function compareVersions(version1: XPMToolVersion | null, version2: XPMToolVersion): XPMToolVersion {
  if(!version1) {return version2;}
  // check the main tool version
  for(let i = 0 ; i < version1.toolVersion.length; i++) {
    const version1Number = version1.toolVersion[i];
    const version2Number = version2.toolVersion[i];
    if(version1Number > version2Number ) {
      return version1;
    }
    if(version1Number < version2Number) {
      return version2;
    }
  }

  // check the xpm tool version
  for(let i = 0 ; i < version1.xpmVersion.length; i++) {
    const version1Number = version1.xpmVersion[i];
    const version2Number = version2.xpmVersion[i];
    if(version1Number > version2Number ) {
      return version1;
    }
    if(version1Number < version2Number) {
      return version2;
    }
  }
  return version1;
} 

export function getNewestToolchainVersion(tool: BuildToolDefinition): Promise<XPMToolVersion | boolean> {
  return new Promise((resolve, reject) => {
    if(!tool.xpmName ) {
      reject(new Error('No xpm name found in definition file'));
      return;
    }
    const toolPath = vscode.Uri.file(path.join(INSTALLATION_PATH, TOOL_FOLDER_PATH, tool.xpmName));
    vscode.workspace.fs.readDirectory(toolPath).then((files) => {
      if(!files) {
        reject(new Error('No files found'));
        return;
      }
      let newest: XPMToolVersion | null = null;
      files.map((file) => {
        const [fileName, fileType] = file;
        if(fileType === vscode.FileType.Directory) {
          newest = compareVersions(newest, parseXPMVersionNumbers(fileName));
        }
      });
      if(!newest || !isVersionFile(newest)) {
        reject(new Error('no tool found'));
        return;
      }
      resolve(newest);
    }, (error) => {
      console.error(error);
    });
  });
 
}