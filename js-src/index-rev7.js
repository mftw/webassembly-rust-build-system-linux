// Here we are importing the default export from our
// Outputted wasm-bindgen ES Module. As well as importing
// the named exports that are individual wrapper functions
// to facilitate handle data passing between JS and Wasm.
import wasmInit, {
  add_wasm_by_example_to_string,
} from "../pkg/webassembly_playaround";

const runWasm = async () => {
  // Instantiate our wasm module
  const rustWasm = await wasmInit("./webassembly_playaround_bg.wasm");

  // Call our exported function
  const helloString = add_wasm_by_example_to_string("Hello from");

  // Log the result to the console
  console.log(helloString);
};
runWasm();
