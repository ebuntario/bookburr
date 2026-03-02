"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { MARITAL_STATUS } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { requireAuth, mapActionError, type ActionResult } from "./helpers";

export async function updateProfile(input: {
  name?: string;
  maritalStatus?: string | null;
  dietaryPreferences?: string[];
  defaultCuisinePreferences?: string[];
}): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await requireAuth();
  } catch (err) {
    return mapActionError(err, { UNAUTHORIZED: "unauthorized" });
  }

  const {
    name,
    maritalStatus,
    dietaryPreferences,
    defaultCuisinePreferences,
  } = input;

  if (maritalStatus != null) {
    const validStatuses = Object.values(MARITAL_STATUS) as string[];
    if (!validStatuses.includes(maritalStatus)) {
      return { ok: false, error: "Status ga valid" };
    }
  }

  await db
    .update(users)
    .set({
      ...(name !== undefined && { name: name.trim() || null }),
      ...(maritalStatus !== undefined && { maritalStatus }),
      ...(dietaryPreferences !== undefined && { dietaryPreferences }),
      ...(defaultCuisinePreferences !== undefined && {
        defaultCuisinePreferences,
      }),
    })
    .where(eq(users.id, userId));

  revalidatePath("/profile");
  return { ok: true };
}
