#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"
#include "simple_math.h"
#include "test1.test.hpp"

TEST_CASE("simple add test") {
  CHECK(simple_add(3,3) === 6);
}