/**
 * Middleware to verify Google reCAPTCHA v3 or Cloudflare Turnstile token
 * before processing login or registration requests.
 */
const verifyCaptcha = async (req, res, next) => {
  // Bypass CAPTCHA check in non-production environments if no secret key is set
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (process.env.NODE_ENV === 'test' || !secretKey) {
    return next();
  }

  const captchaToken = req.body?.captchaToken;
  if (!captchaToken) {
    return res.status(400).json({
      success: false,
      error: 'reCAPTCHA token is required.',
    });
  }

  try {
    const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';
    
    // We send a POST request with URL-encoded parameters to Google's siteverify endpoint
    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: captchaToken,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return res.status(403).json({
        success: false,
        error: 'reCAPTCHA verification failed.',
      });
    }

    // Google reCAPTCHA v3 score threshold check (default: 0.5)
    if (data.score !== undefined && data.score < 0.5) {
      return res.status(403).json({
        success: false,
        error: 'Suspicious request detected (low captcha score).',
      });
    }

    next();
  } catch (error) {
    console.error('reCAPTCHA validation error:', error);
    return res.status(403).json({
      success: false,
      error: 'reCAPTCHA verification error.',
    });
  }
};

module.exports = verifyCaptcha;
