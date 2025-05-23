import { SQSHandler, SQSEvent } from 'aws-lambda';
import 'reflect-metadata';
import Container, { TOKENS } from '../../di/iocContainer';
import { IAppointmentCompletionService } from '../../../contexts/appointment/application/interfaces/IAppointmentCompletionService';

/**
 * Handler para procesar confirmaciones de citas completadas desde EventBridge
 * Paso 6 del reto: Actualizar estado a "completed" en DynamoDB
 */
export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
    try {
        console.log('===== INICIO PROCESAMIENTO DE CONFIRMACIONES =====');
        console.log('Número de confirmaciones recibidas:', event.Records.length);
        
        const completionService = Container.get<IAppointmentCompletionService>(TOKENS.APPOINTMENT_COMPLETION_SERVICE);
        
        // Procesar cada mensaje de confirmación
        for (const record of event.Records) {
            console.log('Procesando confirmación:', record.messageId);
            
            try {
                // El mensaje viene de EventBridge, procedemos a parsearlo
                const eventBridgeMessage = JSON.parse(record.body);
                
                await completionService.processEventBridgeConfirmation(eventBridgeMessage);
                
                console.log('Confirmación procesada exitosamente:', record.messageId);
                
            } catch (recordError) {
                console.error('Error procesando confirmación individual:', {
                    messageId: record.messageId,
                    error: recordError instanceof Error ? recordError.message : 'Error desconocido',
                    body: record.body
                });
            }
        }
        
        console.log('===== FIN PROCESAMIENTO DE CONFIRMACIONES =====');
        
    } catch (error) {
        console.error('Error general al procesar confirmaciones:', error);
        console.log('===== ERROR EN PROCESAMIENTO DE CONFIRMACIONES =====');
        throw error; 
    }
};