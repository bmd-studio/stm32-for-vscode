export function getCmakeTestFile(cSource: string[], includeDirs: string[]): string {
  let includeDirectories = '';
  includeDirs.forEach((entry) => { includeDirectories += `${entry} `; });
  let sources = '';
  cSource.forEach((source) => { sources += `${source} `; });

  return `\
  cmake_minimum_required(VERSION 3.1)\
set(CMAKE_C_STANDARD 99)\
set(CMAKE_CXX_STANDARD 14)\
\
Project(mindroom_project)\
# set (\${Project}_VERSION_MAJOR 1)\
# set (\${Project}_VERSION_MINOR 0)\
enable_testing()\
add_subdirectory(googletest)\
\
# include_directories(gmock-global/include)\
\
include_directories(${includeDirectories})\
File(GLOB C_SOURCES ${sources})\
add_library(\${PROJECT_NAME}_LIB STATIC \${SOURCES} \${C_SOURCES})\
\
\
#CONFIGURATION FOR TESTING\
set(THIS_TESTS \${PROJECT_NAME}_tests)\
file(GLOB TEST_SOURCES ./*.cpp)\
\
add_executable(\${THIS_TESTS} \${TEST_SOURCES})\
set(EXECUTABLE_OUTPUT_PATH ../../build/Test) #set output to build\
add_test(\
    NAME \${THIS_TESTS}\
    COMMAND \${THIS_TESTS}\
)\
\
target_link_libraries(\${THIS_TESTS} PUBLIC\
    gtest_main\
    # gmock_main\
    \${PROJECT_NAME}_LIB\
)\
`;
}