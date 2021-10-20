import MakeInfo from "../../types/MakeInfo";
import getCubeIDECProjectFileInfo from "./cProject";
import getCubeIDEProjectFileInfo from "./project";
import getStartupFileInfo from "./startupScripts";
import { getTargetMCUFromFullName } from '../../OpenOcdTargetFiles';
import { getCubeIDEMXProjectInfo } from './mxproject';
import { targetsMCUs } from "../../configuration/ConfigInfo";



// TODO: should scan for dependencies 
export default async function getCubeIDEProjectInfo(): Promise<MakeInfo> {
  try {
    const projectFiles = await getCubeIDEProjectFileInfo();
    const cProjectInfo = await getCubeIDECProjectFileInfo();
    const startupFileInfo = await getStartupFileInfo();
    const mxProjectFiles = await getCubeIDEMXProjectInfo();

    const result = new MakeInfo();
    result.cSources = result.cSources.concat(projectFiles.sourceFiles, mxProjectFiles.sourceFiles);
    if (startupFileInfo) {
      result.asmSources.push(startupFileInfo.path);
    }
    result.target = projectFiles.target;
    const targetMCU = getTargetMCUFromFullName(cProjectInfo.targetMCU);
    if (targetMCU) {
      result.targetMCU = targetMCU;
    }
    result.cIncludes = result.cIncludes.concat(cProjectInfo.cIncludes, mxProjectFiles.headerPaths);
    result.floatAbi = cProjectInfo.floatAbi ? `${cProjectInfo.floatAbi}` : '';
    result.fpu = `${cProjectInfo.fpu}`;
    result.ldscript = cProjectInfo.ldscript;
    result.cDefs = cProjectInfo.cDefs;

    // still needed
    result.cpu = `${startupFileInfo.cpu}`;
    return result;

  } catch (error) {
    throw error;
  }

};