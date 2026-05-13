#!/bin/bash
pnpm config set only-built-dependencies core-js,core-js-pure
pnpm install --no-frozen-lockfile
pnpm run build
