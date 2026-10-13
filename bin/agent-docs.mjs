#!/usr/bin/env node

import { main } from "../src/cli/main.mjs";

main(process.argv.slice(2)).catch((error) => {
  console.error(`agent-docs: ${error.message}`);
  process.exitCode = 1;
});
