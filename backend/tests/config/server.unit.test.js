const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const serverJsPath = path.join(__dirname, '..', '..', 'server.js');

describe('Server Startup Integrity', () => {
  it('server.js should parse without syntax errors (no duplicate const declarations)', () => {
    // Issue #345: duplicate `const` declarations in the same CommonJS module
    // scope (e.g. `protect`, `Note`, `PYQ` required twice) caused a fatal
    // SyntaxError on startup. `node --check` validates module-level parse
    // correctness without executing the file.
    expect(() => {
      execFileSync(process.execPath, ['--check', serverJsPath], { stdio: 'pipe' });
    }).not.toThrow();
  });

  it('should declare each previously-duplicated identifier exactly once', () => {
    const source = fs.readFileSync(serverJsPath, 'utf8');

    // Each of these were historically required twice, which crashed the server.
    const declarations = [
      "const { protect } = require('./middleware/auth')",
      "const Note = require('./models/Note')",
      "const PYQ = require('./models/PYQ')",
    ];

    for (const decl of declarations) {
      const occurrences = source.split(decl).length - 1;
      expect(occurrences).toBe(1);
    }
  });

  it('should include the SPA production catch-all routing configurations', () => {
    const source = fs.readFileSync(serverJsPath, 'utf8');
    expect(source).toContain("app.use(express.static(path.join(__dirname, '../frontend/dist')));");
    expect(source).toContain("res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));");
  });
});
