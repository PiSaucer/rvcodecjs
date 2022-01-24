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
    }
}
