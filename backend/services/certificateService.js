const PDFDocument = require('pdfkit');
const crypto = require('crypto');
const StudyPlan = require('../models/StudyPlan');
const Exam = require('../models/Exam');
const User = require('../models/User');

/**
 * Generate a unique certificate number
 * Format: CERT-YYYY-XXXXXXXX
 * @returns {string} Unique certificate number
 */
const generateCertificateNumber = () => {
  const year = new Date().getFullYear();
  const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `CERT-${year}-${randomBytes}`;
};

/**
 * Certificate templates configuration
 */
const CERTIFICATE_TEMPLATES = {
  default: {
    name: 'default',
    layout: 'landscape',
    pageSize: 'A4',
    backgroundColor: '#ffffff',
    title: 'Certificate of Achievement',
    titleFontSize: 40,
    titleColor: '#1a1a1a',
    bodyFontSize: 18,
    bodyColor: '#333333',
    accentColor: '#4a90e2',
    borderColor: '#4a90e2',
    borderWidth: 8,
  },
  modern: {
    name: 'modern',
    layout: 'landscape',
    pageSize: 'A4',
    backgroundColor: '#f8f9fa',
    title: 'Certificate of Completion',
    titleFontSize: 36,
    titleColor: '#2c3e50',
    bodyFontSize: 16,
    bodyColor: '#34495e',
    accentColor: '#3498db',
    borderColor: '#3498db',
    borderWidth: 12,
  },
  classic: {
    name: 'classic',
    layout: 'landscape',
    pageSize: 'A4',
    backgroundColor: '#fffef0',
    title: 'Certificate of Achievement',
    titleFontSize: 44,
    titleColor: '#8b4513',
    bodyFontSize: 20,
    bodyColor: '#4a4a4a',
    accentColor: '#daa520',
    borderColor: '#daa520',
    borderWidth: 15,
  },
};

/**
 * Validate certificate template
 * @param {string} templateName - Template name to validate
 * @returns {boolean} True if template is valid
 */
const validateTemplate = (templateName) => {
  return CERTIFICATE_TEMPLATES[templateName] !== undefined;
};

/**
 * Get template configuration
 * @param {string} templateName - Template name
 * @returns {object} Template configuration
 */
const getTemplate = (templateName = 'default') => {
  return CERTIFICATE_TEMPLATES[templateName] || CERTIFICATE_TEMPLATES.default;
};

/**
 * Validate certificate data before generation
 * @param {object} data - Certificate data
 * @returns {object} Validation result with isValid and errors
 */
