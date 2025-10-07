import { NextRequest, NextResponse } from "next/server";
import { resolveBackendBaseUrl } from "@/lib/api/apiConfig";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const backendBase = resolveBackendBaseUrl();
    const cleanBase = backendBase.replace(/\/+$/, "");

    const backendRes = await fetch(`${cleanBase}/api/assistant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const raw = await backendRes.text();
    let data: any = {};
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch (parseError) {
        console.error("assistant api parse error:", parseError, raw);
        return NextResponse.json(
          { success: false, message: "Respuesta inválida del asistente" },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    console.error("assistant api error:", error);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
