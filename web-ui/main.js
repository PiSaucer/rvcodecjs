// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * RISC-V Instruction Encoder/Decoder
 *
 * Copyright (c) 2021-2022 LupLab @ UC Davis
 */

import { Instruction } from "../core/Instruction.js";

/* Import colors from CSS */
const colors = [
  '--color-yellow',
  '--color-orange',
  '--color-red',
  '--color-magenta',
  '--color-violet',
  '--color-blue',
  '--color-cyan',
  '--color-green',
]

/* Define colors per field type */
const fieldColorMap = {
  /* Operation */
  'opcode': '--color-orange',
  'funct3': '--color-orange',
  'funct7': '--color-orange',
  'funct12': '--color-orange',

  /* Registers */
  'rs1': '--color-cyan',
  'rs2': '--color-violet',
  'rd': '--color-yellow',

  /* Immediate */
  'shamt': '--color-blue',
  'imm': '--color-blue',

  /* Fence */
  'fm': '--color-green',
  'pred': '--color-blue',
  'succ': '--color-cyan',

  /* CSR */
  'csr': '--color-green',
}

/* Fast access to selected document elements */
const input = document.getElementById('search-input');

/**
 * Upon loading page, trigger conversion if hash params exist
 */
window.onload = function () {
  // No hash params
  if (!window.location.hash) {
    return;
  }

  // Get hash parameters as a map
  let hash = window.location.hash.substring(1);
  let params = hash
    .split('&')
    .map(kv => kv.split('=', 2))
    .reduce((res, [k, v]) =>
      ({ ...res, [k]: v.replace(/\+/g, ' ') }),
      {}
    );

  // Set input field
  input.value = params.q;

  // Trigger input event to run conversion
  let event = new Event('keydown');
  event.key = 'Enter';
  input.dispatchEvent(event);
}

/**
 * Conversion upon input event
 */
input.onkeydown = function (event) {
  // Run conversion when getting 'Enter'
  if (event.key !== 'Enter') {
    return;
  }

  // Get query
  let q = event.currentTarget.value.trim();

  // Reset UI if query is empty
  if (q === "") {
    document.getElementById('results-container-box').style.display = 'none';
    history.pushState(null, null, ' ');
    return;
  }

  // Set hash
  window.location.hash = 'q=' + q.replace(/\s/g, '+');

  // Convert instruction
  try {
    const inst = new Instruction(q);
    renderConversion(inst);
  } catch (error) {
    renderError(error);
  }

  // Display conversion results
  document.getElementById('results-container-box').style.display = 'initial';
}

/**
 * Render successful conversion
 * @param {Object} inst
 */
function renderConversion(inst) {
  document.getElementById("valid-result").style.display = "inherit";
  document.getElementById("error-container").style.display = "none";
  // Display hex instruction
  document.getElementById('hex-data').innerText = '0x' + inst.hex;

  // Display format and ISA
  document.getElementById('fmt-data').innerText = inst.fmt;
  document.getElementById('isa-data').innerText = inst.isa;

  // Display assembly instruction
  let asmInst;
  let asmTokens = inst.asmFrags.map(frag => {
    let asm = frag.asm;
    let field = frag.field.match(/^[a-z0-9]+/);
    let color = fieldColorMap[field];

    return `<span style='color:var(${color})'>${asm}<span/>`;
  });

  if (inst.asmFrags.length === 4 && inst.asmFrags[2].field.startsWith('imm')) {
    // Render load-store instruction
    asmInst = `${asmTokens[0]} ${asmTokens[1]}, ${asmTokens[2]}(${asmTokens[3]})`;
  } else {
    // Render regular instruction
    asmInst = `${asmTokens[0]} ` + asmTokens.splice(1).join(', ');
  }
  document.getElementById('asm-data').innerHTML = asmInst;

  // Display binary instruction
  let idx = 0;
  inst.binFrags.forEach(frag => {
    let field = frag.field.match(/^[a-z0-9]+/);
    let color = fieldColorMap[field];

    [...frag.bits].forEach(bit => {
      let bitElm = document.getElementsByClassName('binary-bit')[idx];
      bitElm.innerText = bit;
      bitElm.style.color = `var(${color})`;
      idx++;
    });
  });
}

/**
 * Render conversion error
 * @param {String} error
 */
function renderError(error) {
  // log them to the console - this provides an quick way to get a traceback in the browser
  console.error(error);

  const resultsContainerElm = document.getElementById('error-container');
  resultsContainerElm.style.display = "inherit";
  document.getElementById("valid-result").style.display = "none";

  // Reset result container
  resultsContainerElm.innerHTML = '';

  // Create row title + data
  let errorTitle = document.createElement('div')
  errorTitle.classList.add('result-row', 'result-row-title');
  errorTitle.textContent = 'Error = '

  let errorData = document.createElement('div')
  errorData.classList.add('result-row');
  errorData.style.color = 'var(--color-red)';
  errorData.textContent = error;

  // Display row
  resultsContainerElm.append(errorTitle);
  resultsContainerElm.append(errorData);
}

/**
 * Focus on input box when pressing '/'
 */
document.addEventListener("keydown", e => {
  // Ignore any other keys than '/'
  if (e.key !== "/" || e.ctrlKey || e.metaKey)
    return;
  // Ignore event if focus is currently in a form
  if (/^(?:input|textarea|select|button)$/i.test(e.target.tagName))
    return;

  e.preventDefault();
  input.focus();
});
