const certificateService = require('../../services/certificateService');
const StudyPlan = require('../../models/StudyPlan');
const Exam = require('../../models/Exam');
const User = require('../../models/User');

describe('certificateService', () => {
  describe('generateCertificateNumber', () => {
    it('should generate certificate number in correct format', () => {
      const certNumber = certificateService.generateCertificateNumber();
      expect(certNumber).toMatch(/^CERT-\d{4}-[A-F0-9]{8}$/);
    });

    it('should generate unique certificate numbers', () => {
      const certNumber1 = certificateService.generateCertificateNumber();
      const certNumber2 = certificateService.generateCertificateNumber();
      expect(certNumber1).not.toBe(certNumber2);
    });

    it('should include current year in certificate number', () => {
      const currentYear = new Date().getFullYear();
      const certNumber = certificateService.generateCertificateNumber();
      expect(certNumber).toContain(`CERT-${currentYear}-`);
    });
  });

  describe('validateTemplate', () => {
    it('should validate default template', () => {
      expect(certificateService.validateTemplate('default')).toBe(true);
    });

    it('should validate modern template', () => {
      expect(certificateService.validateTemplate('modern')).toBe(true);
    });

    it('should validate classic template', () => {
      expect(certificateService.validateTemplate('classic')).toBe(true);
    });

    it('should reject invalid template', () => {
      expect(certificateService.validateTemplate('invalid')).toBe(false);
    });
  });

  describe('getTemplate', () => {
    it('should return default template when no name provided', () => {
      const template = certificateService.getTemplate();
      expect(template.name).toBe('default');
    });

    it('should return requested template', () => {
      const template = certificateService.getTemplate('modern');
      expect(template.name).toBe('modern');
    });

    it('should return default template for invalid name', () => {
      const template = certificateService.getTemplate('invalid');
      expect(template.name).toBe('default');
    });
  });

  describe('validateCertificateData', () => {
    it('should validate complete certificate data', () => {
      const data = {
        recipientName: 'John Doe',
        courseName: 'Advanced Mathematics',
        completionDate: new Date(),
        certificateNumber: 'CERT-2024-ABC12345'
      };
      const result = certificateService.validateCertificateData(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing recipient name', () => {
      const data = {
        courseName: 'Advanced Mathematics',
        completionDate: new Date(),
        certificateNumber: 'CERT-2024-ABC12345'
      };
      const result = certificateService.validateCertificateData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Recipient name is required');
    });

    it('should reject empty recipient name', () => {
      const data = {
        recipientName: '   ',
        courseName: 'Advanced Mathematics',
        completionDate: new Date(),
        certificateNumber: 'CERT-2024-ABC12345'
      };
      const result = certificateService.validateCertificateData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Recipient name is required');
    });

    it('should reject missing course name', () => {
      const data = {
        recipientName: 'John Doe',
        completionDate: new Date(),
        certificateNumber: 'CERT-2024-ABC12345'
      };
      const result = certificateService.validateCertificateData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Course/program name is required');
    });

    it('should reject missing completion date', () => {
      const data = {
        recipientName: 'John Doe',
        courseName: 'Advanced Mathematics',
        certificateNumber: 'CERT-2024-ABC12345'
      };
      const result = certificateService.validateCertificateData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid completion date is required');
    });

    it('should reject invalid completion date', () => {
      const data = {
        recipientName: 'John Doe',
        courseName: 'Advanced Mathematics',
        completionDate: 'invalid-date',
        certificateNumber: 'CERT-2024-ABC12345'
      };
      const result = certificateService.validateCertificateData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid completion date is required');
    });

    it('should reject missing certificate number', () => {
      const data = {
        recipientName: 'John Doe',
        courseName: 'Advanced Mathematics',
        completionDate: new Date()
      };
      const result = certificateService.validateCertificateData(data);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Certificate number is required');
    });
  });

  describe('validatePlanCompletion', () => {
    it('should validate completed study plan', () => {
      const plan = {
        status: 'completed',
        dailyGoals: []
      };
      const result = certificateService.validatePlanCompletion(plan);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate plan with all goals completed', () => {
      const plan = {
        status: 'active',
        dailyGoals: [
          { completed: true },
          { completed: true },
          { completed: true }
        ]
      };
      const result = certificateService.validatePlanCompletion(plan);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject incomplete plan with missing goals', () => {
      const plan = {
        status: 'active',
        dailyGoals: [
          { completed: true },
          { completed: false },
          { completed: true }
        ]
      };
      const result = certificateService.validatePlanCompletion(plan);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Study plan is incomplete: 2/3 goals completed');
    });

    it('should reject plan with no goals and not completed', () => {
      const plan = {
        status: 'active',
        dailyGoals: []
      };
      const result = certificateService.validatePlanCompletion(plan);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Study plan is not marked as completed and has no goals to verify');
    });

    it('should reject null plan', () => {
      const result = certificateService.validatePlanCompletion(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Study plan not found');
    });
  });

  describe('generateCertificatePDF', () => {
    it('should generate PDF with default template', async () => {
      const data = {
        recipientName: 'John Doe',
        courseName: 'Advanced Mathematics',
        completionDate: new Date(),
        certificateNumber: 'CERT-2024-ABC12345'
      };
      
      const pdfBuffer = await certificateService.generateCertificatePDF(data, 'default');
      
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should generate PDF with modern template', async () => {
      const data = {
        recipientName: 'Jane Smith',
        courseName: 'Physics Fundamentals',
        completionDate: new Date(),
        certificateNumber: 'CERT-2024-DEF67890'
      };
      
      const pdfBuffer = await certificateService.generateCertificatePDF(data, 'modern');
      
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    it('should generate PDF with classic template', async () => {
      const data = {
        recipientName: 'Bob Johnson',
        courseName: 'Chemistry 101',
        completionDate: new Date(),
        certificateNumber: 'CERT-2024-GHI13579'
      };
      
      const pdfBuffer = await certificateService.generateCertificatePDF(data, 'classic');
      
      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });
  });

  describe('generateCertificate (integration)', () => {
    beforeEach(() => {
      vi.spyOn(StudyPlan, 'findOne').mockClear();
    });

    it('should generate certificate for completed study plan', async () => {
      const mockPlan = {
        id: 'plan-123',
        user: 'user-123',
        status: 'completed',
        updatedAt: new Date(),
        examRef: {
          name: 'Mathematics Final Exam'
        },
        userRef: {
          name: 'John Doe'
        }
      };

      StudyPlan.findOne.mockResolvedValue(mockPlan);

      const result = await certificateService.generateCertificate('plan-123', 'user-123', 'default');

      expect(result).toHaveProperty('certificateData');
      expect(result).toHaveProperty('pdfBuffer');
      expect(result).toHaveProperty('template');
      expect(result.certificateData.certificateNumber).toMatch(/^CERT-\d{4}-[A-F0-9]{8}$/);
      expect(Buffer.isBuffer(result.pdfBuffer)).toBe(true);
    });

    it('should throw error for unsupported template', async () => {
      await expect(
        certificateService.generateCertificate('plan-123', 'user-123', 'invalid-template')
      ).rejects.toThrow('Unsupported certificate template: invalid-template');
    });

    it('should throw error for incomplete study plan', async () => {
      const mockPlan = {
        id: 'plan-123',
        user: 'user-123',
        status: 'active',
        dailyGoals: [
          { completed: true },
          { completed: false }
        ],
        examRef: {
          name: 'Mathematics Final Exam'
        },
        userRef: {
          name: 'John Doe'
        }
      };

      StudyPlan.findOne.mockResolvedValue(mockPlan);

      await expect(
        certificateService.generateCertificate('plan-123', 'user-123', 'default')
      ).rejects.toThrow('Study plan is incomplete');
    });

    it('should throw error for non-existent study plan', async () => {
      StudyPlan.findOne.mockResolvedValue(null);

      await expect(
        certificateService.generateCertificate('plan-123', 'user-123', 'default')
      ).rejects.toThrow('Study plan not found');
    });

    it('should handle missing exam details gracefully', async () => {
      const mockPlan = {
        id: 'plan-123',
        user: 'user-123',
        status: 'completed',
        updatedAt: new Date(),
        examRef: null,
        userRef: {
          name: 'John Doe'
        }
      };

      StudyPlan.findOne.mockResolvedValue(mockPlan);

      const result = await certificateService.generateCertificate('plan-123', 'user-123', 'default');

      expect(result.certificateData.courseName).toBe('Study Plan');
    });

    it('should handle missing user details gracefully', async () => {
      const mockPlan = {
        id: 'plan-123',
        user: 'user-123',
        status: 'completed',
        updatedAt: new Date(),
        examRef: {
          name: 'Mathematics Final Exam'
        },
        userRef: null
      };

      StudyPlan.findOne.mockResolvedValue(mockPlan);

      const result = await certificateService.generateCertificate('plan-123', 'user-123', 'default');

      expect(result.certificateData.recipientName).toBe('Student');
    });
  });

  describe('CERTIFICATE_TEMPLATES', () => {
    it('should have default template defined', () => {
      expect(certificateService.CERTIFICATE_TEMPLATES).toHaveProperty('default');
      expect(certificateService.CERTIFICATE_TEMPLATES.default.name).toBe('default');
    });

    it('should have modern template defined', () => {
      expect(certificateService.CERTIFICATE_TEMPLATES).toHaveProperty('modern');
      expect(certificateService.CERTIFICATE_TEMPLATES.modern.name).toBe('modern');
    });

    it('should have classic template defined', () => {
      expect(certificateService.CERTIFICATE_TEMPLATES).toHaveProperty('classic');
      expect(certificateService.CERTIFICATE_TEMPLATES.classic.name).toBe('classic');
    });

    it('should have required template properties', () => {
      const template = certificateService.CERTIFICATE_TEMPLATES.default;
      expect(template).toHaveProperty('layout');
      expect(template).toHaveProperty('pageSize');
      expect(template).toHaveProperty('backgroundColor');
      expect(template).toHaveProperty('title');
      expect(template).toHaveProperty('titleFontSize');
      expect(template).toHaveProperty('titleColor');
      expect(template).toHaveProperty('bodyFontSize');
      expect(template).toHaveProperty('bodyColor');
      expect(template).toHaveProperty('accentColor');
      expect(template).toHaveProperty('borderColor');
      expect(template).toHaveProperty('borderWidth');
    });
  });
});