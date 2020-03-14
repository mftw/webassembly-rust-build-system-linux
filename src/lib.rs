// The wasm-pack uses wasm-bindgen to build and generate JavaScript binding file.
// Import the wasm-bindgen crate.
use wasm_bindgen::prelude::*;

// Let's define our external function (imported from JS)
// Here, we will define our external `console.log`
#[wasm_bindgen]
extern "C" {
  // Use `js_namespace` here to bind `console.log(..)` instead of just
  // `log(..)`
  // fn log(s: &str);
  #[wasm_bindgen(js_namespace = console)]
  fn log(s: &str);
}

// Export a function that will be called in JavaScript
// but call the "imported" console.log.
#[wasm_bindgen]
pub fn console_log_from_wasm(_test: i32) {
  let vec = vec![0,1,2,3,4,5];
  let mut iter = (&vec).into_iter();

  while let Some(v) = iter.next() {
    let result = format!("{} {}", v * 2, "while by Example");
    log(&result)
  }

  vec.iter().for_each(|num| {
    let result = format!("{} {}", num * 2, "For each by Example");
    log(&result)
  });

  for (i, v) in vec.iter().chain(Some(42).iter()).enumerate() {
    let result1 = format!("{} {}", v * 2, "For by Example");
    let result2 = format!("{} {}", result1, "with index:");
    let result3 = format!("{} {}", result2, i);
    log(&result3)
  }

  for v in &vec {
    let result = format!("{} {}", v * 2, "For by Example");
    log(&result)
  }

  loop {
    let v = match iter.next() {
      Some(v) => v,
      None => break,
    };
    let result = format!("{} {}", v * 2, "Loop loop");
    log(&result)
  }

  // if _test {
  // }
  // let converted_test = String::from(_test);

  let result = format!("{} {}", "Got this from js:", _test);
  log(&result)

  // log(&_test.to_string());

  // log(&converted_test)

  // return result.into();

  // log("This console.log is from wasm and me! Congratulations");
  // log(&(test.to_owned() + &"hej".to_owned()));
}

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
  return a + b;
}

// Define our number of samples we handle at once
const NUMBER_OF_SAMPLES: usize = 1024;

// Create a static mutable byte buffers.
// We will use these for passing audio samples from
// javascript to wasm, and from wasm to javascript
// NOTE: global `static mut` means we will have "unsafe" code
// but for passing memory between js and wasm should be fine.
static mut INPUT_BUFFER: [u8; NUMBER_OF_SAMPLES] = [0; NUMBER_OF_SAMPLES];
static mut OUTPUT_BUFFER: [u8; NUMBER_OF_SAMPLES] = [0; NUMBER_OF_SAMPLES];

// Function to return a pointer to our
// output buffer in wasm memory
#[wasm_bindgen]
pub fn get_input_buffer_pointer() -> *const u8 {
  let pointer: *const u8;
  unsafe {
    pointer = INPUT_BUFFER.as_ptr();
  }

  return pointer;
}

// Function to return a pointer to our
// output buffer in wasm memory
#[wasm_bindgen]
pub fn get_output_buffer_pointer() -> *const u8 {
  let pointer: *const u8;
  unsafe {
    pointer = OUTPUT_BUFFER.as_ptr();
  }

  return pointer;
}

// Function to do the amplification.
// By taking the samples currently in the input buffer
// amplifying them, and placing the result in the output buffer
#[wasm_bindgen]
pub fn amplify_audio() {

  // Loop over the samples
  for i in 0..NUMBER_OF_SAMPLES {
    // Load the sample at the index
    let mut audio_sample: u8;
    unsafe {
      audio_sample = INPUT_BUFFER[i];
    }

    // Amplify the sample. All samples
    // Should be implemented as bytes.
    // Byte samples are represented as follows:
    // 127 is silence, 0 is negative max, 256 is positive max
    if audio_sample > 127 {
      let audio_sample_diff = audio_sample - 127;
      audio_sample = audio_sample + audio_sample_diff;
    } else if audio_sample < 127 {
      audio_sample = audio_sample / 2;
    }

    // Store the audio sample into our output buffer
    unsafe {
      OUTPUT_BUFFER[i] = audio_sample;
    }
  }
}