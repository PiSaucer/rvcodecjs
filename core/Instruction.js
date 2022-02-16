import { BASE } from './Constants.js';
import { Decoder } from './Decoder.js';
import { Encoder } from './Encoder.js';

export class Instruction {
    /**
     * Creates an Instruction represented in multiple formats
     * @param {String} instruction
     */
    constructor(instruction) {
        // Hard coded for now
        this.isa = "RV32I";

        // Determine format of instruction and decode
        this.instruction = instruction;
        this.decodeInstruction();
    }

    // Check format of instruction and decode accordingly
    decodeInstruction() {
        // Regular expression for 32 bit binary instruction
        var binaryRegEx = /^[01]{1,32}$/;
        // Regular expression for 8 digit hexadecimal instruction
        var hexRegEx = /^(0x)?[0-9a-fA-F]{1,8}$/;
        // Regular expression for alphabetic character
        var alphaRegEx = /^[a-zA-Z]$/;

        // If instruction is in binary format
        var instruction = this.instruction.replace(/\s/g,'')
        if (binaryRegEx.test(instruction)) {
            this.binary = instruction.padStart(32, '0');
            // Convert to hex
            this.hex = convertBinToHex(instruction);
            // Convert to assembly
            this.convertToAsm();
        // If instruction is in hex format
        } else if (hexRegEx.test(this.instruction)) {
            this.hex = this.instruction.padStart(8, '0');
            // Convert to binary
            this.binary = convertHexToBin(this.instruction);
            // Convert to assembly
            this.convertToAsm();
        // If instruction starts with a letter, send to encoder for parsing
        } else if (alphaRegEx.test(this.instruction[0])) {
            this.assembly = this.instruction;
            // Convert to binary
            this.convertToBin();
            // Convert to hex
            this.hex = convertBinToHex(this.binary);
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
        this.format = decoder.format;
    }

    // Convert instruction to binary
    convertToBin() {
        // Create an Encoder for the instruction
        var encoder = new Encoder(this.assembly);

        // Get binary and fragments from Encoder
        this.binary = encoder.binary;
        this.fragments = encoder.fragments;
        this.format = encoder.format;
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

// Check if operation is a shift
export function isShift(operation) {
    var shiftOperations = ["srli", "srai", "slli"];
    if (shiftOperations.includes(operation)) {
        return true;
    }
    return false;
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
