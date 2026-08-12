---
title: '[FEAT]: Password Reset Flow with Secure One-Time Password (OTP) Email Delivery'
labels: 'ECSoC26, ECSoC26-L1, feature, security, authentication, backend, frontend'
assignees: ''
---

## Issue Type
Feature / Security / Authentication

## Priority
P1 High

## Summary
Implement a secure "Forgot Password" workflow allowing users to request a 6-digit One-Time Password (OTP) or password reset token sent via email (Nodemailer), verify the code, and reset their password securely.

## Problem Statement
Users who forget their account passwords currently have no self-service mechanism to recover access, resulting in locked out accounts and administrative overhead.

## Current Behavior
The login screen links to a non-functional "Forgot Password?" page or lacks password recovery endpoints.

## Expected Behavior
1. User clicks "Forgot Password?" on login screen and inputs registered email address.
2. Backend generates a 6-digit numeric OTP (valid for 15 minutes), hashes it in the DB, and emails it to the user.
3. User inputs the 6-digit OTP code and sets a new password on the frontend reset screen.
4. On success, old sessions are invalidated and user can log in with their new password.

## User Story
As a user who forgot their account password  
I want to receive a secure password reset code in my email inbox  
So that I can verify my identity and set a new password to recover my account  

## Proposed Solution
1. Use `crypto.randomInt` for 6-digit OTP generation and `bcrypt` for hashing OTP tokens before DB saving.
2. Integrate `nodemailer` with SMTP configuration (SendGrid/Mailgun/Gmail SMTP) in `emailService.js`.
3. Create frontend multi-step modal (`ForgotPasswordModal.jsx`) handling Email -> OTP Entry -> New Password.

## Technical Scope

### Frontend Impact
- New Component: `frontend/src/components/auth/ForgotPasswordModal.jsx`, `frontend/src/components/auth/OtpInput.jsx`.
- Update `frontend/src/pages/Login.jsx`.

### Backend Impact
- New Service: `backend/services/emailService.js`.
- Updates to `backend/controllers/authController.js` (`forgotPassword`, `verifyOtp`, `resetPassword`).
- Route additions in `backend/routes/authRoutes.js`.

### Database Impact
- `User` model updates: Add `resetPasswordOtpHash: STRING`, `resetPasswordOtpExpires: DATE`, `resetPasswordAttempts: INTEGER`.

### API Impact
- `POST /api/auth/forgot-password` -> sends OTP email.
- `POST /api/auth/verify-otp` -> checks code validity.
- `POST /api/auth/reset-password` -> validates token & updates password.

### Infrastructure Impact
Nodemailer configuration environment variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`.

## Acceptance Criteria
- [ ] Submitting valid email triggers email with 6-digit OTP within 10 seconds.
- [ ] OTP expires after exactly 15 minutes.
- [ ] Maximum 5 incorrect OTP attempts allowed before requiring a new code request (rate limiting).
- [ ] Password reset succeeds only with valid, unexpired OTP.
- [ ] Password field enforces minimum 8 characters with upper/lowercase, number, and special character rules.

## Edge Cases
- [ ] Non-existent email submitted -> return generic success message to prevent user enumeration attacks.
- [ ] Rapid resend OTP requests -> rate limit resends to maximum 1 email per 60 seconds.

## Security Considerations
Store hashed OTPs in DB (`bcrypt`). Prevent user enumeration by returning identical generic response messages regardless of whether the email exists.

## Accessibility Considerations
Ensure 6-digit OTP input boxes support paste events, auto-focus progression, and screen-reader status announcements.

## Performance Considerations
Send emails asynchronously without blocking Express HTTP response cycle.

## Testing Requirements

### Unit Tests
- [ ] Test OTP generation and expiry checking logic.
- [ ] Test password complexity validation regex.

### Integration Tests
- [ ] End-to-end test request forgot password -> verify OTP -> reset password with nodemailer mock.

## Affected Areas
- [x] Frontend
- [x] Backend
- [x] Authentication
- [x] Security

## Open Source Programs
- [x] Elite Summer of Code (ECSoC26)

## Difficulty Level (ECSoC26)
- [x] Level 1 (Easy / Beginner-friendly) (ECSoC26-L1)

## Definition of Done
- [ ] Implementation completed
- [ ] Acceptance criteria met
- [ ] Unit & integration tests passing
- [ ] Setup guide updated with email configuration details
- [ ] Ready for production
