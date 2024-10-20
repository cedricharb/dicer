"use client";

import { useState, useCallback, useMemo } from "react";
import { updateDiceRolls } from "@/app/actions";
import debounce from "lodash/debounce";
import {
  Dice,
  DiceSet,
  DiceType,
  DiceRolls,
  SelectedProbabilities,
  DiceRoll,
} from "@/src/types/dice";
import { DiceCard } from "./dice-card";

export function DiceCalculatorComponent({
  initialDice,
  diceSetId,
}: {
  initialDice: Dice[];
  diceSetId: DiceSet["id"];
}) {
  const diceTypes = useMemo<DiceType[]>(
    () => initialDice.map((dice) => dice.type as DiceType),
    [initialDice]
  );
  const [rolls, setRolls] = useState<DiceRolls>(() => {
    return initialDice.reduce((acc, dice) => {
      const sortedSides = dice.die_sides?.sort((a, b) => a.side - b.side);
      acc[dice.type] = sortedSides?.map((side) => side.rolled_count || 0) || [];
      return acc;
    }, {} as DiceRolls);
  });

  const [selectedProbabilities, setSelectedProbabilities] =
    useState<SelectedProbabilities>({});

  const debouncedUpdateDiceRolls = useMemo(
    () =>
      debounce((rolls: DiceRoll[]) => {
        updateDiceRolls(diceSetId, rolls).catch((error) => {
          // Handle error silently or implement a user-friendly error handling mechanism
        });
      }, 500),
    [diceSetId]
  );

  const handleFaceInputChange = useCallback(
    (diceType: DiceType, face: number, value: string) => {
      const count = value === "" ? 0 : parseInt(value, 10);
      if (isNaN(count) || count < 0) {
        return;
      }

      setRolls((prevRolls) => {
        const newRolls = { ...prevRolls };
        newRolls[diceType] = [...newRolls[diceType]];
        newRolls[diceType][face - 1] = count;
        return newRolls;
      });

      let side = face;
      if (diceType === "PERCENTILE") {
        side = face === 1 ? 100 : face * 10 - 10;
      }

      debouncedUpdateDiceRolls([
        {
          diceType,
          side: side,
          count,
        },
      ]);
    },
    [debouncedUpdateDiceRolls]
  );

  const calculateProbabilities = useCallback(
    (sides: DiceType) => {
      const results = rolls[sides] || [];
      const totalRolls = results.reduce((sum, count) => sum + count, 0);
      return results.map((count, i) => ({
        side:
          sides === "PERCENTILE"
            ? i === 0
              ? "00"
              : `${i}0`
            : (i + 1).toString(),
        probability: totalRolls ? (count / totalRolls) * 100 : 0,
      }));
    },
    [rolls]
  );

  const handleSideClick = useCallback(
    (sides: DiceType, index: number) => {
      const probabilities = calculateProbabilities(sides);
      const cumulativeProbability = probabilities
        .slice(index)
        .reduce((sum, { probability }) => sum + probability, 0);
      const selectedSide = probabilities[index].side;
      setSelectedProbabilities((prev) => ({
        ...prev,
        [sides.toString()]: {
          probability: cumulativeProbability,
          side: selectedSide,
        },
      }));
    },
    [calculateProbabilities]
  );

  return (
    <div className="container mx-auto p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {diceTypes.map((sides) => (
          <DiceCard
            key={sides.toString()}
            diceType={sides}
            rolls={rolls[sides] || []}
            selectedProbability={selectedProbabilities[sides.toString()]}
            onFaceInputChange={(face, value) =>
              handleFaceInputChange(sides, face + 1, value)
            }
            onSideClick={(index) => handleSideClick(sides, index)}
            calculateProbabilities={() => calculateProbabilities(sides)}
          />
        ))}
      </div>
    </div>
  );
}
