import { NextResponse } from "next/server";
import { getGoogleSheet } from "@/lib/googleSheets";
import { uploadImage } from "@/lib/cloudinary";

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
      group: row.get('group') || "",
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
    const group = formData.get("group") as string || "";
    const photo = formData.get("photo") as File | null;

    if (!id || !dogName) {
      return NextResponse.json(
        { success: false, error: "id and dogName are required" },
        { status: 400 }
      );
    }

    const doc = await getGoogleSheet();
    let sheet = doc.sheetsByTitle["Members"];
    
    // Ensure sheet headers exist and include "group"
    if (!sheet) {
      sheet = await doc.addSheet({ title: "Members", headerValues: ["id", "dogName", "group", "photoUrl", "createdAt"]});
    } else {
        await sheet.loadHeaderRow();
        const headers = sheet.headerValues;
        if (!headers.includes("group")) {
          // Add "group" to headers, ideally after dogName
          const newHeaders = [...headers];
          const dogNameIndex = newHeaders.indexOf("dogName");
          if (dogNameIndex !== -1) {
            newHeaders.splice(dogNameIndex + 1, 0, "group");
          } else {
            newHeaders.push("group");
          }
          await sheet.setHeaderRow(newHeaders);
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
      photoUrl = await uploadImage(buffer);
    }

    const newMember = {
      id,
      dogName,
      group,
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

export async function PATCH(request: Request) {
  try {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    const dogName = formData.get("dogName") as string;
    const group = formData.get("group") as string;
    const photo = formData.get("photo") as File | null;

    if (!id || !dogName) {
      return NextResponse.json(
        { success: false, error: "id and dogName are required" },
        { status: 400 }
      );
    }

    const doc = await getGoogleSheet();
    const sheet = doc.sheetsByTitle["Members"];
    if (!sheet) throw new Error("Sheet 'Members' not found");

    const rows = await sheet.getRows();
    const row = rows.find(r => r.get("id") === id);

    if (!row) {
      return NextResponse.json(
        { success: false, error: "Member not found" },
        { status: 404 }
      );
    }

    let photoUrl = row.get("photoUrl");

    if (photo && photo.size > 0 && typeof photo !== 'string') {
      const bytes = await photo.arrayBuffer();
      const buffer = Buffer.from(bytes);
      photoUrl = await uploadImage(buffer);
    }

    row.set("dogName", dogName);
    if (group !== undefined) row.set("group", group);
    row.set("photoUrl", photoUrl || "");
    await row.save();

    return NextResponse.json({ 
      success: true, 
      member: {
        id,
        dogName,
        group: row.get("group"),
        photoUrl,
        createdAt: row.get("createdAt")
      } 
    });
  } catch (error: any) {
    console.error("Failed to update member:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update member: " + error.message },
      { status: 500 }
    );
  }
}

