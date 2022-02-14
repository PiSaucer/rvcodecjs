import { BASE, FIELD_COMMON, XLEN, OPCODE,
        FIELD_RTYPE, FIELD_ITYPE, FIELD_STYPE,
        FIELD_BTYPE, FIELD_UTYPE, FIELD_JTYPE,
        FIELD_SYSTEM, FIELD_FENCE, OPERATIONS } from './Constants.js'

import { Fragment } from './Instruction.js'

export class Decoder {
    /**
     * Creates an Decoder to convert a binary instruction to assembly
     * @param {String} binary
     */
    constructor(binary) {
        this.binary = binary;

        // Create an array of fragments
        /** @type {Fragment[]} */
        this.fragments = [];

        // Convert instruction to assembly
        this.convertBinToAsm();
    }

    // Convert binary instruction to assembly
    convertBinToAsm() {
        // Use opcode to determine instruction type
        this.opcode = this.getBits(FIELD_COMMON.OPCODE.START,
                                    FIELD_COMMON.OPCODE.END);

        switch (this.opcode) {
            // R-TYPE
            case OPCODE.RTYPE:
                this.decodeRType();
                this.format = "R-TYPE";
                break;
            // I-TYPE
            case OPCODE.ITYPE:
            case OPCODE.JALR:
            case OPCODE.LOAD:
                this.decodeIType();
                this.format = "I-TYPE";
                break;
            // S-TYPE
            case OPCODE.STYPE:
                this.decodeSType();
                this.format = "S-TYPE";
                break;
            // B-TYPE
            case OPCODE.BTYPE:
                this.decodeBType();
                this.format = "B-TYPE";
                break;
            // U-TYPE:
            case OPCODE.LUI:
            case OPCODE.AUIPC:
                this.decodeUType();
                this.format = "U-TYPE";
                break;
            // J-TYPE:
            case OPCODE.JTYPE:
                this.decodeJType();
                this.format = "J-TYPE";
                break;
            // SYSTEM:
            case OPCODE.SYSTEM:
                this.decodeSystem();
                this.format = "SYSTEM";
                break;
            // FENCE:
            case OPCODE.FENCE:
                this.decodeFence();
                this.format = "FENCE";
                break;
            // Invalid opcode
            default:
                throw "Invalid opcode";
        }
    }

    // Given start and end index, return corresponding bits
    getBits(indStart, indEnd) {
        return this.binary.substring(XLEN.RV32 - (indEnd + 1),
                                    XLEN.RV32 - indStart);
    }

    /**
     * Decodes R-type instruction
     */
    decodeRType() {
        // Get bits for each field
        var rd = this.getBits(FIELD_COMMON.RD.START, FIELD_COMMON.RD.END);
        var funct3 = this.getBits(FIELD_COMMON.FUNCT3.START,
                                    FIELD_COMMON.FUNCT3.END);
        var rs1 = this.getBits(FIELD_COMMON.RS1.START, FIELD_COMMON.RS1.END);
        var rs2 = this.getBits(FIELD_COMMON.RS2.START, FIELD_COMMON.RS2.END);
        var funct7 = this.getBits(FIELD_RTYPE.FUNCT7.START,
                                    FIELD_RTYPE.FUNCT7.END);

        // Convert register numbers from binary to decimal
        var reg1 = convertBinRegister(rs1);
        var reg2 = convertBinRegister(rs2);
        var destReg = convertBinRegister(rd);

        // Check for operation in rfunct dictionary
        var operation;
        for (var op in OPERATIONS) {
            if (OPERATIONS[op].FUNCT3 == funct3 &&
                OPERATIONS[op].FUNCT7 == funct7) {
                    operation = op;
            }
        }

        if (typeof operation === 'undefined') {
            throw "Invalid funct3 or funct7";
        }

        // Create fragments for each field
        this.fragments.push(new Fragment(operation, this.opcode,
                            FIELD_COMMON.OPCODE.START, "opcode"));
        this.fragments.push(new Fragment(operation, funct3,
                            FIELD_COMMON.FUNCT3.START, "funct3"));
        this.fragments.push(new Fragment(operation, funct7,
                            FIELD_RTYPE.FUNCT7.START, "funct7"));
        this.fragments.push(new Fragment(reg1, rs1,
                            FIELD_COMMON.RS1.START, "rs1"));
        this.fragments.push(new Fragment(reg2, rs2,
                            FIELD_COMMON.RS2.START, "rs2"));
        this.fragments.push(new Fragment(destReg, rd,
                            FIELD_COMMON.RD.START, "rd"));

        // Construct assembly instruction
        this.assembly = renderAsmInstruction([operation, destReg, reg1, reg2]);
    }

