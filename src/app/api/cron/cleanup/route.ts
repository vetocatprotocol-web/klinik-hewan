import { NextResponse } from "next/server";
import { cleanupOldNotifications, cleanupOldAuditLogs } from "@/server/actions/notifications";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await Promise.all([
      cleanupOldNotifications(),
      cleanupOldAuditLogs(),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cleanup cron failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
