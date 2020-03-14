# Webassembly playaround
This is my playground for webassembly to learn and expirement on. It's essentially a simple build system setup using nodemon for linux (debian) platforms. It compiles, bundles and restarts the server on-save.

## intro
This is build with express server with added support for mime type "application/wasm" to support .wasm binary files

The wasm file(s) are compiled from Rust.

### Prerequisite
  - Debian based Linux OS: i'm using ubuntu
  - libssl-dev: run `sudo apt install libssl-dev`
  - Rust compiler: https://www.rust-lang.org/tools/install
  - wasm-pack: run `cargo install wasm-pack` after installing Rust
  - NodeJS: https://nodejs.org/en/

To start the compiling and the server simply run `npm start`


## Rust
Is a newer (low) high-level language with performance comparable to C/C++, but without manual memory managament and garbage collection. The compiler handles most of this stuff.

The compiler is therefore VERY strict and errors out on nearly anything. But it doesn't just error out, it also tells you exactly where the error is, and gives you a recommendation on how to fix it in a very visual and verbose way.

NOTE: to manually compile directly use "wasm-pack build --target web"

The "--target web" flag tells the compiler to also build the javascript bindings to the rust/wasm functions. The result is a javascript file with TypeScript interface files that you can import and use right away. This is made to abstract away the need to manually control the shared memory between WASM and JS, which is an 1 dimensional arraybuffer.

## Bringing it all together
The rust files are compiled to .wasm files for distribution on the web.

Javascript is used to fetch, compile (in the browser) and run the .wasm files. When it runs the wasm code it returns a javascript function that wraps the wasm code and can be used as a normal async javascript function but with the power of always-optimized code.


## Using Nodemon
Use e.g `nodemon --watch index.js --watch js-src/` to take a whitelist approach to which files to watch. This is to prevent nodemon from restarting the server everytime Rust Language Support (RLS) does linting.


### Resources:
 - Rust hello world example: https://wasmbyexample.dev/examples/hello-world/hello-world.rust.en-us.html
