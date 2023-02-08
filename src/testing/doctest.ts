/**
 * For testing the doctest testing framework is used.
 * The doctest framework was chosen as it supports C++ and compiles fast
 * For more info on the doctest framework please visit: https://github.com/doctest/doctest
 * If you enjoy using STM32 for VSCode and doctest please consider supporting doctest.
 */

import axios from 'axios';
const DOCTEST_FILE_URL = "https://raw.githubusercontent.com/doctest/doctest/master/doctest/doctest.h";

export async function getDoctestFile(): Promise<string> {
  const response = await axios.get(DOCTEST_FILE_URL);
  if (response.status === 200) {
    return response.data;
  }
  else {
    throw new Error('Something wen wrong with fetching the doctest file');;
  }
}

export const doctestMainFile = `
/**
  * This file is included so no specific main file needs to be written.
  * Including this file makes sure doctest set's up it's own tests and is able
  * to execute them without the user needing to add tests explicetly 
**/
#DEFINE DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

`;

/* eslint-disable max-len */
//  TODO: add specific instructions on how to use unit testing within STM32 for VSCode.
export const doctestReadmeFile = `
# Doctest README

Doctest is a testing framework that is used by STM32-for-vscode for unit testing. For more elaborate documentation visist the doctest website: https://github.com/doctest/doctest.

## Quick start
To create a quick test create a factorial.test.cpp file and place it in a folder in the test folder. Paste in the following code:
\`\`\`
int factorial(int number) { return number <= 1 ? number : factorial(number - 1) * number; }

TEST_CASE("testing the factorial function") {
    CHECK(factorial(1) == 1);
    CHECK(factorial(2) == 2);
    CHECK(factorial(3) == 6);
    CHECK(factorial(10) == 3628800);
}
\`\`\`

After this the test target can be compiled and run.
`;
