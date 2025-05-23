import { ICountryAppointmentService } from '../interfaces/ICountryAppointmentService';
import { ICountryAppointmentProcessor } from '../../domain/ports/ICountryAppointmentProcessor';
import { AppointmentData, SNSMessageBody } from '../../domain/types/AppointmentTypes';

/**
 * Servicio de aplicación para procesamiento de citas por país
 */
export class CountryAppointmentService implements ICountryAppointmentService {
    constructor(
        private countryProcessor: ICountryAppointmentProcessor
    ) {}
    
    /**
     * Procesa un mensaje de cita médica desde la cola SQS
     * @param messageBody Cuerpo del mensaje recibido
     */
    async processMessage(messageBody: SNSMessageBody): Promise<void> {
        try {
            console.log('Procesando mensaje de cita:', {
                messageType: messageBody.Type,
                messageId: messageBody.MessageId
            });
            
            // Extraer datos de la cita del mensaje SNS
            const appointmentData: AppointmentData = JSON.parse(messageBody.Message);
            
            console.log('Datos de cita extraídos:', {
                appointmentId: appointmentData.id,
                insuredId: appointmentData.insuredId,
                countryISO: appointmentData.countryISO
            });
            
            // Procesar la cita en el sistema del país
            await this.countryProcessor.processAppointment(appointmentData);
            
            // Enviar confirmación
            const eventId = await this.countryProcessor.sendConfirmation(appointmentData);
            
            console.log('Procesamiento completado con éxito:', {
                appointmentId: appointmentData.id,
                eventId
            });
        } catch (error) {
            console.error('Error en el procesamiento de mensaje:', error);
            throw new Error(`Error al procesar mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
}