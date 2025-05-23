import { SQSHandler, SQSEvent } from 'aws-lambda';
import 'reflect-metadata';
import Container, { TOKENS } from '../../di/iocContainer';
import { ICountryAppointmentService } from '../../../contexts/appointment/application/interfaces/ICountryAppointmentService';
import { SNSMessageBody } from '../../../contexts/appointment/domain/types/AppointmentTypes';

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
    try {
        console.log('===== INICIO PROCESAMIENTO DE CITAS PERÚ =====');
        console.log('Número de registros recibidos:', event.Records.length);
        
        const appointmentService = Container.get<ICountryAppointmentService>(TOKENS.PERU_APPOINTMENT_SERVICE);
        
        // Procesar cada mensaje de la cola
        for (const record of event.Records) {
            console.log('Procesando registro:', record.messageId);            
            const messageBody: SNSMessageBody = JSON.parse(record.body);
            await appointmentService.processMessage(messageBody);
        }       
        console.log('===== FIN PROCESAMIENTO DE CITAS PERÚ =====');
        
    } catch (error) {
        console.error('Error al procesar mensaje de SQS:', error);
        console.log('===== ERROR EN PROCESAMIENTO DE CITAS PERÚ =====');
        throw error;
    }
};