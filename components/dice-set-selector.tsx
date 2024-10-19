"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addDiceSet } from "@/app/actions";
import { useFormStatus } from "react-dom";

interface DiceSet {
  id: number;
  name: string;
}

function AddDiceSetForm({
  onAddDiceSet,
}: {
  onAddDiceSet: (newSet: DiceSet) => void;
}) {
  const { pending } = useFormStatus();

  async function handleAddDiceSet(formData: FormData) {
    const newSet = await addDiceSet(formData);
    onAddDiceSet(newSet);
  }

  return (
    <form action={handleAddDiceSet} className="flex items-end space-x-2">
      <div className="flex-grow">
        <Label htmlFor="new-set-name">New Set Name</Label>
        <Input
          id="new-set-name"
          name="name"
          placeholder="Enter new set name"
          required
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add Set"}
      </Button>
    </form>
  );
}

export function DiceSetSelector({
  initialDiceSets,
}: {
  initialDiceSets: DiceSet[];
}) {
  const [diceSets, setDiceSets] = useState<DiceSet[]>(initialDiceSets);
  const router = useRouter();

  const handleAddDiceSet = (newSet: DiceSet) => {
    setDiceSets((prevSets) => [...prevSets, newSet]);
  };

  const selectDiceSet = (id: number) => {
    router.push(`/dice-tracker/${id}`);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Dice Sets</h2>
      <div className="space-y-2">
        {diceSets.map((set) => (
          <Button
            key={set.id}
            onClick={() => selectDiceSet(set.id)}
            className="w-full text-left justify-start"
          >
            {set.name}
          </Button>
        ))}
      </div>
      <AddDiceSetForm onAddDiceSet={handleAddDiceSet} />
    </div>
  );
}
