// All game constants
const T   = 48;   // tile size in pixels
const W   = 40;   // world width  in tiles
const H   = 28;   // world height in tiles

const DIR  = { R:0, D:1, L:2, U:3 };
const DVEC = [[1,0],[0,1],[-1,0],[0,-1]];

// Ghibli-inspired palette
const PAL = {
  // Grass
  G1:'#3d6228', G2:'#4d7a33', G3:'#5d9040', G4:'#70aa4a', G5:'#88c860',
  // Dirt / earth
  D1:'#6a4020', D2:'#8a5830', D3:'#a87040', D4:'#c88850',
  // Stone
  S1:'#383840', S2:'#505060', S3:'#686880', S4:'#888898', S5:'#b0b0c0',
  // Wood
  W1:'#5a3018', W2:'#7a4828', W3:'#9a6038', W4:'#b87848', W5:'#d09858',
  // Iron ore (blue-grey)
  I1:'#384060', I2:'#485878', I3:'#607090', I4:'#7888a8', I5:'#a0b8d0',
  // Coal (near-black)
  C1:'#0c0a08', C2:'#1c1810', C3:'#2e2820', C4:'#484038', C5:'#606050',
  // Copper (warm orange)
  U1:'#6a2e10', U2:'#8a4820', U3:'#aa6030', U4:'#ca7838', U5:'#e89848',
  // Fire
  F1:'#c02000', F2:'#e04000', F3:'#f07000', F4:'#f8a000', F5:'#ffd040',
  // Item plate colours
  MI:'#8898b0', // iron plate
  MC:'#c07840', // copper plate
};

const ITEM_COL = {
  iron_ore:     [PAL.I1,PAL.I2,PAL.I3,PAL.I4,PAL.I5],
  coal:         [PAL.C1,PAL.C2,PAL.C3,PAL.C4,PAL.C5],
  copper_ore:   [PAL.U1,PAL.U2,PAL.U3,PAL.U4,PAL.U5],
  iron_plate:   ['#485868','#607080','#808898','#a0b0c0','#c8d8e8'],
  copper_plate: ['#7a3818','#9a5028','#ba6838','#d88040','#f0a050'],
};

const RECIPES = [
  { inputs:{ iron_ore:1, coal:1 },   output:'iron_plate',   time:3.2 },
  { inputs:{ copper_ore:1, coal:1 }, output:'copper_plate', time:3.2 },
];

const BELT_SPEED = 1.6; // tiles per second
