export class Instruction {

}

class Fragment {
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
