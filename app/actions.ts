"use server";

import { encodedRedirect } from "@/utils/utils";
import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { DiceSet, Dice, DiceRoll } from '@/src/types/dice';

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link."
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  if (data.session) {
    await supabase.auth.setSession(data.session);
    return redirect("/dice-sets");
  }

  return encodedRedirect("error", "/sign-in", "Failed to create session");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/reset-password`,
  });

  if (error) {
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password"
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password."
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/reset-password",
      "Password and confirm password are required"
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect("error", "/reset-password", "Passwords do not match");
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect("error", "/reset-password", "Password update failed");
  }

  encodedRedirect("success", "/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export async function fetchDiceSets(): Promise<DiceSet[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No user found");
  }

  const { data, error } = await supabase
    .from("dice_sets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function addDiceSet(formData: FormData): Promise<DiceSet> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No user found");
  }

  const name = formData.get("name") as string;

  if (!name || name.trim() === "") {
    throw new Error("Dice set name is required");
  }

  const { data, error } = await supabase.rpc(
    "create_dice_set_with_standard_dice",
    {
      set_name: name.trim(),
      user_id: user.id,
    }
  );

  if (error) {
    throw error;
  }

  return data[0];
}

export async function fetchDiceSet(id: string): Promise<{ diceSet: DiceSet; dice: Dice[] } | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("No user found");
  }

  const { data: diceSet, error: diceSetError } = await supabase
    .from("dice_sets")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (diceSetError) {
    if (diceSetError.code === "PGRST116") {
      return null;
    }
    throw diceSetError;
  }

  const { data: dice, error: diceError } = await supabase
    .from("dice")
    .select(`
      *,
      die_sides (*)
    `)
    .eq("dice_set_id", id);

  if (diceError) {
    throw diceError;
  }

  return { diceSet, dice };
}

export async function updateDiceRolls(diceSetId: DiceSet['id'], rolls: DiceRoll[]) {
  const supabase = createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("No user found");
    }

    const { data: diceData, error: diceError } = await supabase
      .from("dice")
      .select("id, type")
      .eq("dice_set_id", diceSetId);

    if (diceError) {
      throw diceError;
    }

    if (!diceData || diceData.length === 0) {
      throw new Error(`No dice found for dice set: ${diceSetId}`);
    }

    const updates = rolls.map((roll) => {
      const die = diceData.find((d) => d.type === roll.diceType);
      if (!die) {
        throw new Error(`Die not found for type: ${roll.diceType}`);
      }
      let side = roll.side;
      if (roll.diceType === 'PERCENTILE' && roll.side === 100) {
        side = 0;
      }
      return {
        die_id: die.id,
        side: side,
        rolled_count: roll.count,
      };
    });

    console.log("Updates to be applied:", updates);

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("die_sides")
        .update({ rolled_count: update.rolled_count })
        .match({ die_id: update.die_id, side: update.side });

      if (updateError) {
        throw updateError;
      }
    }

    revalidatePath(`/dice-tracker/${diceSetId}`);

    return { success: true };
  } catch (error) {
    console.log(error);
    if (error instanceof Error) {
      return { error: error.message, details: error.stack };
    } else {
      return { error: String(error) };
    }
  }
}
