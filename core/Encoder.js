import { Fragment } from './Instruction.js'

export class Encoder {
    /**
     * Creates an Encoder to convert an assembly instruction to binary
     * @param {String} assembly
     */
    constructor(assembly) {
        this.assembly = assembly;

        // Create an array of fragments
        /** @type {Fragment[]} */
        this.fragments = [];

        // Convert assembly instruction to binary
        this.convertAsmToBin();
    }

    // Convert assembly instruction to binary
    convertAsmToBin() {
        // Set all characters to lower case
        this.assembly = this.assembly.toLowerCase();
        // The first word of the assembly instruction is the opcode
        this.operation = this.assembly.split(" ")[0];
    }
}
