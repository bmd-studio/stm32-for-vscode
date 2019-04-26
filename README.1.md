# STM32 for VSCode

This is a supporting extension to setup STM32 projects generated from STM CubeMX. It automatically generates a makefile and starts the build process, it also adds debugging, building (limited) and uploading configurations to the workspace.

It also supports using cpp files, however for this main.c has to ben manualy renamed to main.cpp for it to work.

To use the extension use the cmd/ctrl+shift+p shortcut to open the commands panel and run the Build STM command. This will setup the project and start the building process.

This project depends on a few dependencies so make sure they are installed before using this extension.

## Prerequisites
There are a few command line tools that needs to be added to the PATH for this extension to work. On top of this the Cortex-Debug extension needs to be installed for debugging. Should any of the command line tools not be installed you will get a warning stating which one is missing. The requirements are stated below.


- [STM32 CubeMX](https://www.st.com/en/development-tools/stm32cubemx.html)
- [Cortex-Debug extension](https://github.com/Marus/cortex-debug)
- [ST-Link (Drivers and Utility)](https://www.st.com/en/development-tools/st-link-v2.html)
- [GNU Arm Embedded Toolchain](https://developer.arm.com/open-source/gnu-toolchain/gnu-rm/downloads)
- Make (platform dependend, [Windows](http://gnuwin32.sourceforge.net/packages/make.htm), OSX: install command line developer tools)

## Configuring CubeMX
This extension assumes the project initialised with CubeMX and the option to create a Makefile project under Project Manager->Project->Toolchain/IDE.

Also please leave the default on Copy all used libraries into the project folder and generate seperate .c and .h files for the peripherals.

## How to use
for now use cmd/ctrl+shift+p to open the show all commands panel and issue the command build stm

## Features
- Creating a makefile and building and STM32 project.
- Adding configurations for debugging and building in the workspace.

## Disclaimer
This is a beta version of the software, which comes forth from wanting a nice and fast way of compiling and debugging C++ STM32 projects in VSCode, for this reason some bugs will probably be present I will try to fix them and maintain this extension. Suggestions and feedback is always welcome.