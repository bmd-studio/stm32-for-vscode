import MakeInfo from "../../types/MakeInfo";
import getCubeIDECProjectFileInfo from "./cProject";
import getCubeIDEProjectFileInfo from "./project";
import getStartupFileInfo from "./startupScripts";
import { getOpenocdTargetFromFullName } from '../../OpenOcdTargetFiles';


// TODO: should scan for dependencies 
export default async function getCubeIDEProjectInfo(): Promise<MakeInfo> {
  try {
    const projectFiles = await getCubeIDEProjectFileInfo();
    const cProjectInfo = await getCubeIDECProjectFileInfo();
    const startupFileInfo = await getStartupFileInfo();

    const result = new MakeInfo();
    result.cSources = result.cSources.concat(projectFiles.sourceFiles);
    if (startupFileInfo) {
      result.assemblySources.push(startupFileInfo.path);
    }
    result.projectName = projectFiles.projectName;
    const openocdTarget = getOpenocdTargetFromFullName(cProjectInfo.openocdTarget);
    if (openocdTarget) {
      result.openocdTarget = openocdTarget;
    }

    // TODO: figure out a way to loop over this, 
    // as now ts complains about assigning string | string[] to string & string[]
    result.cIncludeDirectories = result.cIncludeDirectories.concat(cProjectInfo.cIncludeDirectories);
    result.floatAbi = cProjectInfo.floatAbi ? `${cProjectInfo.floatAbi}` : '';
    result.fpu = `${cProjectInfo.fpu}`;
    result.linkerScript = cProjectInfo.linkerScript;
    result.linkerFlags = cProjectInfo.linkerFlags;
    result.cDefinitions = cProjectInfo.cDefinitions;
    result.cFlags = cProjectInfo.cFlags;
    result.cxxFlags = cProjectInfo.cxxFlags;
    result.cxxDefinitions = cProjectInfo.cxxDefinitions;

    // still needed
    result.cpu = `${startupFileInfo.cpu}`;
    return result;

  } catch (error) {
    throw error;
  }

};