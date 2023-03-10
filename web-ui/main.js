// SPDX-License-Identifier: AGPL-3.0-or-later

/*
 * RISC-V Instruction Encoder/Decoder
 *
 * Copyright (c) 2021-2022 LupLab @ UC Davis
 */

import { Instruction, convertRegToAbi } from "../core/Instruction.js";
import { FRAG } from "../core/Constants.js";
import { configDefault, COPTS_ISA } from "../core/Config.js";
import { buildSearchResults, clearSearchResults, renderSearchResults, iterateSearchResults, getSelectedMnemonic, buildPlaceholder, getPlaceholderString } from "./completion.js";

/* Define colors per frag ID */
const fragColorMap = {
  [FRAG.UNSD]: '--color-fg',
  [FRAG.CSR]: '--color-magenta',
  [FRAG.IMM]: '--color-blue',
  [FRAG.OPC]: '--color-red',
  [FRAG.PRED]: '--color-blue',
  [FRAG.RD]: '--color-green',
  [FRAG.RS1]: '--color-yellow',
  [FRAG.RS2]: '--color-magenta',
  [FRAG.RS3]: '--color-blue',
  [FRAG.SUCC]: '--color-magenta',
}

/* Fast access to selected document elements */
const input = document.getElementById('search-input');
const inputPlaceholder = document.getElementById('search-placeholder');
const abiParameter = document.getElementById('abi');
const isaParameter = document.getElementById('isa');
const searchResults = document.getElementById('search-result-list');

/**
 * Upon loading page or changing history, trigger conversion from hash paramters
 */
let originalDocumentTitle = '';
let titleSuffix = '';
window.addEventListener('load', (e) => {
  originalDocumentTitle = document.title;
  titleSuffix = ' - ' + originalDocumentTitle.split(' ')[0];
  hashChange(e.target.location.hash);
});
window.addEventListener('popstate', (e) => {
  hashChange(e.target.location.hash);
});

function hashChange(hash) {
  if (!hash) {
    // No hash params
    // Set input field
    input.value = "";
    // Set ABI parameter
    abiParameter.checked = configDefault.ABI;
    // Set ISA parameter
    isaParameter.value = configDefault.ISA.description;

  } else {
    // Hash params present
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
    // Set ABI parameter
    abiParameter.checked = (params.abi === "true");
    // Set ISA parameter
    isaParameter.value = params.isa || configDefault.ISA.description;
  }

  // Close search results and config popup, then execute the input
  searchResults.toggleAttribute('hidden', true);
  modalDiv.style.display = "none";
  runResult(false);
}

/**
 * Input callbacks
 */
function inputChange() {
  buildSearchResults();
}
input.addEventListener('input', function (event) {
  inputChange();
});

input.addEventListener('keydown', function (event) {
  if (event.key === 'Tab' || event.key === 'Enter') {
    // Complete input with placeholder value on 'Tab' or 'Enter'
    const selectedMne = getSelectedMnemonic();
    const inputMne = input.value.trimStart().split(' ')[0]?.toLowerCase();
    if (selectedMne !== undefined && inputMne !== selectedMne) {
      input.value += getPlaceholderString() + ' ';
      event.preventDefault(); // Prevent tab-indexing to next element
      inputChange();

    } else if (event.key === 'Enter') {
      // Run conversion when getting 'Enter'
      runResult();
      // Clear placeholder
      if (input.value.length > 0) {
        searchResults.toggleAttribute('hidden', true);
      }
    }

  } else if (event.key === 'ArrowDown') {
    // Next search result when 'ArrowDown'
    iterateSearchResults(true);
    buildPlaceholder();
    event.preventDefault(); // Prevent jumping to back of input

  } else if (event.key === 'ArrowUp') {
    // Prev search result when 'ArrowUp'
    iterateSearchResults(false);
    buildPlaceholder();
    event.preventDefault(); // Prevent jumping to front of input

  } else if (event.key === 'Escape') {
    // Invalidate iterator in case someone wants to force a bad instruction
    clearSearchResults();
    event.preventDefault();
  }
});

/**
 * Search results callbacks
 */
searchResults.addEventListener('click', function(event) {
  // Get mne from clicked search result
  const mne = event.srcElement.mne;

  // No mne, exit early
  if (mne === undefined) {
    return;
  }

  // Choose whether to autocomplete or run result
  const inputMne = input.value.trimStart().split(' ')[0]?.toLowerCase();
  if (inputMne !== mne) {
    // Complete input mne
    input.value = mne + ' ';
    buildSearchResults();
  } else {
    // Otherwise, run result
    runResult();
  }

  // Refocus on input
  input.focus();
});

