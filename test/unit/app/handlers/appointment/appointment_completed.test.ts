import { SQSEvent, Context } from 'aws-lambda';
import 'reflect-metadata';
import { IAppointmentCompletionService } from '../../../../../src/contexts/appointment/application/interfaces/IAppointmentCompletionService';
import Container, { TOKENS } from '../../../../../src/app/di/iocContainer';
import { handler } from '../../../../../src/app/handlers/appointment/appointment_completed';
 
// Mock del contenedor IoC 
jest.mock('../../../../../src/app/di/iocContainer', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  },
  TOKENS: {
    APPOINTMENT_COMPLETION_SERVICE: Symbol('APPOINTMENT_COMPLETION_SERVICE')
  }
}));

describe('appointment_completed.handler', () => {
  let mockCompletionService: jest.Mocked<IAppointmentCompletionService>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock del servicio
    mockCompletionService = {
      processEventBridgeConfirmation: jest.fn().mockResolvedValue(undefined)
    } as any;

    // Mock de Container.get
    (Container.get as jest.Mock).mockReturnValue(mockCompletionService);

    // Spy de console.log y console.error
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('Procesamiento exitoso', () => {
    it('debe procesar una confirmación de EventBridge correctamente', async () => {
      // Arrange
      const mockEventBridgeMessage = {
        version: '0',
        id: 'event-id-123',
        'detail-type': 'appointment.completed',
        source: 'custom.appointment',
        account: '123456789012',
        time: '2024-01-01T10:00:00Z',
        region: 'us-east-2',
        resources: [],
        detail: {
          appointmentId: 'APT-123',
          insuredId: 'INS-456',
          countryISO: 'CL',
          status: 'completed',
          completedAt: '2024-01-01T10:00:00Z'
        }
      };

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'sqs-message-id-1',
            receiptHandle: 'test-receipt-handle',
            body: JSON.stringify(mockEventBridgeMessage),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890000',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890000'
            },
            messageAttributes: {},
            md5OfBody: 'test-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:appointment-completed-queue',
            awsRegion: 'us-east-2'
          }
        ]
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(Container.get).toHaveBeenCalledWith(TOKENS.APPOINTMENT_COMPLETION_SERVICE);
      expect(mockCompletionService.processEventBridgeConfirmation).toHaveBeenCalledWith(mockEventBridgeMessage);
      expect(mockCompletionService.processEventBridgeConfirmation).toHaveBeenCalledTimes(1);
      
      // Verificar logs de éxito
      expect(consoleLogSpy).toHaveBeenCalledWith('===== INICIO PROCESAMIENTO DE CONFIRMACIONES =====');
      expect(consoleLogSpy).toHaveBeenCalledWith('Número de confirmaciones recibidas:', 1);
      expect(consoleLogSpy).toHaveBeenCalledWith('Procesando confirmación:', 'sqs-message-id-1');
      expect(consoleLogSpy).toHaveBeenCalledWith('Confirmación procesada exitosamente:', 'sqs-message-id-1');
      expect(consoleLogSpy).toHaveBeenCalledWith('===== FIN PROCESAMIENTO DE CONFIRMACIONES =====');
    });

    it('debe procesar múltiples confirmaciones de EventBridge', async () => {
      // Arrange
      const mockEventBridgeMessages = [
        {
          version: '0',
          id: 'event-1',
          'detail-type': 'appointment.completed',
          source: 'custom.appointment',
          account: '123456789012',
          time: '2024-01-01T10:00:00Z',
          region: 'us-east-2',
          resources: [],
          detail: {
            appointmentId: 'APT-123',
            status: 'completed'
          }
        },
        {
          version: '0',
          id: 'event-2',
          'detail-type': 'appointment.completed',
          source: 'custom.appointment',
          account: '123456789012',
          time: '2024-01-01T10:05:00Z',
          region: 'us-east-2',
          resources: [],
          detail: {
            appointmentId: 'APT-456',
            status: 'completed'
          }
        }
      ];

      const event: SQSEvent = {
        Records: mockEventBridgeMessages.map((msg, index) => ({
          messageId: `sqs-msg-${index + 1}`,
          receiptHandle: `receipt-${index + 1}`,
          body: JSON.stringify(msg),
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: `123456789000${index}`,
            SenderId: 'test-sender',
            ApproximateFirstReceiveTimestamp: `123456789000${index}`
          },
          messageAttributes: {},
          md5OfBody: `md5-${index + 1}`,
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:appointment-completed-queue',
          awsRegion: 'us-east-2'
        }))
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(mockCompletionService.processEventBridgeConfirmation).toHaveBeenCalledTimes(2);
      expect(mockCompletionService.processEventBridgeConfirmation).toHaveBeenNthCalledWith(1, mockEventBridgeMessages[0]);
      expect(mockCompletionService.processEventBridgeConfirmation).toHaveBeenNthCalledWith(2, mockEventBridgeMessages[1]);
      expect(consoleLogSpy).toHaveBeenCalledWith('Número de confirmaciones recibidas:', 2);
    });

    it('debe manejar un evento sin registros', async () => {
      // Arrange
      const event: SQSEvent = {
        Records: []
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(mockCompletionService.processEventBridgeConfirmation).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Número de confirmaciones recibidas:', 0);
      expect(consoleLogSpy).toHaveBeenCalledWith('===== INICIO PROCESAMIENTO DE CONFIRMACIONES =====');
      expect(consoleLogSpy).toHaveBeenCalledWith('===== FIN PROCESAMIENTO DE CONFIRMACIONES =====');
    });
  });

  describe('Manejo de errores', () => {
    it('debe continuar procesando cuando falla una confirmación individual', async () => {
      // Arrange
      const mockError = new Error('Error al procesar confirmación');
      mockCompletionService.processEventBridgeConfirmation
        .mockRejectedValueOnce(mockError)
        .mockResolvedValueOnce(undefined);

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'error-msg-1',
            receiptHandle: 'error-receipt',
            body: JSON.stringify({ 
              version: '0',
              id: 'event-1', 
              'detail-type': 'appointment.completed',
              source: 'custom.appointment',
              account: '123456789012',
              time: '2024-01-01T10:00:00Z',
              region: 'us-east-2',
              resources: [],
              detail: { appointmentId: 'APT-123' } 
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890000',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890000'
            },
            messageAttributes: {},
            md5OfBody: 'error-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:appointment-completed-queue',
            awsRegion: 'us-east-2'
          },
          {
            messageId: 'success-msg-2',
            receiptHandle: 'success-receipt',
            body: JSON.stringify({ 
              version: '0',
              id: 'event-2',
              'detail-type': 'appointment.completed',
              source: 'custom.appointment',
              account: '123456789012',
              time: '2024-01-01T10:00:00Z',
              region: 'us-east-2',
              resources: [],
              detail: { appointmentId: 'APT-456' } 
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890001',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890001'
            },
            messageAttributes: {},
            md5OfBody: 'success-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:appointment-completed-queue',
            awsRegion: 'us-east-2'
          }
        ]
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(mockCompletionService.processEventBridgeConfirmation).toHaveBeenCalledTimes(2);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error procesando confirmación individual:',
        expect.objectContaining({
          messageId: 'error-msg-1',
          error: 'Error al procesar confirmación',
          body: expect.any(String)
        })
      );
      // Verificar que el segundo mensaje sí se procesó
      expect(consoleLogSpy).toHaveBeenCalledWith('Confirmación procesada exitosamente:', 'success-msg-2');
      expect(consoleLogSpy).toHaveBeenCalledWith('===== FIN PROCESAMIENTO DE CONFIRMACIONES =====');
    });

    it('debe manejar error cuando falla el parseo del body', async () => {
      // Arrange
      const event: SQSEvent = {
        Records: [
          {
            messageId: 'invalid-json-msg',
            receiptHandle: 'invalid-receipt',
            body: 'invalid-json-{',
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890000',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890000'
            },
            messageAttributes: {},
            md5OfBody: 'invalid-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:appointment-completed-queue',
            awsRegion: 'us-east-2'
          }
        ]
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(mockCompletionService.processEventBridgeConfirmation).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error procesando confirmación individual:',
        expect.objectContaining({
          messageId: 'invalid-json-msg',
          error: expect.any(String),
          body: 'invalid-json-{'
        })
      );
      // El handler no debe lanzar error, debe continuar
      expect(consoleLogSpy).toHaveBeenCalledWith('===== FIN PROCESAMIENTO DE CONFIRMACIONES =====');
    });

    it('debe lanzar error cuando falla Container.get', async () => {
      // Arrange
      const mockError = new Error('No se pudo obtener el servicio');
      (Container.get as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      const event: SQSEvent = {
        Records: [{
          messageId: 'msg-1',
          receiptHandle: 'receipt-1',
          body: JSON.stringify({ 
            version: '0',
            id: 'event-1',
            'detail-type': 'appointment.completed',
            source: 'custom.appointment',
            account: '123456789012',
            time: '2024-01-01T10:00:00Z',
            region: 'us-east-2',
            resources: [],
            detail: {}
          }),
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1234567890000',
            SenderId: 'test-sender',
            ApproximateFirstReceiveTimestamp: '1234567890000'
          },
          messageAttributes: {},
          md5OfBody: 'md5-1',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:appointment-completed-queue',
          awsRegion: 'us-east-2'
        }]
      };

      // Act & Assert
      await expect(handler(event, {} as Context, () => {})).rejects.toThrow(mockError);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error general al procesar confirmaciones:', mockError);
      expect(consoleLogSpy).toHaveBeenCalledWith('===== ERROR EN PROCESAMIENTO DE CONFIRMACIONES =====');
    });

    it('debe manejar error desconocido en confirmación individual', async () => {
      // Arrange
      // Simular un error que no es instancia de Error
      mockCompletionService.processEventBridgeConfirmation.mockRejectedValueOnce('String error');

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'unknown-error-msg',
            receiptHandle: 'unknown-receipt',
            body: JSON.stringify({ 
              version: '0',
              id: 'event-1',
              'detail-type': 'appointment.completed',
              source: 'custom.appointment',
              account: '123456789012',
              time: '2024-01-01T10:00:00Z',
              region: 'us-east-2',
              resources: [],
              detail: { appointmentId: 'APT-123' } 
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890000',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890000'
            },
            messageAttributes: {},
            md5OfBody: 'unknown-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:appointment-completed-queue',
            awsRegion: 'us-east-2'
          }
        ]
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error procesando confirmación individual:',
        expect.objectContaining({
          messageId: 'unknown-error-msg',
          error: 'Error desconocido',
          body: expect.any(String)
        })
      );
    });
  });

  describe('Características específicas', () => {
    it('debe procesar correctamente un mensaje de EventBridge con estructura completa', async () => {
      // Arrange
      const fullEventBridgeMessage = {
        version: '0',
        id: '6f6a2b45-1234-5678-9abc-def012345678',
        'detail-type': 'appointment.completed',
        source: 'custom.appointment',
        account: '123456789012',
        time: '2024-01-01T15:30:00Z',
        region: 'us-east-2',
        resources: [
          'arn:aws:dynamodb:us-east-2:123456789012:table/Appointments'
        ],
        detail: {
          appointmentId: 'APT-789',
          insuredId: 'INS-101',
          countryISO: 'PE',
          status: 'completed',
          completedAt: '2024-01-01T15:30:00Z',
          metadata: {
            processedBy: 'appointment_pe_handler',
            processingTime: 1500
          }
        }
      };

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'full-event-msg',
            receiptHandle: 'full-receipt',
            body: JSON.stringify(fullEventBridgeMessage),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890000',
              SenderId: 'events.amazonaws.com',
              ApproximateFirstReceiveTimestamp: '1234567890000'
            },
            messageAttributes: {},
            md5OfBody: 'full-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:appointment-completed-queue',
            awsRegion: 'us-east-2'
          }
        ]
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(mockCompletionService.processEventBridgeConfirmation).toHaveBeenCalledWith(fullEventBridgeMessage);
      expect(consoleLogSpy).toHaveBeenCalledWith('Confirmación procesada exitosamente:', 'full-event-msg');
    });

    it('debe usar el token correcto para el servicio de completion', async () => {
      // Arrange
      const event: SQSEvent = {
        Records: [{
          messageId: 'completion-specific-msg',
          receiptHandle: 'completion-receipt',
          body: JSON.stringify({
            version: '0',
            id: 'completion-msg',
            'detail-type': 'appointment.completed',
            source: 'custom.appointment',
            account: '123456789012',
            time: '2024-01-01T10:00:00Z',
            region: 'us-east-2',
            resources: [],
            detail: {
              appointmentId: 'APT-COMPLETION-123',
              status: 'completed'
            }
          }),
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1234567890000',
            SenderId: 'test-sender',
            ApproximateFirstReceiveTimestamp: '1234567890000'
          },
          messageAttributes: {},
          md5OfBody: 'completion-md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:appointment-completed-queue-v001-dev',
          awsRegion: 'us-east-2'
        }]
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(Container.get).toHaveBeenCalledWith(TOKENS.APPOINTMENT_COMPLETION_SERVICE);
      expect(Container.get).toHaveBeenCalledTimes(1);
    });
  });
});