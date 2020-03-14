#!/bin/sh

echo Starting Rust compile to Web Assembly
echo ____________________________________
echo 

# Compile rust to wasm
wasm-pack build --target web

echo Copying .wasm file to /dist folder
cp pkg/webassembly_playaround_bg.wasm dist/webassembly_playaround_bg.wasm
