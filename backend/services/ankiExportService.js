/**
 * @fileoverview Service for generating Anki-compatible .apkg files from flashcard data.
 * Uses better-sqlite3 for in-memory DB creation and archiver for zipping.
 * Note: Requires 'better-sqlite3' and 'archiver' to be installed in the backend.
 */
const Database = require('better-sqlite3');
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Generates an .apkg file buffer from an array of flashcards.
 * 
 * @param {Array} cards - Array of { front, back, interval, easeFactor, repetitions }
 * @param {string} deckName - Name of the Anki deck.
 * @returns {Promise<Buffer>} The binary buffer of the .apkg file.
 */
async function generateAnkiPackage(cards, deckName) {
    return new Promise((resolve, reject) => {
        try {
            // 1. Create in-memory SQLite database
            const db = new Database(':memory:');

            // 2. Create minimal Anki schema
            db.exec(`
        CREATE TABLE col (
          id INTEGER PRIMARY KEY,
          crt INTEGER,
          mod INTEGER,
          scm INTEGER,
          ver INTEGER,
          dty INTEGER,
          usn INTEGER,
          ls INTEGER,
          conf TEXT,
          models TEXT,
          decks TEXT,
          dconf TEXT,
          tags TEXT
        );
        
        CREATE TABLE notes (
          id INTEGER PRIMARY KEY,
          guid TEXT,
          mid INTEGER,
          mod INTEGER,
          usn INTEGER,
          tags TEXT,
          flds TEXT,
          sfld INTEGER,
          csum INTEGER,
          flags INTEGER,
          data TEXT
        );

        CREATE TABLE cards (
          id INTEGER PRIMARY KEY,
          nid INTEGER,
          did INTEGER,
          ord INTEGER,
          mod INTEGER,
          usn INTEGER,
          type INTEGER,
          queue INTEGER,
          due INTEGER,
          ivl INTEGER,
          factor INTEGER,
          reps INTEGER,
          lapses INTEGER,
          left INTEGER,
          odue INTEGER,
          odid INTEGER,
          flags INTEGER,
          data TEXT
        );
      `);

            // 3. Insert collection metadata (simplified)
            const now = Math.floor(Date.now() / 1000);
            const defaultConf = JSON.stringify({ "activeDecks": [1], "curDeck": 1 });
            const defaultModels = JSON.stringify({ "1": { "id": 1, "name": "Basic", "flds": [{ "name": "Front" }, { "name": "Back" }] } });
            const defaultDecks = JSON.stringify({ "1": { "id": 1, "name": deckName, "conf": 1 } });

            db.prepare(`INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                .run(1, now, now, now, 11, 0, 0, 0, defaultConf, defaultModels, defaultDecks, '{}', '[]');

            // 4. Insert notes and cards
            const insertNote = db.prepare(`INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            const insertCard = db.prepare(`INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

            let noteId = 1000;
            let cardId = 2000;

            for (const card of cards) {
                const guid = crypto.randomUUID().replace(/-/g, '').substring(0, 10);
                const flds = `${card.front}\x1f${card.back}`; // Anki field separator

                insertNote.run(noteId, guid, 1, now, 0, '', flds, card.front, 0, 0, '');

                // Map SM-2 data to Anki fields
                // Anki factor is 2500 for 2.5 ease. ivl is days.
                const ankiFactor = Math.round((card.easeFactor || 2.5) * 1000);
                const ankiIvl = card.interval || 1;

                insertCard.run(
                    cardId, noteId, 1, 0, now, 0, 0, 0, ankiIvl, ankiIvl, ankiFactor, card.repetitions || 0, 0, 0, 0, 0, 0, ''
                );

                noteId++;
                cardId++;
            }

            // 5. Write DB to temporary file
            const tempDbPath = path.join(__dirname, `temp_anki_${Date.now()}.sqlite`);
            db.backup(tempDbPath);
            db.close();

            // 6. Zip into .apkg format
            const apkgPath = tempDbPath.replace('.sqlite', '.apkg');
            const output = fs.createWriteStream(apkgPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                fs.unlinkSync(tempDbPath); // Clean up temp sqlite file
                const buffer = fs.readFileSync(apkgPath);
                fs.unlinkSync(apkgPath); // Clean up temp apkg file
                resolve(buffer);
            });

            archive.on('error', (err) => {
                fs.unlinkSync(tempDbPath);
                reject(err);
            });

            archive.pipe(output);
            archive.file(tempDbPath, { name: 'collection.anki2' });
            archive.finalize();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = {
    generateAnkiPackage,
};
