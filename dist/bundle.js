let wasm;

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });

let cachegetUint8Memory = null;
function getUint8Memory() {
    if (cachegetUint8Memory === null || cachegetUint8Memory.buffer !== wasm.memory.buffer) {
        cachegetUint8Memory = new Uint8Array(wasm.memory.buffer);
    }
    return cachegetUint8Memory;
}

function getStringFromWasm(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory().subarray(ptr, ptr + len));
}

function init(module) {
    if (typeof module === 'undefined') {
        module = import.meta.url.replace(/\.js$/, '_bg.wasm');
    }
    let result;
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_log_46634b95a70e189c = function(arg0, arg1) {
        console.log(getStringFromWasm(arg0, arg1));
    };

    if ((typeof URL === 'function' && module instanceof URL) || typeof module === 'string' || (typeof Request === 'function' && module instanceof Request)) {

        const response = fetch(module);
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            result = WebAssembly.instantiateStreaming(response, imports)
            .catch(e => {
                return response
                .then(r => {
                    if (r.headers.get('Content-Type') != 'application/wasm') {
                        console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
                        return r.arrayBuffer();
                    } else {
                        throw e;
                    }
                })
                .then(bytes => WebAssembly.instantiate(bytes, imports));
            });
        } else {
            result = response
            .then(r => r.arrayBuffer())
            .then(bytes => WebAssembly.instantiate(bytes, imports));
        }
    } else {

        result = WebAssembly.instantiate(module, imports)
        .then(result => {
            if (result instanceof WebAssembly.Instance) {
                return { instance: result, module };
            } else {
                return result;
            }
        });
    }
    return result.then(({instance, module}) => {
        wasm = instance.exports;
        init.__wbindgen_wasm_module = module;

        return wasm;
    });
}

// import {
//   floatSamplesToByteSamples,
//   byteSamplesToFloatSamples,
//   audioBuffer,
//   originalAudioSamples,
//   amplifiedAudioSamples,
// } from "./audio";

// import test from './audio';
// console.log(test);

// Some general initialization for audio

// Create our audio context
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Create the number of samples we want for our audio buffer,
// As well as create an empty stereo buffer at the sample rate of the AudioContext
const numberOfSamples = 1024;
const audioBuffer = audioContext.createBuffer(
  2,
  numberOfSamples,
  audioContext.sampleRate
);

// NOTE: Brave has extra security measures so be sure to disable shields.

// console.log("TCL: audioBuffer", audioBuffer.getChannelData(0));
// console.log("TCL: audioBuffer", audioBuffer.numberOfChannels);

// Create our originalAudioSamples, and our amplifiedAudioSamples Buffers
const originalAudioSamples = new Float32Array(numberOfSamples);
const amplifiedAudioSamples = new Float32Array(numberOfSamples);


// Function to convert float samples to byte samples
// This is mostly for demostration purposes.
// Float samples follow the Web Audio API spec:
// https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
// Byte samples are represented as follows:
// 127 is silence, 0 is negative max, 256 is positive max
const floatSamplesToByteSamples = floatSamples => {
  const byteSamples = new Uint8Array(floatSamples.length);
  for (let i = 0; i < floatSamples.length; i++) {
    const diff = floatSamples[i] * 127;
    byteSamples[i] = 127 + diff;
  }
  return byteSamples;
};

// Function to convert byte samples to float samples
// This is mostly for demostration purposes.
// Float samples follow the Web Audio API spec:
// https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer
// Byte samples are represented as follows:
// 127 is silence, 0 is negative max, 256 is positive max
const byteSamplesToFloatSamples = byteSamples => {
  const floatSamples = new Float32Array(byteSamples.length);
  for (let i = 0; i < byteSamples.length; i++) {
    const byteSample = byteSamples[i];
    const floatSample = (byteSample - 127) / 127;
    floatSamples[i] = floatSample;
  }
  return floatSamples;
};

const runWasm = async () => {
  // Instantiate our wasm module
  const rustWasm = await init("./webassembly_playaround_bg.wasm");

  // Create a Uint8Array to give us access to Wasm Memory
  const wasmByteMemoryArray = new Uint8Array(rustWasm.memory.buffer);

  // Generate 1024 float audio samples,
  // and make a quiet / simple square wave
  const sampleValue = 0.3;
  for (let i = 0; i < numberOfSamples; i++) {
    if (i < numberOfSamples / 2) {
      originalAudioSamples[i] = sampleValue;
    } else {
      originalAudioSamples[i] = sampleValue * -1;
    }
  }

  // Convert our float audio samples
  // to a byte format for demonstration purposes
  const originalByteAudioSamples = floatSamplesToByteSamples(
    originalAudioSamples
  );

  // Fill our wasm memory with the converted Audio Samples,
  // And store it at our inputPointer location (index)
  const inputPointer = rustWasm.get_input_buffer_pointer();
  wasmByteMemoryArray.set(originalByteAudioSamples, inputPointer);

  // Amplify our loaded samples with our export Wasm function
  rustWasm.amplify_audio();

  // Get our outputPointer (index were the sample buffer was stored)
  // Slice out the amplified byte audio samples
  const outputPointer = rustWasm.get_output_buffer_pointer();
  const outputBuffer = wasmByteMemoryArray.slice(
    outputPointer,
    outputPointer + numberOfSamples
  );

  // Convert our amplified byte samples into float samples,
  // and set the outputBuffer to our amplifiedAudioSamples
  amplifiedAudioSamples.set(byteSamplesToFloatSamples(outputBuffer));

  // We are now done! The "play" Functions will handle playing the
  // audio buffer
};
runWasm();

