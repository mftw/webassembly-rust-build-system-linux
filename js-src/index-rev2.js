// Import our outputted wasm ES6 module
// Which, export default's, an initialization function
// import wasmInit from "../pkg/webassembly_playaround";

// const runWasm = async () => {
//   // Instantiate our wasm module
//   // const helloWorld = await wasmInit("./pkg/hello_world_bg.wasm");
//   const helloWorld = await wasmInit("./webassembly_playaround_bg.wasm");

//   // Call the Add function export from wasm, save the result
//   const addResult = helloWorld.add(24, 24); 

//   // Set the result onto the body
//   document.body.textContent = `Hello World! addResult: ${addResult}`;
// };

// runWasm();


import wasmInit from "../pkg/webassembly_playaround";

const runWasm = async () => {
  // Instantiate our wasm module
  const rustWasm = await wasmInit("./webassembly_playaround_bg.wasm");

  // Call the Add function export from wasm, save the result
  const result = rustWasm.call_me_from_javascript(24, 24);

  console.log(result); // Should output '72'
  console.log(rustWasm.ADD_CONSTANT); // Should output 'undefined'
  console.log(rustWasm.add_integer_with_constant); // Should output 'undefined'
};
runWasm();
