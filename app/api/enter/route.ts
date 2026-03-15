import { NextResponse } from "next/server";
import { getGoogleSheet } from "@/lib/googleSheets";

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

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
    const membersSheet = doc.sheetsByTitle["Members"];
    let sessionsSheet = doc.sheetsByTitle["UsageSessions"];
    
    if (!membersSheet) {
      return NextResponse.json({ success: false, error: "Members sheet not found" }, { status: 500 });
    }

    if (!sessionsSheet) {
      sessionsSheet = await doc.addSheet({ title: "UsageSessions", headerValues: ["id", "memberId", "enteredAt", "exitedAt"]});
    } else {
        try { await sessionsSheet.loadHeaderRow(); } catch (e) {
            await sessionsSheet.setHeaderRow(["id", "memberId", "enteredAt", "exitedAt"]);
        }
    }

    // Check if member exists
    const memberRows = await membersSheet.getRows();
    const memberRow = memberRows.find(row => row.get("id") === memberId);

    if (!memberRow) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    // Check if already active (not exited and entered within last 30 mins)
    const thirtyMinsAgo = new Date(Date.now() - THIRTY_MINUTES_MS);
    const sessionRows = await sessionsSheet.getRows();
    
    const isAlreadyActive = sessionRows.some(row => {
        if (row.get("memberId") !== memberId) return false;
        if (row.get("exitedAt") && row.get("exitedAt").trim() !== "") return false;
        
        const enteredAt = row.get("enteredAt");
        if (!enteredAt) return false;
        
        return new Date(enteredAt) >= thirtyMinsAgo;
    });

    if (isAlreadyActive) {
      return NextResponse.json(
        { success: false, error: "Already entered" },
        { status: 400 }
      );
    }

    // Create new entry session
    const newSessionId = sessionRows.length > 0 ? Math.max(...sessionRows.map(r => parseInt(r.get("id") || "0", 10))) + 1 : 1;
    const newSessionData = {
        id: newSessionId.toString(),
        memberId,
        enteredAt: new Date().toISOString(),
        exitedAt: ""
    }
    await sessionsSheet.addRow(newSessionData);

    const sessionWithMember = {
        ...newSessionData,
        id: newSessionId,
        member: {
            id: memberRow.get("id"),
            dogName: memberRow.get("dogName"),
            photoUrl: memberRow.get("photoUrl") || null,
        }
    };

    return NextResponse.json({ success: true, session: sessionWithMember });
  } catch (error: any) {
    console.error("Failed to enter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process entry: " + error.message },
      { status: 500 }
    );
  }
}

