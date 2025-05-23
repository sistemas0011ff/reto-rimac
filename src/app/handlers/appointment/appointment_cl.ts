import { SQSHandler, SQSEvent } from 'aws-lambda';
import 'reflect-metadata';
import Container, { TOKENS } from '../../di/iocContainer';
import { ICountryAppointmentService } from '../../../contexts/appointment/application/interfaces/ICountryAppointmentService';
import { SNSMessageBody } from '../../../contexts/appointment/domain/types/AppointmentTypes';

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
    try {
        console.log('===== INICIO PROCESAMIENTO DE CITAS CHILE =====');
        console.log('Número de registros recibidos:', event.Records.length);
        
        const appointmentService = Container.get<ICountryAppointmentService>(TOKENS.CHILE_APPOINTMENT_SERVICE);
        
        // Procesar cada mensaje de la cola
        for (const record of event.Records) {
            console.log('Procesando registro:', record.messageId);
            
            const messageBody: SNSMessageBody = JSON.parse(record.body);
            console.log('Recibido mensaje de la cola SQS Chile:', {
                messageId: record.messageId,
                messageType: messageBody.Type
            });
            
            // Procesar el mensaje a través del servicio de aplicación
            await appointmentService.processMessage(messageBody);
        }
        
        console.log('===== FIN PROCESAMIENTO DE CITAS CHILE =====');
 
    } catch (error) {
        console.error('Error al procesar mensaje de SQS:', error);
        console.log('===== ERROR EN PROCESAMIENTO DE CITAS CHILE =====');
        throw error; 
    }
};