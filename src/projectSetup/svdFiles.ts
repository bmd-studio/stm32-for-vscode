/* eslint-disable @typescript-eslint/naming-convention */
import axios from 'axios';
import * as nearestString from 'nearest-string';

const SVDFilesURL = 'https://api.github.com/repos/posborne/cmsis-svd/contents/data/STMicro';

interface GithubFileResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  _links: {
    self: string;
    git: string;
    html: string;
  }
}

export interface SVDFile {
  name: string;
  download_url: string;
}
export async function getSVDFileList(): Promise<SVDFile[]> {
  const response = await axios.get(SVDFilesURL);
  if (response.status === 200) {
    const files = response.data.map((responseFile: GithubFileResponse) => (
      { name: responseFile.name, download_url: responseFile.download_url }
    ));
    return files;
  } else {
    throw new Error('Could not get SVD Files from GitHub');
  }
}

export interface SVDLocalFile {
  name: string,
  data: string;
}

// FIXME: multiple ways to fix this. 
// Look at: https://marketplace.visualstudio.com/items?itemName=cortex-debug.svd-viewer
export async function getSVDFileForChip(chip: string): Promise<SVDLocalFile> {
  const svdFileList = await getSVDFileList();
  const svdFileStringList = svdFileList.map((e) => e.name);
  const searchResults = nearestString(svdFileStringList, chip, true);
  let svdSearchResult = searchResults.distance <= 10 ? searchResults.value : undefined;
  let svdFile = undefined;
  if (svdSearchResult) {
    svdFile = svdFileList.find((file) => file.name === svdSearchResult);
  }

  // const svdFile = svdFileList.find(file => file.name.toUpperCase().includes(chip.toUpperCase()));
  if (!svdFile) { throw new Error('Could not find desired SVD file for the chip'); }
  const fileBuffer = (await axios.get(svdFile.download_url)).data;
  return {
    name: svdFile.name,
    data: fileBuffer
  };
}


