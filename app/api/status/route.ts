import { NextResponse } from "next/server";
import { getGoogleSheet } from "@/lib/googleSheets";

// 30 minutes in milliseconds
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

export async function GET() {
  try {
    const doc = await getGoogleSheet();
    const sessionsSheet = doc.sheetsByTitle["UsageSessions"];
    const membersSheet = doc.sheetsByTitle["Members"];
    
    if (!sessionsSheet || !membersSheet) {
        return NextResponse.json({ success: true, activeSessions: [] });
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

    const thirtyMinsAgo = new Date(Date.now() - THIRTY_MINUTES_MS);
    
    const activeSessions = [];
    
    for (const row of sessionRows) {
        const exitedAt = row.get("exitedAt");
        const enteredAt = row.get("enteredAt");
        
        if (!exitedAt || exitedAt.trim() === "") {
            const enteredDate = new Date(enteredAt);
            if (enteredDate > thirtyMinsAgo) {
                activeSessions.push({
                    id: parseInt(row.get("id") || "0", 10),
                    memberId: row.get("memberId"),
                    enteredAt,
                    member: membersMap.get(row.get("memberId"))
                });
            }
        }
    }

    // Sort by latest entry
    activeSessions.sort((a, b) => new Date(b.enteredAt).getTime() - new Date(a.enteredAt).getTime());

    return NextResponse.json({ success: true, activeSessions });
  } catch (error: any) {
    console.error("Failed to get status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch status: " + error.message },
      { status: 500 }
    );
  }
}
