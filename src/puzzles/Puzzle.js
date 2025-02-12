import { PieceState } from './PieceState.js';
import { unit, sqrt2 } from '../constants.js';
/* Utility functions on simple angle operations :::::::::::::::::::::::::::: */
function degToRad(deg) {
    return deg * Math.PI / 180;
}

function radToDeg(rad, roundFlag=true) {
    const rawDeg = rad * 180 / Math.PI;
    return roundFlag ? Math.round(rawDeg) : rawDeg;
}

// Convert all angles in range (-180, 180]
function toStandardDeg(deg) {
    while (deg > 180) {
        deg -= 360;
    }
    while (deg <= -180) {
        deg += 360;
    }
    return deg;
}

/* Functions to determine the orientation of elemental triangles ::::::::::: */
function mapToAtomFromTL(px, py, rz) {
    // angles
    const alpha = rz + Math.PI * 0.5;
    const beta  = rz + Math.PI;
    // top
    const pxT = px + Math.cos(alpha) * unit;
    const pyT = py + Math.sin(alpha) * unit;
    // left
    const pxL = px + Math.cos(beta) * unit;
    const pyL = py + Math.sin(beta) * unit;
    // right
    const pxR = px + Math.cos(rz) * unit;
    const pyR = py + Math.sin(rz) * unit;

    return [
        ...mapToAtomFromSQ(pxT, pyT, rz + Math.PI * 0.25),
        ...mapToAtomFromTS(pxL, pyL, rz),
        ...mapToAtomFromTS(pxR, pyR, rz)
    ];
}

function mapToAtomFromTM(px, py, rz) {
    // Sub-triangle on the right side
    const px0 = px + Math.cos(rz) * unit;
    const py0 = py + Math.sin(rz) * unit;
    const rz0 = rz + Math.PI * 0.5;

    // Sub-triangle on the bottom side
    const beta = rz - Math.PI * 0.5;  // rotate -90 deg
    const px1 = px + Math.cos(beta) * unit;
    const py1 = py + Math.sin(beta) * unit;

    return [
        ...mapToAtomFromTS(px0, py0, rz0),
        ...mapToAtomFromTS(px1, py1, rz)
    ];
}

function mapToAtomFromTS(px, py, rz) {
    const baseDeg = radToDeg(rz);
    return [45, 135].map(deg => [
        Number(px.toFixed(1)), 
        Number(py.toFixed(1)), 
        toStandardDeg(baseDeg + deg)
    ]);
}

function mapToAtomFromSQ(px, py, rz) {
    const baseDeg = radToDeg(rz);
    return [0,1,2,3].map(mul => [
        Number(px.toFixed(1)), 
        Number(py.toFixed(1)),
        toStandardDeg(baseDeg + mul * 90)
    ]);
}

function mapToAtomFromPL(px, py, rz, ry) {
    const step = sqrt2 * 0.5;

    const beta = (ry === 0) ? 
        rz - 0.75 * Math.PI : (Math.PI - rz) + 0.75 * Math.PI;
    const pxB = px + Math.cos(beta) * step;
    const pyB = py + Math.sin(beta) * step;
    const rzB = (ry === 0) ? rz : (-rz);

    const alpha = beta + Math.PI; 
    const pxT = px + Math.cos(alpha) * step;
    const pyT = py + Math.sin(alpha) * step;
    const rzT = rzB + Math.PI;

    return [
        ...mapToAtomFromTS(pxB, pyB, rzB),
        ...mapToAtomFromTS(pxT, pyT, rzT)
    ];
}


const mapToAtom = {
    TL0: ({px, py, rz}) => mapToAtomFromTL(px, py, degToRad(rz)),
    TL1: ({px, py, rz}) => mapToAtomFromTL(px, py, degToRad(rz)),
    TM:  ({px, py, rz}) => mapToAtomFromTM(px, py, degToRad(rz)),
    TS0: ({px, py, rz}) => mapToAtomFromTS(px, py, degToRad(rz)),
    TS1: ({px, py, rz}) => mapToAtomFromTS(px, py, degToRad(rz)),
    SQ:  ({px, py, rz}) => mapToAtomFromSQ(px, py, degToRad(rz)),
    PL:  ({px, py, rz, ry}) => mapToAtomFromPL(px, py, degToRad(rz), degToRad(ry)),
};


export class Puzzle {
    #name = 'unnamed-puzzle';
    pieceStates = [];
    atomData = [];
    atomStates = new Set();
    visibleCoordinate = {px: 0, py: 0, rz: 0};

    constructor(name, pattern, coord={px: 0, py: 0, rz: 0}) {
        this.#name = name;
        this.update(pattern);
        this.visibleCoordinate = {...coord};
    }

    getName() {
        return this.#name;
    }

    getPiece(key, sid=0) {
        return this.pieceStates[sid][key];
    }

    displayPieces() {
        console.log(this.pieceStates);
    }

    update(pattern) {
        // Update piece states
        this.pieceStates.length = 0;
        for (const data of pattern) {
            this.pieceStates.push(new PieceState(data));
        }
        // Update atom data
        this.atomData.length = 0;
        for (const ps of this.pieceStates) {
            Object.keys(ps).forEach(key => {
                this.atomData.push(...mapToAtom[key](ps[key]));
            });
        }
        // Update atom states
        this.atomStates.clear();
        this.atomData.forEach(data => this.atomStates.add(
            this.#toAtomKey(...data)
        ));
    }

    #toAtomKey(px, py, rz) {
        return `${px.toFixed(1)}_${py.toFixed(1)}_${toStandardDeg(rz)}`;
    }
}