#!/usr/bin/env just --justfile

run:
    deno run --allow-read --allow-net server.ts