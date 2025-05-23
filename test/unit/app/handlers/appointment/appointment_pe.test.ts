import { SQSEvent, Context } from 'aws-lambda';
import 'reflect-metadata';
import { ICountryAppointmentService } from '../../../../../src/contexts/appointment/application/interfaces/ICountryAppointmentService';
import Container, { TOKENS } from '../../../../../src/app/di/iocContainer';
import { SNSMessageBody } from '../../../../../src/contexts/appointment/domain/types/AppointmentTypes';
import { handler } from '../../../../../src/app/handlers/appointment/appointment_pe';


jest.mock('../../../../../src/app/di/iocContainer', () => ({
  __esModule: true,
  default: {
    get: jest.fn()
  },
  TOKENS: {
    PERU_APPOINTMENT_SERVICE: Symbol('PERU_APPOINTMENT_SERVICE'),
    CHILE_APPOINTMENT_SERVICE: Symbol('CHILE_APPOINTMENT_SERVICE')
  }
}));

describe('appointment_pe.handler', () => {
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
        TopicArn: 'arn:aws:sns:us-east-2:123456789:peru-topic',
        Subject: 'Appointment Peru',
        Message: JSON.stringify({
          appointmentId: '123',
          insuredId: 'INS-456',
          countryISO: 'PE'
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
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:peru-queue',
            awsRegion: 'us-east-2'
          }
        ]
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(Container.get).toHaveBeenCalledWith(TOKENS.PERU_APPOINTMENT_SERVICE);
      expect(mockAppointmentService.processMessage).toHaveBeenCalledWith(mockSNSMessage);
      expect(mockAppointmentService.processMessage).toHaveBeenCalledTimes(1);
      
      // Verificar logs
      expect(consoleLogSpy).toHaveBeenCalledWith('===== INICIO PROCESAMIENTO DE CITAS PERÚ =====');
      expect(consoleLogSpy).toHaveBeenCalledWith('Número de registros recibidos:', 1);
      expect(consoleLogSpy).toHaveBeenCalledWith('Procesando registro:', 'sqs-message-id-1');
      expect(consoleLogSpy).toHaveBeenCalledWith('===== FIN PROCESAMIENTO DE CITAS PERÚ =====');
    });

    it('debe procesar múltiples mensajes de SQS', async () => {
      // Arrange
      const mockSNSMessages: SNSMessageBody[] = [
        {
          Type: 'Notification',
          MessageId: 'msg-1',
          Message: JSON.stringify({ appointmentId: '123' }),
          TopicArn: 'peru-topic',
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
          TopicArn: 'peru-topic',
          Subject: 'Test',
          Timestamp: '2024-01-01T10:00:00.000Z',
          SignatureVersion: '1',
          Signature: 'sig-2',
          SigningCertURL: 'https://test.com',
          UnsubscribeURL: 'https://test.com'
        },
        {
          Type: 'Notification',
          MessageId: 'msg-3',
          Message: JSON.stringify({ appointmentId: '789' }),
          TopicArn: 'peru-topic',
          Subject: 'Test',
          Timestamp: '2024-01-01T10:00:00.000Z',
          SignatureVersion: '1',
          Signature: 'sig-3',
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
          eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:peru-queue',
          awsRegion: 'us-east-2'
        }))
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(mockAppointmentService.processMessage).toHaveBeenCalledTimes(3);
      expect(mockAppointmentService.processMessage).toHaveBeenNthCalledWith(1, mockSNSMessages[0]);
      expect(mockAppointmentService.processMessage).toHaveBeenNthCalledWith(2, mockSNSMessages[1]);
      expect(mockAppointmentService.processMessage).toHaveBeenNthCalledWith(3, mockSNSMessages[2]);
      expect(consoleLogSpy).toHaveBeenCalledWith('Número de registros recibidos:', 3);
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
      expect(consoleLogSpy).toHaveBeenCalledWith('===== INICIO PROCESAMIENTO DE CITAS PERÚ =====');
      expect(consoleLogSpy).toHaveBeenCalledWith('===== FIN PROCESAMIENTO DE CITAS PERÚ =====');
    });

    it('debe procesar correctamente mensajes con diferentes tipos de contenido', async () => {
      // Arrange
      const mockSNSMessage: SNSMessageBody = {
        Type: 'Notification',
        MessageId: 'complex-msg-id',
        TopicArn: 'arn:aws:sns:us-east-2:123456789:peru-topic',
        Subject: 'Complex Appointment',
        Message: JSON.stringify({
          appointmentId: 'APT-COMPLEX-123',
          insuredId: 'INS-789',
          countryISO: 'PE',
          doctorId: 'DOC-456',
          appointmentDate: '2024-02-15T14:30:00Z',
          clinicLocation: 'Lima Central',
          speciality: 'Cardiología',
          metadata: {
            priority: 'high',
            requiresPreAuth: true
          }
        }),
        Timestamp: '2024-01-01T10:00:00.000Z',
        SignatureVersion: '1',
        Signature: 'complex-signature',
        SigningCertURL: 'https://test.com/cert',
        UnsubscribeURL: 'https://test.com/unsubscribe',
        MessageAttributes: {
          priority: {
            Type: 'String',
            Value: 'high'
          }
        }
      };

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'complex-sqs-msg',
            receiptHandle: 'complex-receipt',
            body: JSON.stringify(mockSNSMessage),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890000',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890000'
            },
            messageAttributes: {},
            md5OfBody: 'complex-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:peru-queue',
            awsRegion: 'us-east-2'
          }
        ]
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(mockAppointmentService.processMessage).toHaveBeenCalledWith(mockSNSMessage);
      expect(consoleLogSpy).toHaveBeenCalledWith('Procesando registro:', 'complex-sqs-msg');
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
            body: 'invalid-json-{[}',
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890000',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890000'
            },
            messageAttributes: {},
            md5OfBody: 'error-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:peru-queue',
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
      expect(consoleLogSpy).toHaveBeenCalledWith('===== ERROR EN PROCESAMIENTO DE CITAS PERÚ =====');
    });

    it('debe lanzar error cuando falla el servicio de procesamiento', async () => {
      // Arrange
      const mockError = new Error('Error de conexión a base de datos');
      mockAppointmentService.processMessage.mockRejectedValue(mockError);

      const mockSNSMessage: SNSMessageBody = {
        Type: 'Notification',
        MessageId: 'test-message-id',
        TopicArn: 'peru-topic',
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
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:peru-queue',
            awsRegion: 'us-east-2'
          }
        ]
      };

      // Act & Assert
      await expect(handler(event, {} as Context, () => {})).rejects.toThrow(mockError);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error al procesar mensaje de SQS:', mockError);
      expect(consoleLogSpy).toHaveBeenCalledWith('===== ERROR EN PROCESAMIENTO DE CITAS PERÚ =====');
    });

    it('debe lanzar error cuando falla Container.get', async () => {
      // Arrange
      const mockError = new Error('Servicio no encontrado en el contenedor');
      (Container.get as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      const event: SQSEvent = {
        Records: [{
          messageId: 'msg-1',
          receiptHandle: 'receipt-1',
          body: JSON.stringify({
            Type: 'Notification',
            MessageId: 'test-msg',
            Message: '{}',
            TopicArn: 'peru-topic',
            Subject: 'Test',
            Timestamp: '2024-01-01T10:00:00.000Z',
            SignatureVersion: '1',
            Signature: 'sig',
            SigningCertURL: 'https://test.com',
            UnsubscribeURL: 'https://test.com'
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
          eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:peru-queue',
          awsRegion: 'us-east-2'
        }]
      };

      // Act & Assert
      await expect(handler(event, {} as Context, () => {})).rejects.toThrow(mockError);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error al procesar mensaje de SQS:', mockError);
      expect(consoleLogSpy).toHaveBeenCalledWith('===== INICIO PROCESAMIENTO DE CITAS PERÚ =====');
      expect(consoleLogSpy).toHaveBeenCalledWith('===== ERROR EN PROCESAMIENTO DE CITAS PERÚ =====');
    });

    it('debe lanzar error si falla en cualquier mensaje de múltiples registros', async () => {
      // Arrange
      const mockError = new Error('Error en el segundo mensaje');
      mockAppointmentService.processMessage
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(mockError);

      const event: SQSEvent = {
        Records: [
          {
            messageId: 'success-msg',
            receiptHandle: 'success-receipt',
            body: JSON.stringify({
              Type: 'Notification',
              MessageId: 'msg-1',
              Message: '{}',
              TopicArn: 'peru-topic',
              Subject: 'Test',
              Timestamp: '2024-01-01T10:00:00.000Z',
              SignatureVersion: '1',
              Signature: 'sig-1',
              SigningCertURL: 'https://test.com',
              UnsubscribeURL: 'https://test.com'
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890000',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890000'
            },
            messageAttributes: {},
            md5OfBody: 'success-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:peru-queue',
            awsRegion: 'us-east-2'
          },
          {
            messageId: 'error-msg',
            receiptHandle: 'error-receipt',
            body: JSON.stringify({
              Type: 'Notification',
              MessageId: 'msg-2',
              Message: '{}',
              TopicArn: 'peru-topic',
              Subject: 'Test',
              Timestamp: '2024-01-01T10:00:00.000Z',
              SignatureVersion: '1',
              Signature: 'sig-2',
              SigningCertURL: 'https://test.com',
              UnsubscribeURL: 'https://test.com'
            }),
            attributes: {
              ApproximateReceiveCount: '1',
              SentTimestamp: '1234567890001',
              SenderId: 'test-sender',
              ApproximateFirstReceiveTimestamp: '1234567890001'
            },
            messageAttributes: {},
            md5OfBody: 'error-md5',
            eventSource: 'aws:sqs',
            eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:peru-queue',
            awsRegion: 'us-east-2'
          }
        ]
      };

      // Act & Assert
      await expect(handler(event, {} as Context, () => {})).rejects.toThrow(mockError);
      expect(mockAppointmentService.processMessage).toHaveBeenCalledTimes(2);
      expect(consoleLogSpy).toHaveBeenCalledWith('Procesando registro:', 'success-msg');
      expect(consoleLogSpy).toHaveBeenCalledWith('Procesando registro:', 'error-msg');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error al procesar mensaje de SQS:', mockError);
    });
  });

  describe('Características específicas de Perú', () => {
    it('debe usar el token correcto para el servicio de Perú', async () => {
      // Arrange
      const event: SQSEvent = {
        Records: [{
          messageId: 'peru-specific-msg',
          receiptHandle: 'peru-receipt',
          body: JSON.stringify({
            Type: 'Notification',
            MessageId: 'peru-msg',
            Message: '{}',
            TopicArn: 'peru-topic',
            Subject: 'Test',
            Timestamp: '2024-01-01T10:00:00.000Z',
            SignatureVersion: '1',
            Signature: 'peru-sig',
            SigningCertURL: 'https://test.com',
            UnsubscribeURL: 'https://test.com'
          }),
          attributes: {
            ApproximateReceiveCount: '1',
            SentTimestamp: '1234567890000',
            SenderId: 'test-sender',
            ApproximateFirstReceiveTimestamp: '1234567890000'
          },
          messageAttributes: {},
          md5OfBody: 'peru-md5',
          eventSource: 'aws:sqs',
          eventSourceARN: 'arn:aws:sqs:us-east-2:123456789:appointment-pe-queue-v001-dev',
          awsRegion: 'us-east-2'
        }]
      };

      // Act
      await handler(event, {} as Context, () => {});

      // Assert
      expect(Container.get).toHaveBeenCalledWith(TOKENS.PERU_APPOINTMENT_SERVICE);
      expect(Container.get).not.toHaveBeenCalledWith(TOKENS.CHILE_APPOINTMENT_SERVICE);
    });
  });
});