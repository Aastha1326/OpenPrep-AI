const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.1.0',
    info: {
      title: 'OpenPrep AI Backend API',
      version: '1.0.0',
      description: 'API documentation for OpenPrep AI - AI-powered exam preparation platform',
      contact: {
        name: 'OpenPrep AI Team',
        url: 'https://github.com/nishit546/OpenPrep-AI',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.openprep.ai',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description:
            'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'refreshToken',
          description: 'Refresh token stored in httpOnly cookie',
        },
        csrfToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-csrf-token',
          description: 'CSRF token for state-changing operations',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'string',
              example: 'Error message',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            studyHours: {
              type: 'number',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Exam: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            date: {
              type: 'string',
              format: 'date',
            },
            user: {
              type: 'string',
              format: 'uuid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Subject: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            exam: {
              type: 'string',
              format: 'uuid',
            },
            user: {
              type: 'string',
              format: 'uuid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Topic: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            subject: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              type: 'string',
              enum: ['Weak', 'Medium', 'Strong'],
            },
            weightage: {
              type: 'number',
            },
            user: {
              type: 'string',
              format: 'uuid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Quiz: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            subject: {
              type: 'string',
              format: 'uuid',
            },
            topic: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            questions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: {
                    type: 'string',
                  },
                  questionText: {
                    type: 'string',
                  },
                  options: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  correctAnswer: {
                    type: 'integer',
                    minimum: 0,
                    maximum: 3,
                  },
                  explanation: {
                    type: 'string',
                  },
                },
              },
            },
            type: {
              type: 'string',
              enum: ['AI_Generated', 'Manual'],
            },
            createdBy: {
              type: 'string',
              format: 'uuid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        QuizAttempt: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            user: {
              type: 'string',
              format: 'uuid',
            },
            quiz: {
              type: 'string',
              format: 'uuid',
            },
            score: {
              type: 'number',
            },
            totalQuestions: {
              type: 'integer',
            },
            answers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  questionId: {
                    type: 'string',
                  },
                  selectedAnswer: {
                    type: 'integer',
                  },
                  isCorrect: {
                    type: 'boolean',
                  },
                },
              },
            },
            timeSpent: {
              type: 'integer',
            },
            weakTopics: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uuid',
              },
            },
            strongTopics: {
              type: 'array',
              items: {
                type: 'string',
                format: 'uuid',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Note: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            title: {
              type: 'string',
              example: 'Calculus Chapter 1 Notes',
            },
            content: {
              type: 'string',
              nullable: true,
              example: 'Derivatives and rates of change...',
            },
            subject: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174001',
            },
            topic: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              example: '123e4567-e89b-12d3-a456-426614174002',
            },
            fileUrl: {
              type: 'string',
              nullable: true,
              example: '/uploads/notes-12345.pdf',
            },
            fileType: {
              type: 'string',
              enum: ['text', 'pdf', 'image', 'docx', 'audio'],
              example: 'pdf',
            },
            isPublic: {
              type: 'boolean',
              example: false,
            },
            category: {
              type: 'string',
              enum: ['Lecture Notes', 'Study Guide', 'Cheat Sheet', 'Summary', 'Other'],
              example: 'Lecture Notes',
            },
            downloadsCount: {
              type: 'integer',
              example: 5,
            },
            user: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174003',
            },
            aiSummary: {
              type: 'object',
              nullable: true,
              properties: {
                summary: {
                  type: 'string',
                  example: 'Key lecture summary points...',
                },
                keyConcepts: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
                examTips: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                },
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Flashcard: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000',
            },
            front: {
              type: 'string',
              example: 'What is the derivative of sin(x)?',
            },
            back: {
              type: 'string',
              example: 'cos(x)',
            },
            subject: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174001',
            },
            topic: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              example: '123e4567-e89b-12d3-a456-426614174002',
            },
            interval: {
              type: 'integer',
              example: 1,
              description: 'SM-2 interval in days',
            },
            repetitions: {
              type: 'integer',
              example: 0,
              description: 'Number of consecutive successful reviews',
            },
            efactor: {
              type: 'number',
              example: 2.5,
              description: 'SM-2 easiness factor',
            },
            nextReviewDate: {
              type: 'string',
              format: 'date-time',
            },
            user: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174003',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        PYQ: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            subjectId: {
              type: 'string',
              format: 'uuid',
            },
            year: {
              type: 'integer',
            },
            fileUrl: {
              type: 'string',
            },
            user: {
              type: 'string',
              format: 'uuid',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        PYQAnalysis: {
          type: 'object',
          properties: {
            chapterWeightage: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  chapter: {
                    type: 'string',
                  },
                  weightage: {
                    type: 'number',
                  },
                },
              },
            },
            importantTopics: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  topic: {
                    type: 'string',
                  },
                  importance: {
                    type: 'string',
                    enum: ['High', 'Medium', 'Low'],
                  },
                },
              },
            },
            repeatedQuestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: {
                    type: 'string',
                  },
                  years: {
                    type: 'array',
                    items: {
                      type: 'integer',
                    },
                  },
                },
              },
            },
            trendAnalysis: {
              type: 'string',
            },
          },
        },
        StudyPlan: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            exam: {
              type: 'string',
              format: 'uuid',
            },
            user: {
              type: 'string',
              format: 'uuid',
            },
            startDate: {
              type: 'string',
              format: 'date',
            },
            endDate: {
              type: 'string',
              format: 'date',
            },
            dailyGoals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  date: {
                    type: 'string',
                    format: 'date',
                  },
                  tasks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: {
                          type: 'string',
                        },
                        subject: {
                          type: 'string',
                        },
                        topic: {
                          type: 'string',
                        },
                        task: {
                          type: 'string',
                        },
                        duration: {
                          type: 'integer',
                        },
                        completed: {
                          type: 'boolean',
                        },
                      },
                    },
                  },
                },
              },
            },
            status: {
              type: 'string',
              enum: ['active', 'completed', 'archived'],
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Progress: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            user: {
              type: 'string',
              format: 'uuid',
            },
            subject: {
              type: 'string',
              format: 'uuid',
            },
            topic: {
              type: 'string',
              format: 'uuid',
              nullable: true,
            },
            completionPercentage: {
              type: 'number',
            },
            studyHours: {
              type: 'number',
            },
            quizScores: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  attempt: {
                    type: 'string',
                    format: 'uuid',
                  },
                  score: {
                    type: 'number',
                  },
                  date: {
                    type: 'string',
                    format: 'date-time',
                  },
                },
              },
            },
            flashcardsMastered: {
              type: 'integer',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Feedback: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            user: {
              type: 'string',
              format: 'uuid',
            },
            title: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            category: {
              type: 'string',
              enum: ['Feature', 'Bug', 'Improvement', 'Other'],
            },
            status: {
              type: 'string',
              enum: ['Open', 'In Progress', 'Done', 'Rejected'],
            },
            upvotes: {
              type: 'integer',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: {
              type: 'string',
            },
            refreshToken: {
              type: 'string',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            count: {
              type: 'integer',
            },
            total: {
              type: 'integer',
            },
            page: {
              type: 'integer',
            },
            totalPages: {
              type: 'integer',
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Academic',
        description: 'Exam, Subject, and Topic management',
      },
      {
        name: 'Quizzes',
        description: 'Quiz generation, retrieval, and attempt submission',
      },
      {
        name: 'Study Plans',
        description: 'AI-generated and manual study plan management',
      },
      {
        name: 'Flashcards',
        description: 'Flashcard generation, CRUD, and review',
      },
      {
        name: 'Notes',
        description: 'Note upload, retrieval, and summarization',
      },
      {
        name: 'Progress',
        description: 'Dashboard stats, study tracking, and progress analytics',
      },
      {
        name: 'PYQs',
        description: 'Previous Year Question papers upload and analysis',
      },
      {
        name: 'Community',
        description: 'Feedback and roadmap endpoints',
      },
      {
        name: 'Analytics',
        description: 'Study analytics and activity insights',
      },
    ],
  },
  apis: ['./routes/*.js', './controllers/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
