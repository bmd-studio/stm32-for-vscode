import axios from 'axios';
import decompress from 'decompress';
import { join } from 'path';
import { window, Uri, workspace } from 'vscode';
import { GITHUB_ISSUES_URL } from '../Definitions';

const nodeRegex: { [key: string]: { [key: string]: RegExp } } = {
  win32: {
    x32: /href="(node-v\d*.\d*.\d*-win-x86.zip)/gm,
    x64: /href="(node-v\d*.\d*.\d*-win-x64.zip)/gm,
    ia32: /href="(node-v\d*.\d*.\d*-win-x86.zip)/gm,
    ia64: /href="(node-v\d*.\d*.\d*-win-x64.zip)/gm,
  },
  darwin: {
    x64: /href="(node-v\d*.\d*.\d*.-darwin-x64.tar.gz)/gm,
    arm64: /href="(node-v\d*.\d*.\d*.-darwin-arm64.tar.gz)/gm
  },
  linux: {
    arm: /href="(node-v\d*.\d*.\d*.-linux-armv7l.tar.gz)/gm,
    arm64: /href="(node-v\d*.\d*.\d*.-linux-arm64.tar.gz)/gm,
    x64: /href="(node-v\d*.\d*.\d*.-linux-x64.tar.gz)/gm,
    ppc64: /href="(node-v\d*.\d*.\d*.-linux-ppc64le.tar.gz)/gm,
    s390x: /href="(node-v\d*.\d*.\d*.-linux-s390x.tar.gz)/gm,
  }
};

/**
 * 
 * @param latestNodeBody body of the https://nodejs.org/dist/latest/ page
 * @param platform the platform for which to get the node version
 * @param arch the arch for which to get the node version
 */
export function getPlatformSpecificNodeLink(
  latestNodeBody: string, currentPlatform: NodeJS.Platform, arch: string
): string | undefined {
  const regexPattern = nodeRegex?.[`${currentPlatform}`]?.[`${arch}`];
  if (!regexPattern) {
    throw new Error(
      // eslint-disable-next-line max-len
      `Could not find the NodeJS link for your specific platform: platform: ${process.platform}, arch: ${process.arch}. Please open an issue on our Github: ${GITHUB_ISSUES_URL}`);
  }
  const platformRegex = new RegExp(
    regexPattern,
    regexPattern.flags);
  let link = undefined;

  if (platformRegex) {
    const result = platformRegex.exec(latestNodeBody);
    if (Array.isArray(result)) {
      link = result[0];
    }
  }
  if (link) {
    link = link.replace(`href="`, '');
  }
  return link;
}

// latest gallium is the latest lts v16 version. 
const nodeLatestURL = 'https://nodejs.org/dist/latest-gallium/';

/**
 * Gets the latest node version download filename for the current platform.
 */
export function getLatestNodeLink(): Promise<string> {

  return new Promise((resolve, reject) => {
    axios.get(nodeLatestURL).then((response) => {
      const latestLink = getPlatformSpecificNodeLink(response.data, process.platform, process.arch);
      if (latestLink) {
        resolve(`${latestLink}`);
      } else {
        reject(
          new Error(
            'No link found for this specific platform, ' +
            'please open a new issue to ask for support for your specific platform at: ' +
            'https://github.com/bmd-studio/stm32-for-vscode/issues'
          )
        );
      }
    }).catch((err) => {
      reject(err);
    });
  });
}

/**
 * Downloads the latest compressed version of node to the extensions global storage directory in ta tmp folder.
 * @param context vscode extensions context
 * @param fileDownloadName the platform specific filename for node
 */
export function downloadLatestNode(toolsStoragePath: Uri, fileDownloadName: string): Promise<string> {
  const pathToSaveTo = toolsStoragePath.fsPath;
  const downloadURL = `${nodeLatestURL}${fileDownloadName}`;
  const downloadPath = join(pathToSaveTo, 'tmp', fileDownloadName);

  return new Promise((resolve, reject) => {

    axios.get(downloadURL, { responseType: 'arraybuffer' }).then((response) => {
      workspace.fs.writeFile(Uri.file(downloadPath), response.data).then(() => {
        resolve(downloadPath);
      }, (error) => {
        reject(error);
      });
    }).catch(err => reject(err));
  });
}

/**
 * Extracts compressed files to a specific directory.
 * @param context vscode extension context
 * @param filePath path to the file to be extracted
 * @param outPath path to the output directory
 */
export async function extractFile(filePath: string, outPath: string): Promise<string> {
  // TODO: replace this with the node native zlib
  try {
    await decompress(filePath, outPath);
  } catch (err: any) {
    window.showWarningMessage(`${err}`);
    if (err?.message?.includes('EEXIST')) {
      await workspace.fs.delete(Uri.file(outPath), { recursive: true });
      return extractFile(filePath, outPath);
    }
    throw err;
  }
  return outPath;
}

/**
 * Function for downloading and extracting a new latest node version
 * @param toolsStoragePath storage path to where the tools are stored. The extension uses the globalStoragePath for this
 */
export async function getNode(toolsStoragePath: Uri): Promise<string> {
  try {
    const latestNodeLink = await getLatestNodeLink();
    const latestNodeCompressed = await downloadLatestNode(toolsStoragePath, latestNodeLink);
    const extractedNodeFileLoc = await extractFile(
      latestNodeCompressed,
      join(toolsStoragePath.fsPath, 'node')
    );
    const dirContents = await workspace.fs.readDirectory(Uri.file(extractedNodeFileLoc));
    const nodeInstallationFilePath = dirContents.find((file) => { return (file[0].indexOf('node') >= 0); });
    if (!nodeInstallationFilePath || !nodeInstallationFilePath[0]) {
      throw new Error('No node installation could be found after download and extraction');
    }
    return join(extractedNodeFileLoc, nodeInstallationFilePath[0]);
  } catch (error) {
    window.showErrorMessage(
      `An error occurred during the node installation process, 
        please try again or create an issue at: ${GITHUB_ISSUES_URL}, with stating error: ${error}`
    );
    throw error;
  }
}
