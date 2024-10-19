"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { updateDiceRolls } from "@/app/actions";
import { Button } from "@/src/components/ui/button";
import { Plus, Minus } from "lucide-react";
import debounce from "lodash/debounce";
import {
  Dice,
  DiceSet,
  DiceType,
  DiceRolls,
  SelectedProbabilities,
  DiceRoll,
} from "@/src/types/dice";

const DiceInput = ({
  side,
  value,
  probability,
  onChange,
  onClick,
}: {
  side: number;
  value: number;
  probability: number;
  onChange: (value: string) => void;
  onClick: () => void;
}) => (
  <div className="flex items-center gap-2 mb-2 w-full">
    <Label className="cursor-pointer w-8 text-right" onClick={onClick}>
      {side}:
    </Label>
    <div className="relative flex-1">
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value === 0 ? "0" : value.toString()}
        className="w-full relative z-10"
        style={{
          background: `linear-gradient(to right, rgba(59, 130, 246, 0.5) ${probability}%, transparent ${probability}%)`,
        }}
        onChange={(e) => {
          const newValue = e.target.value;
          if (value === 0 && newValue !== "0") {
            onChange(newValue.replace(/^0+/, ""));
          } else {
            onChange(newValue === "" ? "0" : newValue.replace(/^0+/, ""));
          }
        }}
      />
    </div>
    <div className="flex flex-col">
      <Button
        size="sm"
        variant="outline"
        className="px-2 py-0 h-6"
        onClick={() => onChange((value + 1).toString())}
      >
        <Plus size={12} />
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="px-2 py-0 h-6"
        onClick={() => onChange(Math.max(0, value - 1).toString())}
      >
        <Minus size={12} />
      </Button>
    </div>
    <span className="text-sm text-muted-foreground w-12 text-right">
      {probability.toFixed(2)}%
    </span>
  </div>
);

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

  const titleText = `D${diceType === "PERCENTILE" ? "10 (Percentile)" : diceType} Rolls (Total: ${totalRolls})`;
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
  const reorderSides = (sides: string[]) => {
    if (diceType === "PERCENTILE") {
      return [...sides.slice(1), sides[0]];
    }
    return sides;
  };

  const orderedSides: string[] = reorderSides(
    rolls.map((_, i) =>
      diceType === "PERCENTILE"
        ? i === 0
          ? "00"
          : `${i}0`
        : diceType === "D10"
          ? i === 9
            ? "0"
            : `${i + 1}`
          : `${i + 1}`
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
  diceSetId: DiceSet["id"];
}) {
  const diceTypes = useMemo<DiceType[]>(
    () => initialDice.map((dice) => dice.type),
    [initialDice]
  );
  const [rolls, setRolls] = useState<DiceRolls>(
    initialDice.reduce((acc, dice) => {
      // Assuming die_sides is an array of DieSide objects
      acc[dice.type] = dice.die_sides.map((side) => side.rolled_count || 0);
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
    (diceType: DiceType, face: number, value: string) => {
      const count = value === "" ? 0 : parseInt(value, 10);
      if (isNaN(count) || count < 0) {
        return;
      }

      setRolls((prevRolls) => {
        const newRolls = { ...prevRolls };
        newRolls[diceType][face - 1] = count;
        return newRolls;
      });

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
