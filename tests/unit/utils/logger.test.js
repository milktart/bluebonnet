const path = require('path');
const fs = require('fs');
const winston = require('winston');

// Mock dependencies before requiring logger
jest.mock('fs');
jest.mock('winston');
jest.mock('winston-daily-rotate-file', () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
  }));
});

describe('Logger Utility', () => {
  let mockLogger;
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };

    // Mock Winston logger
    mockLogger = {
      add: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      stream: null,
    };

    winston.createLogger = jest.fn().mockReturnValue(mockLogger);
    winston.format = {
      combine: jest.fn((...args) => args),
      timestamp: jest.fn((opts) => `timestamp(${JSON.stringify(opts)})`),
      errors: jest.fn((opts) => `errors(${JSON.stringify(opts)})`),
      splat: jest.fn(() => 'splat()'),
      json: jest.fn(() => 'json()'),
      colorize: jest.fn(() => 'colorize()'),
      printf: jest.fn((fn) => `printf(${typeof fn})`),
    };

    winston.transports = {
      Console: jest.fn().mockImplementation(() => ({ type: 'Console' })),
    };

    // Mock fs
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.mkdirSync = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
  });

  describe('Logger Initialization', () => {
    it('should create logs directory if it does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      // Require logger to trigger initialization
      jest.isolateModules(() => {
        require('../../../utils/logger');
      });

      const expectedLogsDir = path.join(__dirname, '../../../logs');
      expect(fs.existsSync).toHaveBeenCalledWith(expectedLogsDir);
      expect(fs.mkdirSync).toHaveBeenCalledWith(expectedLogsDir, { recursive: true });
    });

    it('should not create logs directory if it already exists', () => {
      fs.existsSync.mockReturnValue(true);

      jest.isolateModules(() => {
        require('../../../utils/logger');
      });

      expect(fs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should create logger with default log level', () => {
      delete process.env.LOG_LEVEL;

      jest.isolateModules(() => {
        require('../../../utils/logger');
      });

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'info',
          defaultMeta: { service: 'travel-planner' },
        })
      );
    });

    it('should create logger with custom log level from environment', () => {
      process.env.LOG_LEVEL = 'debug';

      jest.isolateModules(() => {
        require('../../../utils/logger');
      });

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'debug',
        })
      );
    });

    it('should add console transport in development environment', () => {
      process.env.NODE_ENV = 'development';

      jest.isolateModules(() => {
        require('../../../utils/logger');
      });

      expect(mockLogger.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'Console',
        })
      );
    });

    it('should not add console transport in production environment', () => {
      process.env.NODE_ENV = 'production';

      jest.isolateModules(() => {
        require('../../../utils/logger');
      });

      expect(mockLogger.add).not.toHaveBeenCalled();
    });

    it('should create logger with correct transports', () => {
      jest.isolateModules(() => {
        require('../../../utils/logger');
      });

      expect(winston.createLogger).toHaveBeenCalledWith(
        expect.objectContaining({
          transports: expect.any(Array),
        })
      );

      const callArgs = winston.createLogger.mock.calls[0][0];
      expect(callArgs.transports).toHaveLength(2); // Error and combined logs
    });
  });

  describe('Logger Stream', () => {
    it('should have a stream object with write method', () => {
      jest.isolateModules(() => {
        const logger = require('../../../utils/logger');

        expect(logger.stream).toBeDefined();
        expect(typeof logger.stream.write).toBe('function');
      });
    });

    it('should write trimmed messages to logger.info', () => {
      jest.isolateModules(() => {
        const logger = require('../../../utils/logger');

        logger.stream.write('  Test message  \n');

        expect(mockLogger.info).toHaveBeenCalledWith('Test message');
      });
    });

    it('should handle messages without extra whitespace', () => {
      jest.isolateModules(() => {
        const logger = require('../../../utils/logger');

        logger.stream.write('Simple message');

        expect(mockLogger.info).toHaveBeenCalledWith('Simple message');
      });
    });
  });

  describe('Logger Methods', () => {
    it('should expose Winston logger methods', () => {
      jest.isolateModules(() => {
        const logger = require('../../../utils/logger');

        expect(typeof logger.info).toBe('function');
        expect(typeof logger.error).toBe('function');
        expect(typeof logger.warn).toBe('function');
        expect(typeof logger.debug).toBe('function');
      });
    });

    it('should call logger.info with message', () => {
      jest.isolateModules(() => {
        const logger = require('../../../utils/logger');

        logger.info('Info message');

        expect(mockLogger.info).toHaveBeenCalledWith('Info message');
      });
    });

    it('should call logger.error with message', () => {
      jest.isolateModules(() => {
        const logger = require('../../../utils/logger');

        logger.error('Error message');

        expect(mockLogger.error).toHaveBeenCalledWith('Error message');
      });
    });

    it('should call logger.warn with message', () => {
      jest.isolateModules(() => {
        const logger = require('../../../utils/logger');

        logger.warn('Warning message');

        expect(mockLogger.warn).toHaveBeenCalledWith('Warning message');
      });
    });

    it('should call logger.debug with message', () => {
      jest.isolateModules(() => {
        const logger = require('../../../utils/logger');

        logger.debug('Debug message');

        expect(mockLogger.debug).toHaveBeenCalledWith('Debug message');
      });
    });

    it('should call logger methods with metadata', () => {
      jest.isolateModules(() => {
        const logger = require('../../../utils/logger');

        const metadata = { userId: '123', action: 'login' };
        logger.info('User action', metadata);

        expect(mockLogger.info).toHaveBeenCalledWith('User action', metadata);
      });
    });
  });

  describe('Log Format', () => {
    it('should use JSON format for file transports', () => {
      jest.isolateModules(() => {
        require('../../../utils/logger');
      });

      expect(winston.format.json).toHaveBeenCalled();
    });

    it('should include timestamp in log format', () => {
      jest.isolateModules(() => {
        require('../../../utils/logger');
      });

      expect(winston.format.timestamp).toHaveBeenCalledWith({ format: 'YYYY-MM-DD HH:mm:ss' });
    });

    it('should include errors with stack traces', () => {
      jest.isolateModules(() => {
        require('../../../utils/logger');
      });

      expect(winston.format.errors).toHaveBeenCalledWith({ stack: true });
    });

    it('should use colorized format for console in development', () => {
      process.env.NODE_ENV = 'development';

      jest.isolateModules(() => {
        require('../../../utils/logger');
      });

      expect(winston.format.colorize).toHaveBeenCalled();
    });
  });
});
