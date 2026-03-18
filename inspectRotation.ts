import { getGoogleSheet } from './lib/googleSheets';

async function inspect() {
    try {
        const doc = await getGoogleSheet();
        const sheet = doc.sheetsByTitle["Rotation"];
        if (!sheet) {
            console.log("Rotation sheet not found");
            return;
        }
        await sheet.loadHeaderRow();
        console.log("Headers:", sheet.headerValues);
        const rows = await sheet.getRows();
        console.log("Rows:", rows.map(r => r.toObject()));
    } catch (e) {
        console.error(e);
    }
}
inspect();
