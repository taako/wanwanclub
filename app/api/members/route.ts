import { NextResponse } from "next/server";
import { getGoogleSheet } from "@/lib/googleSheets";
import { writeFile } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const doc = await getGoogleSheet();
    const sheet = doc.sheetsByTitle["Members"];
    if (!sheet) throw new Error("Sheet 'Members' not found");

    const rows = await sheet.getRows();
    
    // Process rows and map to JS objects
    const members = rows.map(row => ({
      id: row.get('id'),
      dogName: row.get('dogName'),
      photoUrl: row.get('photoUrl') || null,
      createdAt: row.get('createdAt')
    })).reverse(); // Order by newest

    return NextResponse.json({ success: true, members });
  } catch (error: any) {
    console.error("Failed to list members:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch members: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const dogName = formData.get("dogName") as string;
    const photo = formData.get("photo") as File | null;

    if (!id || !dogName) {
      return NextResponse.json(
        { success: false, error: "id and dogName are required" },
        { status: 400 }
      );
    }

    const doc = await getGoogleSheet();
    let sheet = doc.sheetsByTitle["Members"];
    
    // Ensure sheet headers exist if it's a completely blank sheet
    if (!sheet) {
      sheet = await doc.addSheet({ title: "Members", headerValues: ["id", "dogName", "photoUrl", "createdAt"]});
    } else {
        try { await sheet.loadHeaderRow(); } catch (e) {
            await sheet.setHeaderRow(["id", "dogName", "photoUrl", "createdAt"]);
        }
    }

    // Check if ID already exists
    const rows = await sheet.getRows();
    const existing = rows.find(row => row.get("id") === id);

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Member ID already in use" },
        { status: 400 }
      );
    }

    let photoUrl = null;

    if (photo && photo.size > 0) {
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const fileExt = photo.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const uploadDir = join(process.cwd(), 'public/uploads');
      const filePath = join(uploadDir, fileName);
      
      await writeFile(filePath, buffer);
      photoUrl = `/uploads/${fileName}`;
    }

    const newMember = {
      id,
      dogName,
      photoUrl: photoUrl || "",
      createdAt: new Date().toISOString(),
    };

    await sheet.addRow(newMember);

    return NextResponse.json({ success: true, member: newMember });
  } catch (error: any) {
    console.error("Failed to create member:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create member: " + error.message },
      { status: 500 }
    );
  }
}

