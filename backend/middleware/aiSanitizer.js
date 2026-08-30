/**
 * Prompt Injection Sanitizer Middleware
 * Scans incoming AI prompts against jailbreak signatures and strips dangerous HTML/script injection vectors.
 */

const JAILBREAK_PATTERNS = [
  /ignore\s+(all\s+|previous\s+|prior\s+)?instructions/i,
  /system\s+override/i,
  /disregard\s+(all\s+|previous\s+)?guidelines/i,
  /you\s+are\s+now\s+(DAN|jailbroken|unrestricted)/i,
  /bypass\s+(safety|content)\s+(filters|policies)/i,
  /forget\s+(all\s+)?previous\s+rules/i,
  /act\s+as\s+an?\s+unfiltered\s+AI/i,
  /do\s+anything\s+now/i,
];

const SCRIPT_INJECTION_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
];

const scanForJailbreak = (value) => {
  if (typeof value !== 'string') return false;
  return JAILBREAK_PATTERNS.some((pattern) => pattern.test(value));
};

const sanitizeInputString = (str) => {
  if (typeof str !== 'string') return str;
  let clean = str;
  SCRIPT_INJECTION_PATTERNS.forEach((pattern) => {
    clean = clean.replace(pattern, '');
  });
  return clean;
};

const recursivelySanitize = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeInputString(obj[key]);
    } else if (typeof obj[key] === 'object') {
      recursivelySanitize(obj[key]);
    }
  }
  return obj;
};

const aiSanitizer = (req, res, next) => {
  try {
    const fieldsToScan = ['prompt', 'topic', 'content', 'message', 'text', 'notesText'];
    let jailbreakDetected = false;
    let offendingField = null;

    // Scan top-level body fields
    for (const field of fieldsToScan) {
      if (req.body && req.body[field] && scanForJailbreak(req.body[field])) {
        jailbreakDetected = true;
        offendingField = field;
        break;
      }
    }

    // Scan full stringified body if not caught in top-level fields
    if (!jailbreakDetected && req.body && typeof req.body === 'object') {
      const stringifiedBody = JSON.stringify(req.body);
      if (scanForJailbreak(stringifiedBody)) {
        jailbreakDetected = true;
        offendingField = 'body';
      }
    }

    if (jailbreakDetected) {
      const identifier = req.user && req.user.id ? `user ${req.user.id}` : `IP ${req.ip || '127.0.0.1'}`;
      console.warn(`[SECURITY AUDIT] Prompt injection attempt detected and blocked from ${identifier} in field '${offendingField}'.`);

      return res.status(400).json({
        success: false,
        error: 'Prompt injection or unsafe input detected. Request blocked for security compliance.',
        securityViolation: true,
      });
    }

    // Sanitize harmless HTML/Script vectors
    if (req.body && typeof req.body === 'object') {
      recursivelySanitize(req.body);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  aiSanitizer,
  scanForJailbreak,
  sanitizeInputString,
};
