// Import our outputted wasm ES6 module
// Which, export default's, an initialization function.

import wasmInit from "../pkg/webassembly_playaround";
import sound from './index-rev6'
import checkerboard from './index-rev5'

const runWasm = async () => {
  // Instantiate our wasm module
  const rustWasm = await wasmInit("./webassembly_playaround_bg.wasm");

  // Run the exported function
  // rustWasm.console_log_from_wasm(); // Should log "This console.log is from wasm!"
  // rustWasm.console_log_from_wasm("Hey WASM! please report this text!"); // Should log "This console.log is from wasm!"
  rustWasm.console_log_from_wasm(666); // Should log "This console.log is from wasm!"
};
runWasm();