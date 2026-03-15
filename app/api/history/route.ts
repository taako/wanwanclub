import { NextResponse } from "next/server";
import { getGoogleSheet } from "@/lib/googleSheets";

export async function GET() {
  try {
    const doc = await getGoogleSheet();
    const sessionsSheet = doc.sheetsByTitle["UsageSessions"];
    const membersSheet = doc.sheetsByTitle["Members"];
    
    if (!sessionsSheet || !membersSheet) {
        return NextResponse.json({ success: true, history: [] });
    }

    const sessionRows = await sessionsSheet.getRows();
    const memberRows = await membersSheet.getRows();

    // Map members by ID for easy joining
    const membersMap = new Map();
    for (const row of memberRows) {
        membersMap.set(row.get("id"), {
            id: row.get("id"),
            dogName: row.get("dogName"),
            photoUrl: row.get("photoUrl") || null,
            createdAt: row.get("createdAt")
        });
    }

    const history = sessionRows.map(row => ({
        id: parseInt(row.get("id") || "0", 10),
        memberId: row.get("memberId"),
        enteredAt: row.get("enteredAt"),
        exitedAt: row.get("exitedAt"),
        member: membersMap.get(row.get("memberId"))
    }));

    // Sort by latest entry
    history.sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime());

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error("Failed to get history:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch history: " + error.message },
      { status: 500 }
    );
  }
}