    /**
     * Decodes I-type instruction
     */
    decodeIType() {
        // Get bits for each field
        var rd = this.getBits(FIELD_COMMON.RD.START, FIELD_COMMON.RD.END);
        var funct3 = this.getBits(FIELD_COMMON.FUNCT3.START,
                                    FIELD_COMMON.FUNCT3.END);
        var rs1 = this.getBits(FIELD_COMMON.RS1.START, FIELD_COMMON.RS1.END);
        var highImm = this.getBits(FIELD_ITYPE.HIGHIMM.START,
                                    FIELD_ITYPE.HIGHIMM.END);

        // Set to true if operation is a shift (slli, srai, srli)
        var shift = false;

        // Define funct3 + opcode / high-order immediate bits
        var ifunct = {  // funct3 + opcode bits
                        "0000010011": "addi",
                        "0001100111": "jalr",
                        "0000000011": "lb",
                        "0010010011": "slli",
                        "0010000011": "lh",
                        "0100010011": "slti",
                        "0100000011": "lw",
                        "0110010011": "sltiu",
                        "1000010011": "xori",
                        "1000000011": "lbu",
                        "1010000011": "lhu",
                        "1100010011": "ori",
                        "1110010011": "andi",
                        // funct3 + high-order immediate bits
                        "1010000000": "srli",
                        "1010100000": "srai"
        };

        var funct = funct3 + this.opcode;
        // SRAI/SRLI have the same opcode (use high-order immediate instead)
        if (funct3 == "101") {
            funct = funct3 + highImm;
        }

        // Check for operation using funct3 and opcode / high-order immediate
        if (funct in ifunct) {
            var operation = ifunct[funct];
        } else {
            throw "Invalid funct3";
        }

        // Check if operation is a shift
        var shiftOperations = ["srli", "srai", "slli"];
        if (shiftOperations.includes(operation)) {
            shift = true;
        }

        // Convert register numbers from binary to decimal
        var reg1 = convertBinRegister(rs1);
        var destReg = convertBinRegister(rd);

        // Create fragments for each field
        this.fragments.push(new Fragment(operation, this.opcode,
                                        FIELD_COMMON.OPCODE.START, "opcode"));
        this.fragments.push(new Fragment(operation, funct3,
                                        FIELD_COMMON.FUNCT3.START, "funct3"));
        this.fragments.push(new Fragment(reg1, rs1,
                                        FIELD_COMMON.RS1.START, "rs1"));
        this.fragments.push(new Fragment(destReg, rd,
                                        FIELD_COMMON.RD.START, "rd"));

        // For shift operations: can only use lower 5 bits of imm for shift
        if (shift) {
            // Get bits for shamt field
            var shamt = this.getBits(ITYPE.SHAMT.START, ITYPE.SHAMT.END);

            // Parse shamt bits to decimal
            var shiftAmt = parseInt(shamt, BASE.BINARY);

            // Create higher-order immediate fragment
            this.fragments.push(new Fragment(operation, highImm,
                        FIELD_ITYPE.HIGHIMM.START, "higher-order immediate"));
            // Create shamt fragment
            this.fragments.push(new Fragment(shiftAmt, shamt,
                        FIELD_ITYPE.SHAMT.START, "shamt"));

            // Construct assembly instruction
            this.assembly = renderAsmInstruction([operation, destReg, reg1,
                                                shamt]);

        } else {
            // Get bits for imm[11:0] field
            var imm = this.getBits(FIELD_ITYPE.IMM11.START,
                                    FIELD_ITYPE.IMM11.END);

            // Convert immediate from binary to decimal
            var immediate = parseImm(imm);

            // Create immediate fragment
            this.fragments.push(new Fragment(immediate, imm,
                                FIELD_ITYPE.IMM11.START, "imm[11:0]"));

            // Construct assembly instruction
            if (this.opcode == OPCODE.LOAD) {
                this.assembly = renderLoadStoreInstruction([operation, destReg,
                                                        immediate, reg1]);
            } else {
                this.assembly = renderAsmInstruction([operation, destReg, reg1,
                                                    immediate]);
            }
        }
    }

