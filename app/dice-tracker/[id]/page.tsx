import { fetchDiceSet } from "@/app/actions";
import { DiceCalculatorComponent } from "@/src/components/dice-calculator";
import { redirect } from "next/navigation";
import { DiceSet, Dice } from "@/src/types/dice";

export default async function DiceTrackerPage({
  params,
}: {
  params: { id: string };
}) {
  const result = await fetchDiceSet(params.id);

  if (!result) {
    redirect("/dice-sets");
  }

  const { diceSet, dice }: { diceSet: DiceSet; dice: Dice[] } = result;

  return (
    <div className="flex-1 w-full flex flex-col gap-20 items-center">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Dice Tracker: {diceSet.name}
      </h1>
      <DiceCalculatorComponent initialDice={dice} diceSetId={diceSet.id} />
    </div>
  );
}
