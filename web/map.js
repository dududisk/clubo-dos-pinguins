// Mapa = tamanho e formato da ilha. Edite as linhas (todas com o mesmo comprimento), rode `npm run check` e tudo se ajusta sozinho.
// ~=água  .=neve  p=praça  f=piso do escritório  o=porta  #=árvore  W=parede  S=estátua
// b=banco (vaga de "pensando")  d=mesa+PC  c=cadeira (vaga de "trabalhando")
export const TILE = 16;
export const SPAWN = { x: 20, y: 13 };

export const MAP = [
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~.................~~~~~~~~~~~',
  '~~~~~~~~.........................~~~~~~~',
  '~~~~~~......#.........WWWWWWWWWWWWW.~~~~',
  '~~~~~..#..............WffdfffffdffW...~~',
  '~~~~.............#....WffcfffffcffW....~',
  '~~~~.....#............WfffffffffffW.#..~',
  '~~~~~.........#.......WffdfffffdffW...~~',
  '~~~~~.................WffcfffffcffW..~~~',
  '~~....#...............WfffffffffffW.#~~~',
  '~.................#...WWWWWWooWWWWW...~~',
  '~...#.......................pp.........~',
  '~~...#......................pp.........~',
  '~~...........pppppppppppppppp......#..~~',
  '~~~.........pbppppppppppppppbp.......~~~',
  '~~~.#......pppppppppSSppppppppp.......~~',
  '~~~~~......pppppppppSSppppppppp....#...~',
  '~~~~~~~~.#.pppppppppppppppppppp..#.....~',
  '~~~~~~~~~~..pbppppppppppppppbp....#..~~~',
  '~~~~~~~~~~~..pppppppppppppppp.........~~',
  '~~~~~~~~~~~~..#...#...#...#......~~~~~~~',
  '~~~~~~~~~~~~~~..#...#~~~#....~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~........~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
];

const WALK = new Set('.pfo');
export const walkable = (x, y) => WALK.has(MAP[y]?.[x]);
