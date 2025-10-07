import type { NextApiRequest, NextApiResponse } from "next";
import { resolveBackendBaseUrl } from "@/lib/api/apiConfig";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const backendBase = resolveBackendBaseUrl();
    const cleanBase = backendBase.replace(/\/+$/, "");

    const backendRes = await fetch(`${cleanBase}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await backendRes.json().catch(() => ({}));
    return res.status(backendRes.status).json(data);
  } catch (error) {
    console.error("Error connecting to backend:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
