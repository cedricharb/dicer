import { DiceSetSelector } from "@/components/dice-set-selector";
import { fetchDiceSets } from "@/app/actions";

export default async function DiceSetsPage() {
  const initialDiceSets = await fetchDiceSets();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dice Sets</h1>
      <DiceSetSelector initialDiceSets={initialDiceSets} />
    </div>
  );
}
