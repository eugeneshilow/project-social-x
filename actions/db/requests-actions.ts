"use server"

import { revalidatePath } from "next/cache"
import { createRequest } from "@/db/queries/requests-queries"
import { InsertRequest } from "@/db/schema/requests-schema"

export async function createRequestAction(data: InsertRequest) {
  console.log("[createRequestAction] Starting =>", data)

  try {
    const newRequest = await createRequest(data)
    console.log("[createRequestAction] Inserted =>", newRequest)

    revalidatePath("/")
    return {
      isSuccess: true,
      message: "Request created successfully",
      data: newRequest
    }
  } catch (error) {
    console.error("[createRequestAction] Error =>", error)
    return {
      isSuccess: false,
      message: "Failed to create request"
    }
  }
}