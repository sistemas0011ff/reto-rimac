import { SQSEvent, Context } from 'aws-lambda';
import 'reflect-metadata';
import { handler } from '../../../../../src/app/handlers/appointment/appointment_cl';
import Container, { TOKENS } from '../../../../../src/app/di/iocContainer';
import { ICountryAppointmentService } from '../../../../../src/contexts/appointment/application/interfaces/ICountryAppointmentService';
import { SNSMessageBody } from '../../../../../src/contexts/appointment/domain/types/AppointmentTypes';

// Mock del contenedor IoC
jest.mock('../../../../../src/app/di/iocContainer', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  },
  TOKENS: {
    CHILE_APPOINTMENT_SERVICE: Symbol('CHILE_APPOINTMENT_SERVICE')
  }
}));

describe('appointment_cl.handler', () => {
  let mockAppointmentService: jest.Mocked<ICountryAppointmentService>;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Mock del servicio
    mockAppointmentService = {
      processMessage: jest.fn().mockResolvedValue(undefined)
    } as any;

    // Mock de Container.get
    (Container.get as jest.Mock).mockReturnValue(mockAppointmentService);

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
    it('debe procesar un mensaje de SQS correctamente', async () => {
      // Arrange
      const mockSNSMessage: SNSMessageBody = {
        Type: 'Notification',
        MessageId: 'test-message-id',
        TopicArn: 'arn:aws:sns:us-east-2:123456789:test-topic',
        Subject: 'Test Subject',
        Message: JSON.stringify({
          appointmentId: '123',
          insuredId: 'INS-456',
          countryISO: 'CL'
        }),
        Timestamp: '2024-01-01T10:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'test-signature',
        SigningCertURL: 'https://test.com/cert',
        UnsubscribeURL: 'https://test.com/unsubscribe'
      };

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'sqs-message-id-1',
            receiptHandle: 'test-receipt-handle',
            body: JSON.stringify(mockSNSMessage),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890000',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890000'
            },
            messageAttributes: {},
            md5OfBody: 'test-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:test-queue',
            awsRegion: 'us-east-2'
          }
        ]
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(Container.get).toHaveBeenCalledWith(TOKENS.CHILE_APPOINTMENT_SERVICE);
      expect(mockAppointmentService.processMessage).toHaveBeenCalledWith(mockSNSMessage);
      expect(mockAppointmentService.processMessage).toHaveBeenCalledTimes(1);
      
      // Verificar logs
      expect(consoleLogSpy).toHaveBeenCalledWith('===== INICIO PROCESAMIENTO DE CITAS CHILE =====');
      expect(consoleLogSpy).toHaveBeenCalledWith('Número de registros recibidos:', 1);
      expect(consoleLogSpy).toHaveBeenCalledWith('Procesando registro:', 'sqs-message-id-1');
      expect(consoleLogSpy).toHaveBeenCalledWith('===== FIN PROCESAMIENTO DE CITAS CHILE =====');
    });

    it('debe procesar múltiples mensajes de SQS', async () => {
      // Arrange
      const mockSNSMessages: SNSMessageBody[] = [
        {
          Type: 'Notification',
          MessageId: 'msg-1',
          Message: JSON.stringify({ appointmentId: '123' }),
          TopicArn: 'test-topic',
          Subject: 'Test',
          Timestamp: '2024-01-01T10:00:00.000Z',
          SignatureVersion: '1',
          Signature: 'sig-1',
          SigningCertURL: 'https://test.com',
          UnsubscribeURL: 'https://test.com'
        },
        {
          Type: 'Notification',
          MessageId: 'msg-2',
          Message: JSON.stringify({ appointmentId: '456' }),
          TopicArn: 'test-topic',
          Subject: 'Test',
          Timestamp: '2024-01-01T10:00:00.000Z',
          SignatureVersion: '1',
          Signature: 'sig-2',
          SigningCertURL: 'https://test.com',
          UnsubscribeURL: 'https://test.com'
        }
      ];

      const event: SQSEvent = {
        Records: mockSNSMessages.map((msg, index) => ({
          messageId: `sqs-msg-${index + 1}`,
          receiptHandle: `receipt-${index + 1}`,
          body: JSON.stringify(msg),
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1234567890000',
            SenderId: 'test-sender',
            ApproximateFirstReceiveTimestamp: '1234567890000'
          },
          messageAttributes: {},
          md5OfBody: `md5-${index + 1}`,
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:test-queue',
          awsRegion: 'us-east-2'
        }))
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(mockAppointmentService.processMessage).toHaveBeenCalledTimes(2);
      expect(mockAppointmentService.processMessage).toHaveBeenNthCalledWith(1, mockSNSMessages[0]);
      expect(mockAppointmentService.processMessage).toHaveBeenNthCalledWith(2, mockSNSMessages[1]);
      expect(consoleLogSpy).toHaveBeenCalledWith('Número de registros recibidos:', 2);
    });

    it('debe manejar un evento sin registros', async () => {
      // Arrange
      const event: SQSEvent = {
        Records: []
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(mockAppointmentService.processMessage).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Número de registros recibidos:', 0);
    });
  });

  describe('Manejo de errores', () => {
    it('debe lanzar error cuando falla el parseo del body', async () => {
      // Arrange
      const event: SQSEvent = {
        Records: [
          {
            messageId: 'error-msg-1',
            receiptHandle: 'error-receipt',
            body: 'invalid-json',
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890000',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890000'
            },
            messageAttributes: {},
            md5OfBody: 'error-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:test-queue',
            awsRegion: 'us-east-2'
          }
        ]
      };

      // Act & Assert
      await expect(handler(event, {} as Context, () => {})).rejects.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al procesar mensaje de SQS:',
        expect.any(Error)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('===== ERROR EN PROCESAMIENTO DE CITAS CHILE =====');
    });

    it('debe lanzar error cuando falla el servicio de procesamiento', async () => {
      // Arrange
      const mockError = new Error('Error al procesar cita');
      mockAppointmentService.processMessage.mockRejectedValue(mockError);

      const mockSNSMessage: SNSMessageBody = {
        Type: 'Notification',
        MessageId: 'test-message-id',
        TopicArn: 'test-topic',
        Subject: 'Test',
        Message: JSON.stringify({ appointmentId: '123' }),
        Timestamp: '2024-01-01T10:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'test-sig',
        SigningCertURL: 'https://test.com',
        UnsubscribeURL: 'https://test.com'
      };

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'sqs-msg-1',
            receiptHandle: 'receipt-1',
            body: JSON.stringify(mockSNSMessage),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890000',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890000'
            },
            messageAttributes: {},
            md5OfBody: 'md5-1',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:test-queue',
            awsRegion: 'us-east-2'
          }
        ]
      };

      // Act & Assert
      await expect(handler(event, {} as Context, () => {})).rejects.toThrow(mockError);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error al procesar mensaje de SQS:', mockError);
      expect(consoleLogSpy).toHaveBeenCalledWith('===== ERROR EN PROCESAMIENTO DE CITAS CHILE =====');
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
          body: JSON.stringify({}),
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1234567890000',
            SenderId: 'test-sender',
            ApproximateFirstReceiveTimestamp: '1234567890000'
          },
          messageAttributes: {},
          md5OfBody: 'md5-1',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:test-queue',
          awsRegion: 'us-east-2'
        }]
      };

      // Act & Assert
      await expect(handler(event, {} as Context, () => {})).rejects.toThrow(mockError);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error al procesar mensaje de SQS:', mockError);
    });
  });

  describe('Logging', () => {
    it('debe registrar los detalles del mensaje recibido', async () => {
      // Arrange
      const mockSNSMessage: SNSMessageBody = {
        Type: 'Notification',
        MessageId: 'sns-msg-123',
        TopicArn: 'test-topic',
        Subject: 'Test',
        Message: JSON.stringify({ appointmentId: '789' }),
        Timestamp: '2024-01-01T10:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'test-sig',
        SigningCertURL: 'https://test.com',
        UnsubscribeURL: 'https://test.com'
      };

      const event: SQSEvent = {
        Records: [{
          messageId: 'sqs-msg-456',
          receiptHandle: 'receipt-456',
          body: JSON.stringify(mockSNSMessage),
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1234567890000',
            SenderId: 'test-sender',
            ApproximateFirstReceiveTimestamp: '1234567890000'
          },
          messageAttributes: {},
          md5OfBody: 'md5-456',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:test-queue',
          awsRegion: 'us-east-2'
        }]
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Recibido mensaje de la cola SQS Chile:',
        {
          messageId: 'sqs-msg-456',
          messageType: 'Notification'
        }
      );
    });
  });
});