function beforePlay() {
  // Check if context is in suspended state (autoplay policy)
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

// Set up playing the Audio Buffer
// Using a shared Audio buffer Source
let audioBufferSource = undefined;
function stopAudioBufferSource() {
  // If we have an audioBufferSource
  // Stop and clear our current audioBufferSource
  if (audioBufferSource) {
    audioBufferSource.stop();
    audioBufferSource = undefined;
  }
}
function createAndStartAudioBufferSource() {
  // Stop the the current audioBufferSource
  stopAudioBufferSource();

  // Create an AudioBufferSourceNode.
  // This is the AudioNode to use when we want to play an AudioBuffer,
  // Set the buffer to our buffer source,
  // And loop the source so it continuously plays
  audioBufferSource = audioContext.createBufferSource();
  audioBufferSource.buffer = audioBuffer;
  audioBufferSource.loop = true;

  // Connect our source to our output, and start! (it will play silence for now)
  audioBufferSource.connect(audioContext.destination);
  audioBufferSource.start();
}

window.playOriginal = () => {
  beforePlay();
  // Set the float audio samples to the left and right channel
  // of our playing audio buffer
  audioBuffer.getChannelData(0).set(originalAudioSamples);
  audioBuffer.getChannelData(1).set(originalAudioSamples);

  createAndStartAudioBufferSource();
};

window.playAmplified = () => {
  beforePlay();
  // Set the float audio samples to the left and right channel
  // of our playing audio buffer
  audioBuffer.getChannelData(0).set(amplifiedAudioSamples);
  audioBuffer.getChannelData(1).set(amplifiedAudioSamples);

  createAndStartAudioBufferSource();
};

window.pause = () => {
  console.log("TCL: audioBuffer", audioBuffer.getChannelData(0));

  beforePlay();
  stopAudioBufferSource();
};

var sound = "Sound loaded";

console.log(sound);

const runWasm$1 = async () => {
  // Instantiate our wasm module
  const rustWasm = await init("./webassembly_playaround_bg.wasm");

  // // Create a Uint8Array to give us access to Wasm Memory
  // const wasmByteMemoryArray = new Uint8Array(rustWasm.memory.buffer);

  // Get our canvas element from our index.html
  const canvasElement = document.querySelector("canvas");

  // Set up Context and ImageData on the canvas
  const canvasContext = canvasElement.getContext("2d");
  const canvasImageData = canvasContext.createImageData(
    canvasElement.width,
    canvasElement.height
  );

  // Clear the canvas
  // canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

  const getDarkValue = () => {
    return Math.floor(Math.random() * 100);
  };

  const getLightValue = () => {
    return Math.floor(Math.random() * 127) + 127;
  };

  const drawCheckerBoard = () => {
    const checkerBoardSize = 20;

    // Generate a new checkboard in wasm
    rustWasm.generate_checker_board(
      getDarkValue(),
      getDarkValue(),
      getDarkValue(),
      getLightValue(),
      getLightValue(),
      getLightValue()
    );

    // Create a Uint8Array to give us access to Wasm Memory
    const wasmByteMemoryArray = new Uint8Array(rustWasm.memory.buffer);

    // Pull out the RGBA values from Wasm memory
    // Starting at the memory index of out output buffer (given by our pointer)
    // 20 * 20 * 4 = checkboard max X * checkerboard max Y * number of pixel properties (R,G.B,A)
    const outputPointer = rustWasm.get_output_buffer_pointer_checkerboard();
    const imageDataArray = wasmByteMemoryArray.slice(
      outputPointer,
      outputPointer + checkerBoardSize * checkerBoardSize * 4
    );

    // Set the values to the canvas image data
    canvasImageData.data.set(imageDataArray);

    // Clear the canvas
    canvasContext.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Place the new generated checkerboard onto the canvas
    canvasContext.putImageData(canvasImageData, 0, 0);
  };

  drawCheckerBoard();
  setInterval(() => {
    drawCheckerBoard();
  }, 1000);
};
runWasm$1();