const validateCertificateData = (data) => {
  const errors = [];

  if (!data.recipientName || typeof data.recipientName !== 'string' || data.recipientName.trim().length === 0) {
    errors.push('Recipient name is required');
  }

  if (!data.courseName || typeof data.courseName !== 'string' || data.courseName.trim().length === 0) {
    errors.push('Course/program name is required');
  }

  if (!data.completionDate || !(data.completionDate instanceof Date)) {
    errors.push('Valid completion date is required');
  }

  if (!data.certificateNumber || typeof data.certificateNumber !== 'string') {
    errors.push('Certificate number is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate study plan completion
 * @param {object} plan - Study plan object
 * @returns {object} Validation result with isValid and errors
 */
const validatePlanCompletion = (plan) => {
  const errors = [];

  if (!plan) {
    errors.push('Study plan not found');
    return { isValid: false, errors };
  }

  // Check plan status
  if (plan.status !== 'completed') {
    // If status is not completed, check dailyGoals completion
    if (plan.dailyGoals && plan.dailyGoals.length > 0) {
      const totalGoals = plan.dailyGoals.length;
      const completedGoals = plan.dailyGoals.filter(g => g.completed).length;
      
      if (totalGoals !== completedGoals) {
        errors.push(`Study plan is incomplete: ${completedGoals}/${totalGoals} goals completed`);
      }
    } else {
      errors.push('Study plan is not marked as completed and has no goals to verify');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Draw certificate border
 * @param {object} doc - PDFDocument instance
 * @param {object} template - Template configuration
 */
const drawBorder = (doc, template) => {
  const { page } = doc;
  const margin = template.borderWidth / 2;
  
  doc.lineWidth(template.borderWidth);
  doc.strokeColor(template.borderColor);
  
  // Draw border rectangle
  doc.rect(margin, margin, page.width - (margin * 2), page.height - (margin * 2)).stroke();
  
  // Draw inner decorative line
  doc.lineWidth(2);
  doc.strokeColor(template.accentColor);
  const innerMargin = margin + 10;
  doc.rect(innerMargin, innerMargin, page.width - (innerMargin * 2), page.height - (innerMargin * 2)).stroke();
};

/**
 * Draw certificate header
 * @param {object} doc - PDFDocument instance
 * @param {object} template - Template configuration
 * @param {string} certificateNumber - Certificate number
 */
const drawHeader = (doc, template, certificateNumber) => {
  const { page } = doc;
  
  // Draw title
  doc.fontSize(template.titleFontSize);
  doc.fillColor(template.titleColor);
  doc.text(template.title, { align: 'center' });
  
  doc.moveDown(2);
  
  // Draw certificate number
  doc.fontSize(12);
  doc.fillColor(template.accentColor);
  doc.text(`Certificate No: ${certificateNumber}`, { align: 'right' });
  
  doc.moveDown();
};

/**
 * Draw certificate body
 * @param {object} doc - PDFDocument instance
 * @param {object} template - Template configuration
 * @param {object} data - Certificate data
 */
const drawBody = (doc, template, data) => {
  doc.fontSize(template.bodyFontSize);
  doc.fillColor(template.bodyColor);
  
  // Recipient line
  doc.text('This is to certify that', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(template.bodyFontSize + 8);
  doc.fillColor(template.titleColor);
  doc.text(data.recipientName, { align: 'center', underline: true });
  doc.moveDown();
  
  doc.fontSize(template.bodyFontSize);
  doc.fillColor(template.bodyColor);
  doc.text('has successfully completed the study plan', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(template.bodyFontSize + 4);
  doc.fillColor(template.accentColor);
  doc.text(data.courseName, { align: 'center' });
  doc.moveDown(2);
  
  // Completion date
  doc.fontSize(template.bodyFontSize);
  doc.fillColor(template.bodyColor);
  doc.text(`Completed on: ${data.completionDate.toLocaleDateString()}`, { align: 'center' });
};

/**
 * Draw certificate footer
 * @param {object} doc - PDFDocument instance
 * @param {object} template - Template configuration
 */
const drawFooter = (doc, template) => {
  const { page } = doc;
  const footerY = page.height - 80;
  
  doc.fontSize(10);
  doc.fillColor(template.bodyColor);
  
  // Left side - issue date
  doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 50, footerY, { width: 200 });
  
  // Right side - verification text
  doc.text('This certificate can be verified by the certificate number', page.width - 250, footerY, { width: 200, align: 'right' });
};

/**
 * Generate certificate PDF
 * @param {object} data - Certificate data
 * @param {string} templateName - Template name
 * @returns {Promise<Buffer>} PDF buffer
 */
const generateCertificatePDF = async (data, templateName = 'default') => {
  return new Promise((resolve, reject) => {
    try {
      const template = getTemplate(templateName);
      const chunks = [];
      
      const doc = new PDFDocument({
        layout: template.layout,
        size: template.pageSize,
        margin: 0,
      });
      
      // Collect PDF data
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      // Background
      doc.rect(0, 0, doc.page.width, doc.page.height).fill(template.backgroundColor);
      
      // Draw certificate elements
      drawBorder(doc, template);
      drawHeader(doc, template, data.certificateNumber);
      drawBody(doc, template, data);
      drawFooter(doc, template);
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Complete certificate generation process
 * @param {string} planId - Study plan ID
 * @param {string} userId - User ID
 * @param {string} templateName - Template name (optional)
 * @returns {Promise<object>} Certificate data with PDF buffer
 */
const generateCertificate = async (planId, userId, templateName = 'default') => {
  // Validate template
  if (!validateTemplate(templateName)) {
    throw new Error(`Unsupported certificate template: ${templateName}`);
  }
  
  // Fetch study plan with exam and user details
  const plan = await StudyPlan.findOne({
    where: { id: planId, user: userId },
    include: [
      {
        model: Exam,
        as: 'examRef',
      },
      {
        model: User,
        as: 'userRef',
      },
    ],
  });
  
  // Validate plan completion
  const completionValidation = validatePlanCompletion(plan);
  if (!completionValidation.isValid) {
    throw new Error(completionValidation.errors.join(', '));
  }
  
  // Get exam name for course name
  const courseName = plan.examDetails?.name || 'Study Plan';
  
  // Prepare certificate data
  const certificateData = {
    recipientName: plan.user?.name || 'Student',
    courseName: courseName,
    completionDate: plan.updatedAt || new Date(),
    certificateNumber: generateCertificateNumber(),
  };
  
  // Validate certificate data
  const dataValidation = validateCertificateData(certificateData);
  if (!dataValidation.isValid) {
    throw new Error(dataValidation.errors.join(', '));
  }
  
  // Generate PDF
  const pdfBuffer = await generateCertificatePDF(certificateData, templateName);
  
  return {
    certificateData,
    pdfBuffer,
    template: templateName,
  };
};

module.exports = {
  generateCertificate,
  generateCertificatePDF,
  generateCertificateNumber,
  validateTemplate,
  getTemplate,
  validateCertificateData,
  validatePlanCompletion,
  CERTIFICATE_TEMPLATES,
};