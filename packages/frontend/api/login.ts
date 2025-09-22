import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const backendUrl =
      process.env.BACKEND_COMPLETE_URL ||
      process.env.BACKEND_SHORT_URL

    const backendRes = await fetch(`${backendUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await backendRes.json();
    res.status(backendRes.status).json(data);
  } catch (error) {
    console.error("Error connecting to backend:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
