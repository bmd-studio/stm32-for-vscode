import MakeInfo from "../../types/MakeInfo";
import getCubeIDECProjectFileInfo from "./cProject";
import getCubeIDEProjectFileInfo from "./project";
import getStartupFileInfo from "./startupScripts";
import { getTargetMCUFromFullName } from '../../OpenOcdTargetFiles';
import { targetsMCUs } from "../../configuration/ConfigInfo";



export default async function getCubeIDEProjectInfo(): Promise<MakeInfo> {
  try {
    const projectFiles = await getCubeIDEProjectFileInfo();
    const cProjectInfo = await getCubeIDECProjectFileInfo();
    const startupFileInfo = await getStartupFileInfo();

    const result = new MakeInfo();
    result.cSources = projectFiles.sourceFiles;
    result.target = projectFiles.target;
    const targetMCU = getTargetMCUFromFullName(cProjectInfo.targetMCU);
    if (targetMCU) {
      result.targetMCU = targetMCU;
    }
    result.cIncludes = cProjectInfo.cIncludes;
    result.floatAbi = cProjectInfo.floatAbi;
    result.fpu = `-mfpu=${cProjectInfo.fpu}`;
    result.ldscript = cProjectInfo.ldscript;
    result.cDefs = cProjectInfo.cDefs;

    // still needed
    result.cpu = `-mcpu=${startupFileInfo.cpu}`;
    console.log('current cubeIDEProjectInfo', result);
    return result;

  } catch (error) {
    throw error;
  }

};