/**
 * Mini crosswords written for Arkedia. Each grid is 5×5; `#` marks a black square.
 * Numbers, entries and crossings are derived from the grid, so clues only need their number.
 */

export type Direction = 'across' | 'down';

export interface CrosswordPuzzle {
  id: string;
  rows: string[];
  clues: Record<Direction, Record<number, string>>;
}

export interface CrosswordEntry {
  id: string;
  number: number;
  direction: Direction;
  /** Cell indices (row * size + col) in reading order. */
  cells: number[];
  answer: string;
  clue: string;
}

export interface BuiltPuzzle {
  id: string;
  size: number;
  /** Solution letter per cell, or null for a black square. */
  solution: (string | null)[];
  /** Clue number printed in each cell, if any. */
  numbers: (number | null)[];
  entries: CrosswordEntry[];
}

export const PUZZLES: CrosswordPuzzle[] = [
  {
    id: '1',
    rows: ['##DIN', '#LANE', 'PAINT', 'AIRS#', 'TRY##'],
    clues: {
      across: {
        1: 'Racket from a crowded room',
        4: 'Strip of road between painted lines',
        5: 'What a roller spreads on a wall',
        6: 'Puts on ___ (acts superior)',
        7: 'Give it a go',
      },
      down: {
        1: 'Supermarket aisle for milk and cheese',
        2: 'Roadside places to stay the night',
        3: 'It divides a tennis court',
        4: "A dragon's hideout",
        5: 'Gentle tap on the back',
      },
    },
  },
  {
    id: '2',
    rows: ['#CLAY', '#LIME', 'BONUS', 'USES#', 'GENE#'],
    clues: {
      across: {
        1: "Potter's wheel material",
        5: 'Green citrus fruit',
        6: 'Extra reward on top of the usual',
        7: 'Puts to work',
        8: 'Unit of heredity carried in DNA',
      },
      down: {
        1: 'Shut, as a door',
        2: 'Crisp fabric made from flax',
        3: 'Make someone smile',
        4: 'Opposite of no',
        6: 'Glitch in some code',
      },
    },
  },
  {
    id: '3',
    rows: ['#BAD#', 'MONEY', 'EAGLE', 'TREAT', '#DRY#'],
    clues: {
      across: {
        1: 'Like milk long past its date',
        4: 'Coins and notes',
        6: 'Bald ___ (big bird of prey)',
        7: 'Something nice for a good dog',
        8: 'Not wet',
      },
      down: {
        1: 'Surface for chess or darts',
        2: 'Rage',
        3: 'Hold-up at the airport',
        4: 'Came face to face',
        5: 'Not ___ (still to come)',
      },
    },
  },
  {
    id: '4',
    rows: ['AGO##', 'NAPS#', 'YIELD', '#TRAY', '##APE'],
    clues: {
      across: {
        1: 'Long ___ (in the distant past)',
        4: 'Short sleeps',
        6: 'Give way at a junction',
        8: 'Flat carrier for cups and plates',
        9: "Copy someone's moves",
      },
      down: {
        1: 'Is there ___ cake left?',
        2: 'Way of walking',
        3: 'Drama in which everyone sings',
        5: 'Hit with an open hand',
        7: 'Colour for hair or cloth',
      },
    },
  },
  {
    id: '5',
    rows: ['##MOP', '#SODA', 'STUDY', 'KISS#', 'IRE##'],
    clues: {
      across: {
        1: 'Floor cleaner on a stick',
        4: 'Fizzy drink',
        5: 'Prepare for an exam',
        6: 'Peck on the cheek',
        7: 'Anger',
      },
      down: {
        1: 'Cheese lover, or the thing you click with',
        2: 'Chances, to a bookmaker',
        3: 'Settle the bill',
        4: 'Mix with a spoon',
        5: 'Glide down a snowy slope',
      },
    },
  },
  {
    id: '6',
    rows: ['SLAT#', 'PILOT', 'ALIKE', 'RAVEN', '#CENT'],
    clues: {
      across: {
        1: 'One strip of wood in a fence or blind',
        5: 'Person at the controls of a plane',
        7: 'Like two peas in a pod',
        8: 'Large black bird in a famous Poe poem',
        9: 'One hundredth of a dollar',
      },
      down: {
        1: 'Box for practice',
        2: 'Pale purple spring flower',
        3: 'Living and breathing',
        4: 'Game piece, or a small keepsake',
        6: 'Camping shelter',
      },
    },
  },
  {
    id: '7',
    rows: ['##TAP', '#PAVE', 'ORBIT', 'WELD#', 'EYE##'],
    clues: {
      across: {
        1: 'Faucet',
        4: 'Cover a road with asphalt',
        5: "The Moon's path around Earth",
        6: 'Join metal with heat',
        7: 'Hole in a needle',
      },
      down: {
        1: 'Where dinner is served',
        2: 'Keen, as a reader',
        3: 'Goldfish or hamster, say',
        4: 'What a hawk hunts',
        5: 'Be in debt',
      },
    },
  },
  {
    id: '8',
    rows: ['##PIN', '#TACO', 'HONOR', 'OMEN#', 'GEL##'],
    clues: {
      across: {
        1: 'One of ten at the end of a bowling lane',
        4: 'Folded tortilla dish',
        5: 'Integrity, or an award',
        6: 'Sign of things to come',
        7: 'Hair-styling goo',
      },
      down: {
        1: 'Group of judges on a talent show',
        2: 'Small picture you tap on a phone',
        3: 'Neither here ___ there',
        4: 'Very thick book',
        5: 'Keep all to yourself',
      },
    },
  },
];

export function buildPuzzle(puzzle: CrosswordPuzzle): BuiltPuzzle {
  const size = puzzle.rows.length;
  const solution = puzzle.rows.flatMap((row) => row.split('').map((char) => (char === '#' ? null : char)));
  const numbers: (number | null)[] = solution.map(() => null);
  const entries: CrosswordEntry[] = [];
  const open = (row: number, col: number) => row >= 0 && col >= 0 && row < size && col < size && solution[row * size + col] !== null;
  let next = 1;

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (!open(row, col)) continue;
      const starts: Direction[] = [];
      if (!open(row, col - 1) && open(row, col + 1)) starts.push('across');
      if (!open(row - 1, col) && open(row + 1, col)) starts.push('down');
      if (starts.length === 0) continue;

      const number = next;
      next += 1;
      numbers[row * size + col] = number;
      for (const direction of starts) {
        const cells: number[] = [];
        for (let r = row, c = col; open(r, c); direction === 'across' ? (c += 1) : (r += 1)) cells.push(r * size + c);
        entries.push({
          id: `${number}-${direction}`,
          number,
          direction,
          cells,
          answer: cells.map((cell) => solution[cell]).join(''),
          clue: puzzle.clues[direction][number] ?? '',
        });
      }
    }
  }

  entries.sort((a, b) => (a.direction === b.direction ? a.number - b.number : a.direction === 'across' ? -1 : 1));
  return { id: puzzle.id, size, solution, numbers, entries };
}

/** The entry running through `cell` in `direction`, if there is one. */
export function entryAt(built: BuiltPuzzle, cell: number, direction: Direction) {
  return built.entries.find((entry) => entry.direction === direction && entry.cells.includes(cell));
}
