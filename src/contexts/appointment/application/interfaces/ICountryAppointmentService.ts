import { SNSMessageBody } from '../../domain/types/AppointmentTypes';

/**
 * Interfaz para servicios de procesamiento de citas por país
 */
export interface ICountryAppointmentService {
    /**
     * Procesa un mensaje de cita médica desde la cola SQS
     * @param messageBody Cuerpo del mensaje SNS recibido
     */
    processMessage(messageBody: SNSMessageBody): Promise<void>;
}