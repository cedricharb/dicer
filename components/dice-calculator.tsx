"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateDiceRolls } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import debounce from "lodash/debounce";

interface Dice {
  id: string;
  sides: number | "10-decimal";
  rolls: number[];
}

type DiceType = number | "10-decimal";

interface DiceRolls {
  [key: string]: number[];
}

interface SelectedProbabilities {
  [key: string]: { probability: number; side: string | number } | undefined;
}

interface DiceRoll {
  diceType: string;
  side: number;
  count: number;
}

const DiceInput = ({
  side,
  value,
  probability,
  onChange,
  onClick,
}: {
  side: string | number;
  value: string | number; // Changed from just number to string | number
  probability: number;
  onChange: (value: string) => void;
  onClick: () => void;
}) => {
  // Convert value to string when passing it to the Input component
  const inputValue = typeof value === "number" ? value.toString() : value;

  return (
    <div className="flex items-center space-x-2 mb-2">
      <Label className="w-8">{side}</Label>
      <Input
        type="number"
        value={inputValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-16"
      />
      <Button variant="outline" size="sm" onClick={onClick}>
        Select
      </Button>
      <span className="text-sm">{(probability * 100).toFixed(2)}%</span>
    </div>
  );
};

const DiceCard = ({
  diceType,
  rolls,
  selectedProbability,
  onFaceInputChange,
  onSideClick,
  calculateProbabilities,
}: {
  diceType: DiceType;
  rolls: number[];
  selectedProbability:
    | { probability: number; side: string | number }
    | undefined;
  onFaceInputChange: (face: number, value: string) => void;
  onSideClick: (index: number) => void;
  calculateProbabilities: () => {
    side: string | number;
    probability: number;
  }[];
}) => {
  const totalRolls = rolls.reduce((sum, count) => sum + count, 0);
  const probabilities = calculateProbabilities();

  const titleText = `D${diceType === "10-decimal" ? "10 (Percentile)" : diceType} Rolls (Total: ${totalRolls})`;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const [fontSize, setFontSize] = useState(24); // Start with a large font size

  useEffect(() => {
    const resizeTitle = () => {
      const title = titleRef.current;
      if (!title || !title.parentElement) return;

      let currentFontSize = 24; // Start with the maximum font size
      title.style.fontSize = `${currentFontSize}px`;

      while (
        (title.scrollWidth > title.offsetWidth ||
          title.scrollHeight > title.offsetHeight) &&
        currentFontSize > 12
      ) {
        currentFontSize--;
        title.style.fontSize = `${currentFontSize}px`;
      }

      setFontSize(currentFontSize);
    };

    resizeTitle();
    window.addEventListener("resize", resizeTitle);

    return () => window.removeEventListener("resize", resizeTitle);
  }, [titleText]);

  // Function to reorder sides for percentile die
  const reorderSides = (sides: (string | number)[]) => {
    if (diceType === "10-decimal") {
      return [...sides.slice(1), sides[0]];
    }
    return sides;
  };

  const orderedSides = reorderSides(
    rolls.map((_, i) =>
      diceType === "10-decimal"
        ? i === 0
          ? "00"
          : `${i}0`
        : diceType === 10
          ? i === 9
            ? "0"
            : `${i + 1}`
          : i + 1
    )
  );

  const orderedRolls = reorderSides(rolls);
  const orderedProbabilities = reorderSides(
    probabilities.map((p) => p.probability)
  ); // Map to probability

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="pb-2">
        <CardTitle
          ref={titleRef}
          className="text-center whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.2 }}
        >
          {titleText}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orderedSides.map((side, i) => (
          <DiceInput
            key={i}
            side={side}
            value={orderedRolls[i]}
            probability={
              typeof orderedProbabilities[i] === "number"
                ? orderedProbabilities[i]
                : 0
            } // Ensure it's a number
            onChange={(value) =>
              onFaceInputChange(
                diceType === "10-decimal" ? (i === 9 ? 1 : i + 2) : i + 1,
                value
              )
            }
            onClick={() =>
              onSideClick(diceType === "10-decimal" ? (i === 9 ? 0 : i + 1) : i)
            }
          />
        ))}
        {selectedProbability && (
          <div className="mt-4 text-sm text-primary text-center">
            Probability of rolling {selectedProbability.side} or higher:{" "}
            {selectedProbability.probability.toFixed(2)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export function DiceCalculatorComponent({
  initialDice,
  diceSetId,
}: {
  initialDice: Dice[];
  diceSetId: string;
}) {
  const diceTypes = useMemo<DiceType[]>(
    () => initialDice.map((dice) => dice.sides),
    [initialDice]
  );
  const [rolls, setRolls] = useState<DiceRolls>(
    initialDice.reduce((acc, dice) => {
      acc[dice.sides.toString()] = dice.rolls;
      return acc;
    }, {} as DiceRolls)
  );

  const [selectedProbabilities, setSelectedProbabilities] =
    useState<SelectedProbabilities>({});

  const debouncedUpdateDiceRolls = useMemo(
    () =>
      debounce((rolls: DiceRoll[]) => {
        updateDiceRolls(diceSetId, rolls)
          .then((result) => {
            if ("error" in result) {
              console.error(`Error updating roll:`, result.error);
              if ("details" in result) {
                console.error(`Error details:`, result.details);
              }
              // Optionally, you can show an error message to the user here
            } else {
              console.log(`Successfully updated roll in database`);
            }
          })
          .catch((error) => {
            console.error(`Unexpected error updating roll:`, error);
            // Optionally, you can show an error message to the user here
          });
      }, 500),
    [diceSetId]
  );

  const handleFaceInputChange = useCallback(
    (sides: DiceType, face: number, value: string) => {
      const count = value === "" ? 0 : parseInt(value, 10);
      if (isNaN(count) || count < 0) {
        return; // Don't update if the value is invalid or negative
      }

      setRolls((prevRolls) => {
        const newRolls = { ...prevRolls };
        newRolls[sides.toString()][face - 1] = count;
        return newRolls;
      });

      // Update the database after a short delay
      const diceType = sides === "10-decimal" ? "PERCENTILE" : `D${sides}`;
      debouncedUpdateDiceRolls([
        {
          diceType,
          side: face,
          count,
        },
      ]);
    },
    [debouncedUpdateDiceRolls]
  );

  const calculateProbabilities = useCallback(
    (sides: DiceType) => {
      const results = rolls[sides.toString()] || [];
      const totalRolls = results.reduce((sum, count) => sum + count, 0);
      const probabilities = results.map((count, i) => ({
        side: sides === "10-decimal" ? (i === 0 ? "00" : `${i}0`) : i + 1,
        probability: totalRolls ? (count / totalRolls) * 100 : 0,
      }));
      return probabilities;
    },
    [rolls]
  );

  useEffect(() => {
    const newSelectedProbabilities: SelectedProbabilities = {};
    diceTypes.forEach((sides) => {
      const probabilities = calculateProbabilities(sides);
      const selectedSide = selectedProbabilities[sides.toString()]?.side;
      if (selectedSide !== undefined) {
        const index = probabilities.findIndex((p) => p.side === selectedSide);
        if (index !== -1) {
          const cumulativeProbability = probabilities
            .slice(index)
            .reduce((sum, { probability }) => sum + probability, 0);
          newSelectedProbabilities[sides.toString()] = {
            probability: cumulativeProbability,
            side: selectedSide,
          };
        }
      }
    });
    setSelectedProbabilities(newSelectedProbabilities);
  }, [rolls, calculateProbabilities, diceTypes]);

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
            rolls={rolls[sides.toString()]}
            selectedProbability={selectedProbabilities[sides.toString()]}
            onFaceInputChange={(face, value) =>
              handleFaceInputChange(sides, face, value)
            }
            onSideClick={(index) => handleSideClick(sides, index)}
            calculateProbabilities={() => calculateProbabilities(sides)}
          />
        ))}
      </div>
    </div>
  );
}
