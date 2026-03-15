import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Initialize auth - see https://theoephraim.github.io/node-google-spreadsheet/#/guides/authentication
const serviceAccountAuth = new JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  // Parse private key correctly since environments variables replace newlines with string "\n"
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

let docInstance: GoogleSpreadsheet | null = null;

export async function getGoogleSheet() {
  if (!docInstance) {
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    if (!sheetId) {
      throw new Error("Missing GOOGLE_SHEETS_ID environment variable.");
    }
    
    docInstance = new GoogleSpreadsheet(sheetId, serviceAccountAuth);
    
    // Load document properties and worksheets
    await docInstance.loadInfo();
  }
  
  return docInstance;
}

// Utility models matching Prisma structure
export type MemberRow = {
  id: string;
  dogName: string;
  photoUrl: string | null;
  createdAt: string;
}

export type UsageSessionRow = {
  id: string;
  memberId: string;
  enteredAt: string;
  exitedAt: string | null;
}