    /**
     * Decodes S-type instruction
     */
    decodeSType() {
        // Define funct3 bits
        let sfunct3 = { "000": "sb",
                        "001": "sh",
                        "010": "sw"
        };

        // Get bits for each field
        var funct3 = this.getBits(FIELD_COMMON.FUNCT3.START,
                                    FIELD_COMMON.FUNCT3.END);
        var rs1 = this.getBits(FIELD_COMMON.RS1.START, FIELD_COMMON.RS1.END);
        var rs2 = this.getBits(FIELD_COMMON.RS2.START, FIELD_COMMON.RS2.END);
        var imm4_0 = this.getBits(FIELD_STYPE.IMM4.START, FIELD_STYPE.IMM4.END);
        var imm11_5 = this.getBits(FIELD_STYPE.IMM11.START,
                                    FIELD_STYPE.IMM11.END);

        // Parse binary immediate to decimal
        var imm = imm11_5 + imm4_0;
        var immediate = parseImm(imm);

        // Convert binary register numbers to assembly format
        var reg1 = convertBinRegister(rs1);
        var reg2 = convertBinRegister(rs2);

        // Check for operation using funct3
        if (funct3 in sfunct3) {
            var operation = sfunct3[funct3];
        } else {
            throw "Invalid funct3";
        }

        // Create fragments for each field
        this.fragments.push(new Fragment(operation, this.opcode,
                                        FIELD_COMMON.OPCODE.START, "opcode"));
        this.fragments.push(new Fragment(operation, funct3,
                                        FIELD_COMMON.FUNCT3.START, "funct3"));
        this.fragments.push(new Fragment(reg1, rs1,
                                        FIELD_COMMON.RS1.START, "rs1"));
        this.fragments.push(new Fragment(reg2, rs2,
                                        FIELD_COMMON.RS2.END, "rs2"));
        this.fragments.push(new Fragment(immediate, imm4_0,
                                        FIELD_STYPE.IMM4.START, "imm[4:0]"));
        this.fragments.push(new Fragment(immediate, imm11_5,
                                        FIELD_STYPE.IMM11.START, "imm[11:5]"));

        // Construct assembly instruction
        this.assembly = renderLoadStoreInstruction([operation, reg2,
                                                immediate, reg1]);
    }

