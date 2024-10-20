import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DiceInputProps {
  side: string;
  value: number;
  probability: number;
  onChange: (value: string) => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onClick: () => void;
}

export const DiceInput = ({
  side,
  value,
  probability,
  onChange,
  onIncrement,
  onDecrement,
  onClick,
}: DiceInputProps) => (
  <div className="flex items-center gap-2 mb-2 w-full">
    <Label className="cursor-pointer w-8 text-right" onClick={onClick}>
      {side}:
    </Label>
    <div className="relative flex-1">
      <div
        className="absolute inset-0 rounded-md pointer-events-none bg-primary/10"
        style={{ width: `${probability}%` }}
      />
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={value === 0 ? "0" : value.toString()}
        className="w-full relative bg-transparent"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
    <div className="flex flex-col gap-1">
      <button
        className="w-6 h-6 flex items-center justify-center bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          onIncrement();
        }}
      >
        +
      </button>
      <button
        className="w-6 h-6 flex items-center justify-center bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          onDecrement();
        }}
      >
        -
      </button>
    </div>
    <span className="text-sm text-muted-foreground w-12 text-right">
      {probability.toFixed(2)}%
    </span>
  </div>
);
