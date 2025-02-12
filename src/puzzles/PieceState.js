export class PieceState {
    TL0 = { px: 0, py: 0, rz: 0 };
    TL1 = { px: 0, py: 0, rz: 0 };
    TM  = { px: 0, py: 0, rz: 0 };
    TS0 = { px: 0, py: 0, rz: 0 };
    TS1 = { px: 0, py: 0, rz: 0 };
    SQ  = { px: 0, py: 0, rz: 0 };
    PL  = { px: 0, py: 0, rz: 0, ry: 0 };

    constructor(pieceData = {}) {
        Object.assign(this, pieceData);
    }

    #formatStr(key) {
        const pxStr = `px: ${this[key].px.toFixed(1)}`;
        const pyStr = `py: ${this[key].py.toFixed(1)}`;
        const rzStr = `rz: ${this[key].rz}`;
        const ryStr = (key === 'PL') ? `, ry: ${this[key].ry}` : '';
        return `'${key}': {${pxStr}, ${pyStr}, ${rzStr}${ryStr}},\n`;
    }

    toString() {
        const str = (
            `${this.#formatStr('TL0')}` + 
            `${this.#formatStr('TL1')}` + 
            `${this.#formatStr('TM')}` + 
            `${this.#formatStr('TS0')}` + 
            `${this.#formatStr('TS1')}` +  
            `${this.#formatStr('SQ')}` + 
            `${this.#formatStr('PL')}`
        );
        return str;
    }
}