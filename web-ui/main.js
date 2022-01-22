import { Instruction } from "../core/Instruction.js";

const colors = [
    '--color-other-yellow',
    '--color-other-red',
    '--color-other-pink',
    '--color-other-cyan',
    '--color-other-blue',
]

const fieldColorMap = {
    'opcode': colors[0],
    'funct3': colors[0],
    'funct7': colors[0],
    'rs1': colors[2],
    'rs2': colors[4],
    'rd': colors[3]
}

const resultsContainerElm = document.getElementsByClassName('rows-container')[0];
const resultsLabelElm = document.getElementById('results-label');

/** @type {Instruction} instruction */
let previousInstruction = null;

let ResultState = {
    isErrorShown:false,
    resultInnerHtml: resultsContainerElm.innerHTML
}


window.onload = function () {
    const input = document.getElementById('search-input');
    if (!window.location.hash) {
        return; //no instruction
    }
    //set input value to data encoded in url
    input.value = decodeURIComponent(window.location.hash.replace('#', ''));

    //send input event to trigger on-input handler
    let event = new Event('keydown');
    event.key = 'Enter'
    input.dispatchEvent(event);
}

document.getElementById("binary-data").ondblclick = event => {
    event.stopPropagation();
    //copy binary-data to clipboard
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

/** @param {Instruction} instruction */
function renderInstructionData(instruction) {

    if(instruction && ResultState.isErrorShown){
        ResultState.isErrorShown = false;
        resultsContainerElm.innerHTML = ResultState.resultInnerHtml;
        resultsLabelElm.innerText = '[ Results ]'
    }
    document.getElementById('hex-data').innerText = instruction.hex;
    document.getElementById('format-data').innerText = instruction.format;
    document.getElementById('set-data').innerText = instruction.isa;
    document.getElementById('set-subtitle-data').innerText = instruction.setSubtitle;

    let asmElmString = instruction.assembly;

    let frags = instruction.fragments;
    frags.sort((a, b) => a.index - b.index); //sort by index

    let head = document.getElementsByClassName('binary-bit').length-1;
    let handledAsmInstructions = [];
    for (let frag of frags) {
        console.log(frag);

        //set binary bits
        for (let bit of Array.from(frag.bits).reverse()) {
            let bitElm = document.getElementsByClassName('binary-bit')[head];
            bitElm.innerText = bit;
            bitElm.style.color = `var(${fieldColorMap[frag.field]})`;
            head--;
        }

        //create assembly data element
        if (!handledAsmInstructions.includes(frag.assembly)) {
            handledAsmInstructions.push(frag.assembly)
            asmElmString = asmElmString.replace(frag.assembly, 
                `<span style='color:var(${fieldColorMap[frag.field]})'>${
                    frag.assembly
                }<span/>`)
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
    errorTitle.textContent = 'ERROR = '

    let errorData = document.createElement('div')
    errorData.classList.add('result-row');
    errorData.textContent = error;

    resultsContainerElm.append(errorTitle);
    resultsContainerElm.append(errorData);
}
