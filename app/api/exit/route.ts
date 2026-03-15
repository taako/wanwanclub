import { NextResponse } from "next/server";
import { getGoogleSheet } from "@/lib/googleSheets";

export async function POST(request: Request) {
  try {
    const { memberId } = await request.json();

    if (!memberId) {
      return NextResponse.json(
        { success: false, error: "memberId is required" },
        { status: 400 }
      );
    }

    const doc = await getGoogleSheet();
    const sessionsSheet = doc.sheetsByTitle["UsageSessions"];
    
    if (!sessionsSheet) {
      return NextResponse.json({ success: false, error: "UsageSessions sheet not found" }, { status: 500 });
    }

    // Find the current active session
    const sessionRows = await sessionsSheet.getRows();
    let activeSessionRow = null;

    // Search backwards for the most recent unexited session
    for (let i = sessionRows.length - 1; i >= 0; i--) {
        const row = sessionRows[i];
        if (row.get("memberId") === memberId) {
            const exitedAt = row.get("exitedAt");
            if (!exitedAt || exitedAt.trim() === "") {
                activeSessionRow = row;
                break;
            }
        }
    }

    if (!activeSessionRow) {
      return NextResponse.json(
        { success: false, error: "No active session found for this member" },
        { status: 404 }
      );
    }

    // Mark as exited
    activeSessionRow.set("exitedAt", new Date().toISOString());
    await activeSessionRow.save();

    const updatedSession = {
        id: activeSessionRow.get("id"),
        memberId: activeSessionRow.get("memberId"),
        enteredAt: activeSessionRow.get("enteredAt"),
        exitedAt: activeSessionRow.get("exitedAt")
    };

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error: any) {
    console.error("Failed to exit:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process exit: " + error.message },
      { status: 500 }
    );
  }
}