/**
 * Execute instruction encoding and decoding
 */
function runResult(addToHistory = true) {
  // Get the instruction from input box
  let q = input.value.trim();
  const emptyQuery = q === "";

  // Push history state and set hash
  if (addToHistory) {
    // Build hash, but make it empty if input is empty
    const hash = emptyQuery ? ' ' : '#'
                                  + 'q='    + q.replace(/\s/g, '+')
                                  + '&abi=' + abiParameter.checked
                                  + '&isa=' + isaParameter.value;
    // Only push state if hash has changed
    if (hash.trimStart() !== window.location.hash) {
      history.pushState(null, null, hash);
    }
  }

  // Set title
  document.title = emptyQuery ? originalDocumentTitle : q + titleSuffix;

  // Reset UI and exit early if query is empty
  if (q === "") {
    document.getElementById('results-container-box').style.display = 'none';
    return;
  }

  // Convert instruction
  try {
    const inst = new Instruction(q,
      {
        ABI: abiParameter.checked,
        ISA: COPTS_ISA[isaParameter.value]
      });
    renderConversion(inst, abiParameter.checked);
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
function renderConversion(inst, abi=false) {
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
    let asm = abi ? convertRegToAbi(frag.asm) : frag.asm;
    let color = fragColorMap[frag.id];

    if (frag.mem) {
      asm = '(' + asm + ')';
    }
    return `<span class='${"fragId-" + frag.id}' style='color:var(${color})'>${asm}</span>`;
  });

  asmInst = asmTokens[0];
  for (let i = 1; i < asmTokens.length; i++) {
    // Append delimeter
    if (i === 1) {
      asmInst += ' ';
    }
    else if (!inst.asmFrags[i].mem || !/^(?:nz)?(?:u)?imm/.test(inst.asmFrags[i-1].field)) {
      asmInst += ', ';
    }

    // Append assembly fragment
    asmInst += asmTokens[i];
  }
  document.getElementById('asm-data').innerHTML = asmInst;

  // Display binary instruction
  let idx = 0;
  let binaryData = "";
  let binaryDiv = document.getElementById('binary-data');
  binaryDiv.innerHTML = "";
  let fragIdList = new Set();
  inst.binFrags.forEach(frag => {
    let color = fragColorMap[frag.id];

    // Separate bits into binary fragments
    let binaryFragment = document.createElement("span");
    binaryFragment.classList.add("binary-fragment");
    // Add fragID for each binary fragments
    binaryFragment.classList.add("fragId-" + frag.id);
    fragIdList.add("fragId-" + frag.id);
    binaryDiv.appendChild(binaryFragment);

    // Create tooltip for each fragment
    let tooltipFragment = document.createElement("span");
    tooltipFragment.textContent = frag.field + ((frag.id === FRAG.UNSD) ? " (unused)" : "");
    tooltipFragment.classList.add("binary-tooltip");
    binaryFragment.appendChild(tooltipFragment);

    // Add bits into each fragment
    let fragEndPosition = idx + frag.bits.length;
    [...frag.bits].forEach(bit => {
      let bitElm = `<span class='binary-bit' style='color: var(${color})'>${bit}</span>`;
      binaryFragment.innerHTML += bitElm;
      binaryData += bit;
      idx++;

      // Separate between every 4 bits
      if (idx%4 === 0) {
        if (idx === fragEndPosition) {
          binaryDiv.innerHTML += ' ';
        }
        else {
          binaryFragment.innerHTML += ' ';
        }
      }

      // A responsive break for every 16 bits
      if (idx%16 === 0) {
        if (idx === fragEndPosition) {
          binaryDiv.innerHTML += "<br class='binary-break'>";
        }
        else {
          binaryFragment.innerHTML += "<br class='binary-break'>";
        }
      }
    });
  });

  // Highlight feature
  let superHighlight = "yellow";
  let subHighlight = "var(--color-hl)";

  // Handle tooltip highlight for binary fragment. Info label only appears when showLabel is set true
  let tooltipBinaryDisplay = (binDiv, isDisplay, showLabel = false) => {
    // Set the options based on isDisplay
    let visibility = (isDisplay && showLabel)?"visible":"hidden";
    let backgroundColor = (isDisplay)?((showLabel)?superHighlight:subHighlight):"inherit";
    binDiv.childNodes.forEach(child => {
      if (child.classList) {
        // Handle binary bits
        if (child.classList.contains("binary-bit")) {
          child.style.backgroundColor = backgroundColor;
        }
        // Handle binary tooltip
        else if (child.classList.contains("binary-tooltip")) {
          child.style.visibility = visibility;
        }
      }
    });
  }

  let binDivMouseHandle = (binDiv, binDivList, isMouseOver, asmDiv = null) => {
    // Super highlighted for binary div
    tooltipBinaryDisplay(binDiv, isMouseOver, true);

    // Light highlighted for ASM div and other binary div
    if (asmDiv !== null)
      tooltipAsmDisplay(asmDiv, isMouseOver);

    for (let otherKey in binDivList) {
      let otherBinDiv = binDivList[otherKey];
      if (otherBinDiv !== binDiv) {
        tooltipBinaryDisplay(otherBinDiv, isMouseOver, false);
      }
    }
  }

  // Handle tooltip highlight for assembly fragment
  let tooltipAsmDisplay = (asmDiv, isDisplay, isSuper = false) => {
    asmDiv.style.backgroundColor = (isDisplay)?(isSuper?superHighlight:subHighlight):"inherit";
  }

  // Handle the tooltip function for each fragID
  fragIdList.forEach(id => {
    let fragList = document.getElementsByClassName(id);

    let asmDiv = null;
    let binDivList = {...fragList};
    if (id !== "fragId-" + FRAG.UNSD) {
      // ASM div is the first div in fragList
      asmDiv = fragList[0];
      // The rest is BIN fragments, so remove the first element (which is ASM)
      delete binDivList[0];

      // Handle tooltip for ASM div
      asmDiv.addEventListener("mouseover", () => {
        tooltipAsmDisplay(asmDiv, true, true);
        // Only highlight binary bits, but not show info label
        for (let key in binDivList) {
          tooltipBinaryDisplay(binDivList[key], true);
        }
      });

      // Remove highlight if hover out
      asmDiv.addEventListener("mouseout", () => {
        tooltipAsmDisplay(asmDiv, false);
        // Stop highlighted for other corresponding binary fragments
        for (let key in binDivList) {
          tooltipBinaryDisplay(binDivList[key], false);
        }
      });
    }

    // Handle tooltip for binary div
    for (let key in binDivList) {
      let binDiv = binDivList[key];
      binDiv.addEventListener("mouseover", () => {        
        binDivMouseHandle(binDiv, binDivList, true, asmDiv);
      })

      // Remove highlight if hover out
      binDiv.addEventListener("mouseout", () => {        
        binDivMouseHandle(binDiv, binDivList, false, asmDiv);
      });
    }
  })

  // Copy button function
  let copyBtn = {
    "asm-copy": inst.asm,
    "binary-copy": binaryData,
    "hex-copy": '0x' + inst.hex
  }

  for (let buttonId in copyBtn) {
    let button = document.getElementById(buttonId);
    button.addEventListener("click", () => {
      navigator.clipboard.writeText(copyBtn[buttonId]);
    })
  }
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

// Control the modal div
const modalDiv = document.getElementById("modal-container");
const parameterBtn = document.getElementById("parameter-button");
const closeBtn = document.getElementById('close');
const isaMenu = document.getElementById('isa');

// Add ISA option based on Config.js provides
for (let option in COPTS_ISA) {
  let isaOption = document.createElement("option");
  isaOption.text = option;
  isaOption.value = option;
  isaMenu.add(isaOption);
}

// When user clicks the button, display the modal div
parameterBtn.addEventListener("click", () => {
    modalDiv.style.display = "block";
  }
);

// When user clicks the close button or outside the modal div, close the div and update the result
function updateParameter() {
  modalDiv.style.display = "none";

  // Update input and search results
  const hidingSearchResults = searchResults.hasAttribute('hidden');
  inputChange();

  // Continue hiding search results if previously hidden
  if (hidingSearchResults) {
    searchResults.toggleAttribute('hidden', true);
  }

  // Run the input using the new settings
  runResult();
}

closeBtn.addEventListener("click", () => {
  updateParameter();
})

window.addEventListener("click", (event) => {
    if (event.target == modalDiv) {
      updateParameter();
    }
  }
)
