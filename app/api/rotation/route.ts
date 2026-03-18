import { NextResponse } from "next/server";
import { getGoogleSheet } from "@/lib/googleSheets";

export async function GET() {
  try {
    const doc = await getGoogleSheet();
    const sheet = doc.sheetsByTitle["Rotation"];
    
    if (!sheet) {
        return NextResponse.json({ success: false, error: "Rotation sheet not found" }, { status: 404 });
    }

    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();
    
    const rotationData = rows.map(row => ({
        month: row.get("month"),
        patrol: row.get("patrol"),
        clean: row.get("clean")
    }));

    const now = new Date();
    const monthKey = `${now.getFullYear()}/${now.getMonth() + 1}`;
    
    const currentRotation = rotationData.find(r => r.month === monthKey);

    return NextResponse.json({ 
        success: true, 
        rotation: currentRotation || null 
    });
  } catch (error: any) {
    console.error("Failed to get rotation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rotation: " + error.message },
      { status: 500 }
    );
  }
}
