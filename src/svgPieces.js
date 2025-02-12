import { unit, sqrt2D2 } from './constants.js';

/** This script creates svg elements as puzzle pieces */
const SVG_NS = 'http://www.w3.org/2000/svg';

const pieceColors = Object.freeze({
    TL0: '#003C40',
    TL1: '#695087',
    TM : '#007470',
    TS0: '#015D5E',
    TS1: '#505E87',
    SQ : '#A68968',
    PL : '#96BFAA',
});

function makeTri(s) {
    return `${s},0 0,${s} ${-s},0`;
}

function makeTM(s) {
    return `${-s},${-s} ${s},${-s} ${s},${s}`;
}

function makeSQ(s) {
    return `${s},${s} ${-s},${s} ${-s},${-s} ${s},${-s}`;
}

function makePL(s) {
    const a = 0.5 * s;
    const b = 1.5 * s;
    return `${-a},${a} ${-b},${-a} ${a},${-a} ${b},${a}`;
}

const POINTS = Object.freeze({
    TL0: makeTri(unit * 2),
    TL1: makeTri(unit * 2),
    TM : makeTM(unit),
    TS0: makeTri(unit),
    TS1: makeTri(unit),
    SQ : makeSQ(sqrt2D2),
    PL : makePL(unit),
});

function createSvgShape(path, color) {
    const svgShape = document.createElementNS(SVG_NS, 'polygon');
    svgShape.setAttribute('points', path);
    svgShape.setAttribute('fill', color);
    return svgShape;
}

export const SVG_PIECE = Object.freeze({
    TL0: createSvgShape(POINTS.TL0, pieceColors.TL0),
    TL1: createSvgShape(POINTS.TL1, pieceColors.TL1),
    TM : createSvgShape(POINTS.TM , pieceColors.TM ),
    TS0: createSvgShape(POINTS.TS0, pieceColors.TS0),
    TS1: createSvgShape(POINTS.TS1, pieceColors.TS1),
    SQ : createSvgShape(POINTS.SQ , pieceColors.SQ ),
    PL : createSvgShape(POINTS.PL , pieceColors.PL ),
});

const dark = '#aaaaaa';
export const PTN_PIECE = Object.freeze({
    TL0: createSvgShape(POINTS.TL0, dark),
    TL1: createSvgShape(POINTS.TL1, dark),
    TM : createSvgShape(POINTS.TM , dark),
    TS0: createSvgShape(POINTS.TS0, dark),
    TS1: createSvgShape(POINTS.TS1, dark),
    SQ : createSvgShape(POINTS.SQ , dark),
    PL : createSvgShape(POINTS.PL , dark),
});