    /**
     * Decodes B-type instruction
     */
    decodeBType() {
        // Define funct3 bits
        let bfunct3 = { "000": "beq",
                        "001": "bne",
                        "100": "blt",
                        "101": "bge",
                        "110": "bltu",
                        "111": "bgeu"
        };

        // Get bits for each field
        var funct3 = this.getBits(FIELD_COMMON.FUNCT3.START,
                                FIELD_COMMON.FUNCT3.END);
        var rs1 = this.getBits(FIELD_COMMON.RS1.START,
                                FIELD_COMMON.RS1.END);
        var rs2 = this.getBits(FIELD_COMMON.RS2.START, FIELD_COMMON.RS2.END);
        var imm4_1 = this.getBits(FIELD_BTYPE.IMM4.START, FIELD_BTYPE.IMM4.END);
        var imm11 = this.getBits(FIELD_BTYPE.IMM11.START,
                                FIELD_BTYPE.IMM11.END);
        var imm10_5 = this.getBits(FIELD_BTYPE.IMM10.START,
                                FIELD_BTYPE.IMM10.END);
        var imm12 = this.getBits(FIELD_BTYPE.IMM12.START,
                                FIELD_BTYPE.IMM12.END);

        // imm[0] is always zero for B-type instructions
        var imm0 = '0';

        // Check for operation using funct3
        if (funct3 in bfunct3) {
            var operation = bfunct3[funct3];
        } else {
            throw "Invalid funct3";
        }

        // Concatenate binary bits imm[12|10:5], imm[4:1|11], and imm[0]
        var imm = imm12 + imm11 + imm10_5 + imm4_1 + imm0;

        // Parse binary registers / immediate to decimal
        var reg1 = convertBinRegister(rs1);
        var reg2 = convertBinRegister(rs2);
        var immediate = parseImm(imm);

        // Create fragments for each field
        this.fragments.push(new Fragment(operation, this.opcode,
                                        FIELD_COMMON.OPCODE.START, "opcode"));
        this.fragments.push(new Fragment(operation, funct3,
                                        FIELD_COMMON.FUNCT3.START, "funct3"));
        this.fragments.push(new Fragment(reg1, rs1,
                                        FIELD_COMMON.RS1.START, "rs1"));
        this.fragments.push(new Fragment(reg2, rs2,
                                        FIELD_COMMON.RS2.START, "rs2"));
        this.fragments.push(new Fragment(immediate, imm12,
                                        FIELD_BTYPE.IMM12.START, "imm[12]"));
        this.fragments.push(new Fragment(immediate, imm10_5,
                                        FIELD_BTYPE.IMM10.START, "imm[10:5]"));
        this.fragments.push(new Fragment(immediate, imm4_1,
                                        FIELD_BTYPE.IMM4.START, "imm[4:1]"));
        this.fragments.push(new Fragment(immediate, imm11,
                                        FIELD_BTYPE.IMM11.START, "imm[11]"));

        // Construct assembly instruction
        this.assembly = renderAsmInstruction([operation, reg1, reg2,
                                            immediate]);
    }

    /**
     * Decodes U-type instruction
     */
    decodeUType() {
        // Get bits for each field
        var rd = this.getBits(FIELD_COMMON.RD.START, FIELD_COMMON.RD.END);
        var imm = this.getBits(FIELD_UTYPE.IMM31.START, FIELD_UTYPE.IMM31.END);

        // Convert binary register / immediate to decimal
        var destReg = convertBinRegister(rd);
        var immediate = parseImm(imm);

        // Check for operation using opcode
        var operation = "lui";
        if (this.opcode == OPCODE.AUIPC) {
            operation = "auipc";
        }

        // Create fragments for each field
        this.fragments.push(new Fragment(operation, this.opcode,
                                        FIELD_COMMON.OPCODE.START, "opcode"));
        this.fragments.push(new Fragment(destReg, rd,
                                        FIELD_COMMON.RD.START, "rd"));
        this.fragments.push(new Fragment(immediate, imm,
                                        FIELD_UTYPE.IMM31, "imm[31:12]"));

        // Construct assembly instruction
        this.assembly = renderAsmInstruction([operation, destReg, immediate]);
    }

