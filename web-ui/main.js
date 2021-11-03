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
