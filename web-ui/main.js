let instruction = {
    assembly: 'ADD x5,x6,x7',
    hex: '7302B3',
    binary: '00000000011100110000001010110011',
    set: 'RV32I',
    setSubtitle: 'Base Integer Set',
    format: 'R-TYPE',
    Fragments: [
        {
            assembly: 'ADD',
            bits: '0110011',
            field: 'opcode',
            index: 0
        },
        {
            assembly: 'ADD',
            bits: '000',
            field: 'funct3',
            index: 12
        },
        {
            assembly: 'ADD',
            bits: '0000000',
            field: 'funct7',
            index: 25
        },
        {
            assembly: 'x6',
            bits: '00110',
            field: 'rs1',
            index: 15
        },
        {
            assembly: 'x7',
            bits: '00111',
            field: 'rs2',
            index: 20
        },
        {
            assembly: 'x5',
            bits: '00101',
            field: 'rd',
            index: 7
        }
    ]
}

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

document.getElementById('search-input').onkeydown = function (event) {
    if (event.key != 'Enter') {
        return;
    }    let value = event.currentTarget.value.trim();

    //TODO call core with search value to get instructionData
    const instructionData = instruction;

    if (Math.random() > 0.5) renderInstructionData(instructionData);
    else renderError({ name: 'Error Name', details: 'Details about why the error occured.' });

    window.location.hash = value;
}

function renderInstructionData(instruction) {

    if(instruction && ResultState.isErrorShown){
        ResultState.isErrorShown = false;
        resultsContainerElm.innerHTML = ResultState.resultInnerHtml;
        resultsLabelElm.innerText = '[ Results ]'
    }
    document.getElementById('hex-data').innerText = '0x' + instruction.hex;
    document.getElementById('format-data').innerText = instruction.format;
    document.getElementById('set-data').innerText = instruction.set;
    document.getElementById('set-subtitle-data').innerText = instruction.setSubtitle;

    let asmElmString = instruction.assembly;

    let frags = instruction.Fragments;
    frags.sort((a, b) => a.index - b.index); //sort by index

    let head = 0;
    let handledAsmInstructions = [];
    for (let frag of frags) {
        console.log(frag);

        //set binary bits
        for (let bit of Array.from(frag.bits)) {
            let bitElm = document.getElementsByClassName('binary-bit')[head];
            bitElm.innerText = bit;
            bitElm.style.color = `var(${fieldColorMap[frag.field]})`;
            head++;
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

function renderError(error) {
    if (!ResultState.isErrorShown) {
        ResultState.resultInnerHtml = resultsContainerElm.innerHTML;
        resultsLabelElm.innerText = '[ Error ]'
        ResultState.isErrorShown = true;
    }

    resultsContainerElm.innerHTML = '';

    let errorNameTitle = document.createElement('div')
    errorNameTitle.classList.add('result-row', 'result-row-title');
    errorNameTitle.textContent = 'ERROR = '

    let errorNameData = document.createElement('div')
    errorNameData.classList.add('result-row');
    errorNameData.textContent = error.name

    let errorDetailsTitle = document.createElement('div')
    errorDetailsTitle.classList.add('result-row', 'result-row-title');
    errorDetailsTitle.textContent = 'DETAILS = '

    let errorDetailsData = document.createElement('div')
    errorDetailsData.classList.add('result-row');
    errorDetailsData.textContent = error.details

    resultsContainerElm.append(errorNameTitle)
    resultsContainerElm.append(errorNameData)
    resultsContainerElm.append(errorDetailsTitle)
    resultsContainerElm.append(errorDetailsData)
}