    /**
     * Decodes J-type instruction
     */
    decodeJType() {
        var operation = "jal";

        // Get bits for each field
        var rd = this.getBits(FIELD_COMMON.RD.START, FIELD_COMMON.RD.END);
        var imm20 = this.getBits(FIELD_JTYPE.IMM20.START,
                                FIELD_JTYPE.IMM20.END);
        var imm10_1 = this.getBits(FIELD_JTYPE.IMM10.START,
                                FIELD_JTYPE.IMM10.END);
        var imm11 = this.getBits(FIELD_JTYPE.IMM11.START,
                                FIELD_JTYPE.IMM11.END);
        var imm19_12 = this.getBits(FIELD_JTYPE.IMM19.START,
                                FIELD_JTYPE.IMM19.END);

        // imm[0] = 0
        var imm0 = '0';

        // Concatenate binary bits for immediate
        var imm = imm20 + imm19_12 + imm11 + imm10_1 + imm0;

        // Convert binary register / immediate to decimal
        var destReg = convertBinRegister(rd);
        var immediate = parseImm(imm);

        // Create fragments for each field
        this.fragments.push(new Fragment(operation, this.opcode,
                                        FIELD_COMMON.OPCODE.START, "opcode"));
        this.fragments.push(new Fragment(destReg, rd,
                                        FIELD_COMMON.RD.START, "rd"));
        this.fragments.push(new Fragment(immediate, imm20,
                                        FIELD_JTYPE.IMM20.START, "imm[20]"));
        this.fragments.push(new Fragment(immediate, imm19_12,
                                        FIELD_JTYPE.IMM19.START, "imm[19:12]"));
        this.fragments.push(new Fragment(immediate, imm11,
                                        FIELD_JTYPE.IMM11.START, "imm[11]"));
        this.fragments.push(new Fragment(immediate, imm10_1,
                                        FIELD_JTYPE.IMM10.START, "imm[10:1]"));

        // Construct assembly instruction
        this.assembly = renderAsmInstruction([operation, destReg, immediate]);
    }

    /**
     * Decode System instructions
     */
    decodeSystem() {
        // Get bits for each field
        var rd = this.getBits(FIELD_COMMON.RD.START, FIELD_COMMON.RD.END);
        var funct3 = this.getBits(FIELD_COMMON.FUNCT3.START,
                                    FIELD_COMMON.FUNCT3.END);
        var rs1 = this.getBits(FIELD_COMMON.RS1.START, FIELD_COMMON.RS1.END);
        var funct12 = this.getBits(FIELD_SYSTEM.FUNCT12.START,
                                    FIELD_SYSTEM.FUNCT12.END);
        // Check funct3 bits
        if (funct3 != '000') {
            throw "Invalid funct3";
        }

        // Check rd bits
        if (rd != '00000') {
            throw "Invalid rd";
        }

        // Check rs1 bits
        if (rs1 != '00000') {
            throw "Invalid rs1";
        }

        // Check funct12 bits
        if (funct12 == '000000000000') {
            this.assembly = "ecall";
        } else if (funct12 == '000000000001') {
            this.assembly = "ebreak";
        } else {
            throw "Invalid funct12";
        }

        // Create fragments for each field
        this.fragments.push(new Fragment(this.assembly, this.opcode,
            FIELD_COMMON.OPCODE.START, "opcode"));
        this.fragments.push(new Fragment(this.assembly, rd,
            FIELD_COMMON.RD.START, "rd"));
        this.fragments.push(new Fragment(this.assembly, funct3,
            FIELD_COMMON.FUNCT3.START, "funct3"));
        this.fragments.push(new Fragment(this.assembly, rs1,
            FIELD_COMMON.RS1.START, "rs1"));
        this.fragments.push(new Fragment(this.assembly, funct12,
            FIELD_SYSTEM.FUNCT12.START, "funct12"));
    }

