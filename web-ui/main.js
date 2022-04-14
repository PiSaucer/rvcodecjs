import { Instruction } from "../core/Instruction.js";

const colors = [
  '--color-other-yellow',
  '--color-other-red',
  '--color-other-pink',
  '--color-other-cyan',
  '--color-other-blue',
]

// note: all imm values are colored red dynamically
const fieldColorMap = {
  'opcode': '--color-other-yellow',
  'funct3': '--color-other-yellow',
  'funct7': '--color-other-yellow',
  'funct12': '--color-other-yellow',

  'rs1': '--color-other-pink',
  'rs2': '--color-other-blue',
  'rd': '--color-other-cyan',

  'shamt': '--color-other-red',
  'higher-order immediate': '--color-other-red',

  'fm': '--color-other-pink',
  'pred': '--color-other-blue',
  'succ': '--color-other-purple'
}

const resultsContainerElm = document.getElementsByClassName('rows-container')[0];
const resultsLabelElm = document.getElementById('results-label');

let previousInstruction = null;

let ResultState = {
  isErrorShown:false,
  resultInnerHtml: resultsContainerElm.innerHTML
}

// Upon page loading
window.onload = function () {
  const input = document.getElementById('search-input');

  if (!window.location.hash) {
    // no instruction
    return;
  }
  // set input value to URL's hash (minus '#')
  input.value = decodeURIComponent(window.location.hash.substr(1));

  // send input event to trigger on-input handler
  let event = new Event('keydown');
  event.key = 'Enter'
  input.dispatchEvent(event);
}

document.getElementById("binary-data").ondblclick = event => {
  event.stopPropagation();
  // copy binary-data to clipboard
  navigator.clipboard.writeText(previousInstruction.binary).then(() => {
    const binaryDataElm = document.getElementById("binary-data")
    binaryDataElm.classList.add('copied')
    setTimeout(() => {
      binaryDataElm.classList.remove('copied')
    }, 300);

    let copiedText = document.createElement('div')
    copiedText.classList.add('copied-text-popup')
    copiedText.innerText = '[ copied to clipboard ]'
    binaryDataElm.appendChild(copiedText);
    setTimeout(() => {
      copiedText.remove()
    }, 2000);
  });
};

// Input from search box
document.getElementById('search-input').onkeydown = function (event) {
  if (event.key != 'Enter') {
    return;
  }

  document.getElementById('results-container-box').style.display = 'initial';

  let value = event.currentTarget.value.trim();
  try {
    const instructionData = new Instruction(value);
    previousInstruction = instructionData;
    renderInstructionData(instructionData);
  } catch (error) { renderError(error); }
  window.location.hash = value;
}

function renderInstructionData(instruction) {

  if(instruction && ResultState.isErrorShown){
    ResultState.isErrorShown = false;
    resultsContainerElm.innerHTML = ResultState.resultInnerHtml;
    resultsLabelElm.innerText = '[ Results ]'
  }
  document.getElementById('hex-data').innerText = instruction.hex;
  document.getElementById('format-data').innerText = instruction.format;
  document.getElementById('set-data').innerText = instruction.isa;

  let asmElmString = instruction.assembly;

  // sort by index
  let frags = instruction.fragments;
  frags.sort((a, b) => a.index - b.index);

  let head = document.getElementsByClassName('binary-bit').length-1;
  let handledAsmInstructions = [];
  for (let frag of frags) {
    console.log(frag);

    let color = fieldColorMap[frag.field];
    if(!color && frag.field.includes('imm')) {
      color = '--color-other-red'
    }

    //set binary bits
    for (let bit of Array.from(frag.bits).reverse()) {
      let bitElm = document.getElementsByClassName('binary-bit')[head];
      bitElm.innerText = bit;
      bitElm.style.color = `var(${color})`;
      head--;
    }

    //create assembly data element
    if (!handledAsmInstructions.includes(frag.assembly)) {
      handledAsmInstructions.push(frag.assembly)
      asmElmString = asmElmString.replace(frag.assembly,
        `<span style='color:var(${color})'>${frag.assembly}<span/>`)
    }
  }
  document.getElementById('asm-data').innerHTML = asmElmString;

  ResultState.resultInnerHtml = resultsContainerElm.innerHTML;
}

/** @param {string} error */
function renderError(error) {
  if (!ResultState.isErrorShown) {
    ResultState.resultInnerHtml = resultsContainerElm.innerHTML;
    resultsLabelElm.innerText = '[ Error ]'
    ResultState.isErrorShown = true;
  }

  resultsContainerElm.innerHTML = '';

  let errorTitle = document.createElement('div')
  errorTitle.classList.add('result-row', 'result-row-title');
  errorTitle.textContent = 'Error = '

  let errorData = document.createElement('div')
  errorData.classList.add('result-row');
  errorData.textContent = error;

  resultsContainerElm.append(errorTitle);
  resultsContainerElm.append(errorData);
}
