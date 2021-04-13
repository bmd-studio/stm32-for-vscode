# STM32 for VSCode

An extension to compile, debug and flash STM32 projects. This extension is build to work in conjunction with STM32CubeMX and will install the required toolchain when desired. It will automatically startup when it finds a CubeMX file or an STM32 for VSCode configuration file.

This extension also supports using cpp files, however for this main.c has to ben manually renamed to main.cpp for it to work.

NOTE: Your CubeMX project needs to be generated as a makefile project under project manager->project->Toolchain/IDE

![Alt Text](./media/stm32-for-vscode-build.gif)

## Prerequisites
There are a few command line tools that need to be installed for this extension to work. You can either add them manually or let the extension automatically install them for you. This option will be shown on start-up.

### Automatic installation
![Alt Text](./media/installation.gif)

- [STM32 CubeMX](https://www.st.com/en/development-tools/stm32cubemx.html)
- [Cortex-Debug extension](https://github.com/Marus/cortex-debug)
- [GNU Arm Embedded Toolchain](https://developer.arm.com/open-source/gnu-toolchain/gnu-rm/downloads)
- Make (platform dependent, [Windows](http://gnuwin32.sourceforge.net/packages/make.htm), OSX: install command line developer tools)
- OpenOCD: [Windows](https://gnutoolchains.com/arm-eabi/openocd/), [all platforms](https://xpack.github.io/openocd/install/)

## Configuring CubeMX
This extension assumes the project initialised with CubeMX and the option to create a Makefile project under Project Manager->Project->Toolchain/IDE.

Also please leave the default on Copy all used libraries into the project folder and generate seperate .c and .h files for the peripherals.

## How to use
Click on the ST icon and select the command you want to run. Once this is done for the first time you can also use the shortcut cmd/ctrl+shift+b to start building.

## Features
- Creating a makefile and building and STM32 project.
- Adding configurations for debugging, flashing and building in the workspace.
- Ability to compile it as a C++ project by adding a main.cpp file.
- Automatic configuration of intellisense.
- Detection and installation of an embedded toolchain
- Configuration file per project.
- Searches for .c/.cpp and .h/.hpp files in your project.
- Add static libraries for compilation.

## Disclaimer
This an extension created because I wanted a fast way to build, flash and debug STM32 on OSX in VSCode. This extension is used internally at Bureau Moeilijke Dingen for development. As this might be helpful to others I have allocated time to publish this extension. Should you find any bugs or have feature requests please open an issue on the [Github page](https://github.com/bmd-studio/stm32-for-vscode).