    /**
     * Decode FENCE instruction
     */
    decodeFence() {
        // Get bits for each field
        var rd = this.getBits(FIELD_COMMON.RD.START, FIELD_COMMON.RD.END);
        var funct3 = this.getBits(FIELD_COMMON.FUNCT3.START,
                                FIELD_COMMON.FUNCT3.END);
        var rs1 = this.getBits(FIELD_COMMON.RS1.START, FIELD_COMMON.RS1.END);
        var pred = this.getBits(FIELD_FENCE.PRED.START, FIELD_FENCE.PRED.END);
        var succ = this.getBits(FIELD_FENCE.SUCC.START, FIELD_FENCE.SUCC.END);
        var fm = this.getBits(FIELD_FENCE.FM.START, FIELD_FENCE.FM.END);

        // Check funct3 bits
        if (funct3 != '000') {
            throw "Invalid funct3";
        }

        // Check rd bits
        if (rd != '00000') {
            throw "Invalid rd";
        }

        // Check rs1 bits
        if (rs1 != '00000') {
            throw "Invalid rs1";
        }

        if (fm != '0000') {
            throw "Invalid fm";
        }

        var operation = "fence";

        // Check predecessor bits
        var predecessor = getAccessString(pred);

        // Check successor bits
        var successor = getAccessString(succ);

        // Create fragments for each field
        this.fragments.push(new Fragment(operation, this.opcode,
            FIELD_COMMON.OPCODE.START, "opcode"));
        this.fragments.push(new Fragment(operation, rd,
            FIELD_COMMON.RD.START, "rd"));
        this.fragments.push(new Fragment(operation, funct3,
            FIELD_COMMON.FUNCT3.START, "funct3"));
        this.fragments.push(new Fragment(operation, rs1,
            FIELD_COMMON.RS1.START, "rs1"));
        this.fragments.push(new Fragment(predecessor, pred,
            FIELD_FENCE.PRED.START, "pred"));
        this.fragments.push(new Fragment(successor, succ,
            FIELD_FENCE.SUCC.START, "succ"));
        this.fragments.push(new Fragment(operation, fm,
            FIELD_FENCE.FM.START, "fm"));

        // Construct assembly instruction
        this.assembly = renderAsmInstruction([operation, predecessor,
                                            successor]);
    }
}

// Parse given immediate to decimal
function parseImm(immediate) {
    // If first bit is 1, binary string represents a negative number
    if (immediate[0] == '1') {
        // Pad binary with 1s and convert number to 32 bit integer
        return parseInt(immediate.padStart(32,'1'), BASE.BINARY) >> 0;
    }
    // Else, binary string represents 0 or positive number
    return parseInt(immediate, BASE.BINARY);
}

// Convert register numbers from binary to decimal
function convertBinRegister(reg) {
    return "x" + parseInt(reg, BASE.BINARY);
}

// Combine list of items into assembly instruction
function renderAsmInstruction(list) {
    // If list is empty, throw error
    if (list.length < 1) {
        throw "Empty list";
    }

    // Add first item
    var output = list[0];

    // If list has more than one item
    if (list.length > 1) {
        // Create sublist of following items
        var items = list.splice(1);
        // Add space before second item and separate next items with commas
        output = output + " " + items.join(", ");
    }
    return output;
}

// Combine list of items into load/store assembly instruction
function renderLoadStoreInstruction(list) {
    // If list is empty, throw error
    if (list.length < 1) {
        throw "Empty List";
    // If less than 4 items in list, throw error
    } else if (list.length < 4) {
        throw "Not enough items to render load/store instruction";
    }
    // Example of format: lw x2, 0(x8)
    return list[0] + " " + list[1] + ", " + list[2] + "(" + list[3] + ")";
}

// Get device I/O and memory accesses corresponding to given bits
function getAccessString(bits) {
    var output = "";

    // I: Device input, O: device output, R: memory reads, W: memory writes
    var access = ['i', 'o', 'r', 'w'];

    // Loop through the access array and binary string
    for (let i = 0; i < access.length; i++) {
        if (bits[i] == 1) {
            output += access[i];
        }
    }

    return output;
}
