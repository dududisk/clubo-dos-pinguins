// Mapa = tamanho e formato da ilha. Edite as linhas (todas com o mesmo comprimento), rode `npm run check` e tudo se ajusta sozinho.
// ~=água  .=neve  p=praça  f=piso do escritório  o=porta  #=árvore  W=parede  S=fonte (bloco 2x2)
// b=banco (vaga de "pensando")  d=mesa+PC  c=cadeira (vaga de "trabalhando")  L=poste de luz  M=boneco de neve  H=farol (bloco 2x2)  K=loja (bloco 4x2)  I=iglu (bloco 2x2)
export const TILE = 16;
export const SPAWN = { x: 20, y: 13 }; // ponto de partida do teste de alcance do mapa (check.js)
export const ENTRY = { x: 20, y: 23 }; // onde os pinguins chegam (no mar, nadando até a costa)

export const MAP = [
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~.................~~~~~~~~~~~',
  '~~~~~~~~.........................~~~~~~~',
  '~~~~~~......#......#..WWWWWWWWWWWWW.~~~~',
  '~~~~~...........#...#.WffdfffffdffW...~~',
  '~~~~...HH........#....WffcfffffcffW....~',
  '~~~~...HH#.KKKK....#..WfffffffffffW.#..~',
  '~~~~~......KKKK.......WffdfffffdffW...~~',
  '~~~~~....M..pp...#....WffcfffffcffW..~~~',
  '~~....#.....pp........WfffffffffffW.#~~~',
  '~...........pp....#...WWWWWWooWWWWW...~~',
  '~...#.......pp..............pp.........~',
  '~~...#......pp..............pp...M.....~',
  '~~...........pLppppppppppppLp......#..~~',
  '~~~.........pbppppppppppppppbp...II..~~~',
  '~~~.#......pppppppppSSppppppppp..II...~~',
  '~~~~~......pppppppppSSppppppppp....#...~',
  '~~~~~~~~.#.pppppppppppppppppppp..#.....~',
  '~~~~~~~~~~..pbppppppppppppppbp....#..~~~',
  '~~~~~~~~~~~..pLppppppppppppLp.........~~',
  '~~~~~~~~~~~~..#...#...#...#......~~~~~~~',
  '~~~~~~~~~~~~~~..#...#~~~#....~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~........~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
];

const WALK = new Set('.pfo');
export const walkable = (x, y) => WALK.has(MAP[y]?.[x]);
