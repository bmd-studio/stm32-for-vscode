import MakeInfo from "../../types/MakeInfo";
import getCubeIDECProjectFileInfo from "./cProject";
import getCubeIDEProjectFileInfo from "./project";
import getStartupFileInfo from "./startupScripts";
import { getTargetMCUFromFullName } from '../../OpenOcdTargetFiles';


// TODO: should scan for dependencies 
export default async function getCubeIDEProjectInfo(): Promise<MakeInfo> {
  try {
    const projectFiles = await getCubeIDEProjectFileInfo();
    const cProjectInfo = await getCubeIDECProjectFileInfo();
    const startupFileInfo = await getStartupFileInfo();

    const result = new MakeInfo();
    result.cSources = result.cSources.concat(projectFiles.sourceFiles);
    if (startupFileInfo) {
      result.asmSources.push(startupFileInfo.path);
    }
    result.target = projectFiles.target;
    const targetMCU = getTargetMCUFromFullName(cProjectInfo.targetMCU);
    if (targetMCU) {
      result.targetMCU = targetMCU;
    }
    result.cIncludes = result.cIncludes.concat(cProjectInfo.cIncludes);
    result.floatAbi = cProjectInfo.floatAbi ? `${cProjectInfo.floatAbi}` : '';
    result.fpu = `${cProjectInfo.fpu}`;
    result.ldscript = cProjectInfo.ldscript;
    result.ldFlags = cProjectInfo.ldFlags;
    result.cDefs = cProjectInfo.cDefs;

    // still needed
    result.cpu = `${startupFileInfo.cpu}`;
    return result;

  } catch (error) {
    throw error;
  }

};