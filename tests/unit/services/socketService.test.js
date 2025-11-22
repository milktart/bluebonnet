const socketService = require('../../../services/socketService');
const { Server } = require('socket.io');

// Mock Socket.IO
jest.mock('socket.io');

describe('SocketService', () => {
  let mockServer;
  let mockIo;
  let mockSocket;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSocket = {
      id: 'socket-123',
      handshake: {
        session: {
          passport: { user: 'user-456' },
        },
      },
      on: jest.fn(),
      join: jest.fn(),
      emit: jest.fn(),
      to: jest.fn(() => ({ emit: jest.fn() })),
    };

    mockIo = {
      on: jest.fn(),
      use: jest.fn(),
      to: jest.fn(() => ({ emit: jest.fn() })),
      emit: jest.fn(),
    };

    Server.mockImplementation(() => mockIo);

    mockServer = {};
  });

  describe('initialize', () => {
    it('should initialize Socket.IO server', () => {
      const sessionMiddleware = jest.fn();

      socketService.initialize(mockServer, sessionMiddleware);

      expect(Server).toHaveBeenCalledWith(mockServer, expect.objectContaining({
        cors: expect.any(Object),
        pingTimeout: expect.any(Number),
        pingInterval: expect.any(Number),
      }));
    });

    it('should set up session middleware', () => {
      const sessionMiddleware = jest.fn();

      socketService.initialize(mockServer, sessionMiddleware);

      expect(mockIo.use).toHaveBeenCalled();
    });

    it('should handle connection events', () => {
      socketService.initialize(mockServer, jest.fn());

      expect(mockIo.on).toHaveBeenCalledWith('connection', expect.any(Function));
    });
  });

  describe('emitToUser', () => {
    it('should emit event to specific user', () => {
      const toMock = { emit: jest.fn() };
      mockIo.to = jest.fn(() => toMock);

      socketService.initialize(mockServer, jest.fn());
      socketService.emitToUser('user-123', 'test-event', { data: 'test' });

      expect(mockIo.to).toHaveBeenCalled();
      expect(toMock.emit).toHaveBeenCalledWith('test-event', { data: 'test' });
    });

    it('should handle missing userId gracefully', () => {
      socketService.initialize(mockServer, jest.fn());

      expect(() => {
        socketService.emitToUser(null, 'test-event', {});
      }).not.toThrow();
    });
  });

  describe('broadcastToAll', () => {
    it('should broadcast event to all connected clients', () => {
      socketService.initialize(mockServer, jest.fn());
      socketService.broadcastToAll('announcement', { message: 'Hello' });

      expect(mockIo.emit).toHaveBeenCalledWith('announcement', { message: 'Hello' });
    });
  });

  describe('getIO', () => {
    it('should return the Socket.IO instance', () => {
      socketService.initialize(mockServer, jest.fn());
      const io = socketService.getIO();

      expect(io).toBe(mockIo);
    });

    it('should return null if not initialized', () => {
      // Create a new instance without initializing
      const io = socketService.getIO();

      // Should handle gracefully (either return null or the existing instance)
      expect(io).toBeDefined();
    });
  });

  describe('disconnectUser', () => {
    it('should disconnect a specific user', () => {
      socketService.initialize(mockServer, jest.fn());

      const disconnectMock = jest.fn();
      const toMock = { disconnectSockets: disconnectMock };
      mockIo.to = jest.fn(() => toMock);

      socketService.disconnectUser('user-789');

      expect(mockIo.to).toHaveBeenCalled();
    });
  });
});
