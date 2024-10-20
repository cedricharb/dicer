import { Database } from './supabase';

export type DiceSet = Database['public']['Tables']['dice_sets']['Row'];
export type Dice = Database['public']['Tables']['dice']['Row'] & {
  die_sides?: Array<{
    side: number;
    rolled_count: number | null;
  }>;
};
export type DieSide = Database['public']['Tables']['die_sides']['Row'];

export type DiceType = Dice['type'];

export interface DiceRolls {
  [key: string]: number[];
}

export interface SelectedProbabilities {
  [key: string]: { probability: number; side: string | number } | undefined;
}

export interface DiceRoll {
  diceType: DiceType;
  side: number;
  count: number;
}
