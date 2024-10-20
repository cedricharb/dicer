import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DiceInput } from "./dice-input";
import { DiceType } from "@/src/types/dice";

interface DiceCardProps {
  diceType: DiceType;
  rolls: number[];
  selectedProbability:
    | { probability: number; side: string | number }
    | undefined;
  onFaceInputChange: (face: number, value: string) => void;
  onSideClick: (index: number) => void;
  calculateProbabilities: () => Array<{ side: string; probability: number }>;
}

export const DiceCard: React.FC<DiceCardProps> = ({
  diceType,
  rolls,
  selectedProbability,
  onFaceInputChange,
  onSideClick,
  calculateProbabilities,
}) => {
  const [probabilities, setProbabilities] = useState<
    Array<{ side: string; probability: number }>
  >([]);

  useEffect(() => {
    const newProbabilities = calculateProbabilities();
    setProbabilities(newProbabilities);
  }, [rolls, calculateProbabilities]);

  const totalRolls = rolls.reduce((sum, count) => sum + count, 0);

  const handleInputChange = (index: number, newValue: string) => {
    onFaceInputChange(index, newValue);
  };

  const handleIncrement = (index: number) => {
    const newValue = (rolls[index] + 1).toString();
    onFaceInputChange(index, newValue);
  };

  const handleDecrement = (index: number) => {
    const newValue = Math.max(0, rolls[index] - 1).toString();
    onFaceInputChange(index, newValue);
  };

  const getSideLabel = (index: number): string => {
    if (diceType === "PERCENTILE") {
      return index === 0 ? "00" : `${index}0`;
    }
    return (index + 1).toString();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{diceType} Dice</CardTitle>
      </CardHeader>
      <CardContent>
        {rolls.map((count, index) => {
          const side = getSideLabel(index);
          const probability = totalRolls > 0 ? (count / totalRolls) * 100 : 0;

          return (
            <DiceInput
              key={side}
              side={side}
              value={count}
              probability={probability}
              onChange={(value) => handleInputChange(index, value)}
              onIncrement={() => handleIncrement(index)}
              onDecrement={() => handleDecrement(index)}
              onClick={() => onSideClick(index)}
            />
          );
        })}
      </CardContent>
    </Card>
  );
};
