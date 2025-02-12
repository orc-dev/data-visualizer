export const COLUMN_NAMES = [
    'PUZZLE_ID', 'TIMESTAMP', 'STEP', 'TARGET_PIECE',
    'TL0_X', 'TL0_Y', 'TL0_R', 'TL1_X', 'TL1_Y', 'TL1_R',
    'TM_X',  'TM_Y',  'TM_R',  'TS0_X', 'TS0_Y', 'TS0_R',
    'TS1_X', 'TS1_Y', 'TS1_R', 'SQ_X',  'SQ_Y',  'SQ_R',
    'PL_X',  'PL_Y',  'PL_R',  'PL_F', 'PROGRESS'
];

export const COLORS = {
    plainDot: '#8969F5',
    hoverDot: '#FF6666',
    boardBackground: '#f5f5f5',
    boardBorder: 'black',
}

export const unit  = 20;
export const sqrt2 = unit * Math.SQRT2;

// 0.2 is added to make the square piece more smooth
export const sqrt2D2 = (sqrt2 / 2) + 0.2;  
