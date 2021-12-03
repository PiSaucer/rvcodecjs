import { BASE } from './Constants.js';
import { Decoder } from './Decoder.js';

export class Instruction {
    /**
     * Creates an Instruction represented in multiple formats
     * @param {String} instruction
     */
    constructor(instruction) {
        // Hard coded for now
        this.isa = "RV32I";

        // Determine format of instruction and decode
        this.decodeInstruction(instruction);

        // Print values of Instruction
        console.log("ASSEMBLY: " + this.assembly);
        console.log("BINARY: " + this.binary);
        console.log("HEXADECIMAL: " + this.hex);
        console.log("FORMAT: " + this.format);
        console.log("SET: " + this.isa);
        console.log(this.fragments);
    }

    // Check format of instruction and decode accordingly
    decodeInstruction(instruction) {
        // Regular expression for 32 bit binary instruction
        var binaryRegEx = /^[01]{32}$/;
        // Regular expression for 8 digit hexadecimal instruction
        var hexRegEx = /^(0x)?[0-9a-fA-F]{8}$/;

        // If instruction is in binary format
        if (binaryRegEx.test(instruction)) {
            this.binary = instruction;
            // Convert to hex
            this.hex = convertBinToHex(instruction);
            // Convert to assembly
            this.convertToAsm();
        // If instruction is in hex format
        } else if (hexRegEx.test(instruction)) {
            this.hex = instruction;
            // Convert to binary
            this.binary = convertHexToBin(instruction);
            // Convert to assembly
            this.convertToAsm();
        } else {
            throw "Invalid instruction";
        }
    }

    // Convert instruction to assembly
    convertToAsm() {
        // Create a Decoder for the instruction
        var decoder = new Decoder(this.binary);

        // Get assembly and fragments from Decoder
        this.assembly = decoder.assembly;
        this.fragments = decoder.fragments;
    }
}

// Convert hexadecimal to 32 bit binary string
function convertHexToBin(hex) {
    var bin = parseInt(hex, BASE.HEX).toString(BASE.BINARY);
    // Pad binary string with zeros while length < 32
    return bin.padStart(32, '0');
}

// Convert binary to 8 digit hexadecimal
function convertBinToHex(bin) {
    var hex = parseInt(bin, BASE.BINARY).toString(BASE.HEX);
    // Pad hex string with zeros while length < 8
    hex = hex.padStart(8, '0');
    // Add 0x prefix
    return '0x' + hex;
}

export class Fragment {
    /**
     * Represents a fragment of the instruction
     * @param {String} assembly (ex. "x5")
     * @param {String} bits (ex. "01101")
     * @param {Number} index - start index of bits (ex. 7)
     * @param {String} field (ex. "rd")
     */
    constructor(assembly, bits, index, field) {
        this.assembly = assembly;
        this.bits = bits;
        this.index = index;
        this.field = field;
    }
}
