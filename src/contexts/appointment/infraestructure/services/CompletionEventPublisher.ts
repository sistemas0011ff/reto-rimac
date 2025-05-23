import { IEventBusService } from '../../domain/ports/IEventBusService';
import { AppointmentEntity } from '../../domain/entities/AppointmentEntity';
import { AppointmentCompletionData } from '../../domain/types/AppointmentCompletionTypes';
import { EventType } from '../../domain/events/EventTypes';
import { ICompletionEventPublisher } from '../../domain/services/ICompletionEventPublisher';


/**
 * Servicio responsable de publicar eventos de completación
 */
export class CompletionEventPublisher implements ICompletionEventPublisher {
    constructor(
        private readonly eventBusService: IEventBusService
    ) {}
    
    /**
     * Publica el evento final de completación
     */
    async publishFinalCompletionEvent(
        appointment: AppointmentEntity, 
        confirmationData: AppointmentCompletionData
    ): Promise<void> {
        try {
            console.log('Publicando evento final de completación...');
            
            const finalEvent = this.eventBusService.createEvent(
                EventType.APPOINTMENT_FULLY_COMPLETED,
                {
                    appointmentId: appointment.id,
                    insuredId: appointment.insuredId,
                    countryISO: appointment.countryISO,
                    completedAt: confirmationData.completedAt,
                    finalizedAt: new Date().toISOString()
                },
                'custom.appointment.completion'
            );
            
            await this.eventBusService.publish(finalEvent);
            
            console.log('Evento final publicado exitosamente');
            
        } catch (error) {
            console.error('Error publicando evento final:', error);
            throw new Error(`Error al publicar evento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    
    /**
     * Publica evento de error en completación
     */
    async publishCompletionErrorEvent(
        appointmentId: string,
        error: Error
    ): Promise<void> {
        try {
            // Mapear el tipo de error a los valores permitidos
            const errorType = this.mapErrorType(error);
            
            const errorEvent = this.eventBusService.createEvent(
                EventType.APPOINTMENT_COMPLETION_ERROR,
                {
                    appointmentId,
                    errorMessage: error.message,
                    errorType: errorType,
                    errorName: error.name,
                    timestamp: new Date().toISOString()
                },
                'custom.appointment.completion'
            );
            
            await this.eventBusService.publish(errorEvent);
            
        } catch (publishError) {
            console.error('Error publicando evento de error:', publishError);
        }
    }
    
    /**
     * Mapea el error a un tipo permitido
     */
    private mapErrorType(error: Error): 'validation' | 'database' | 'network' | 'unknown' {
        const errorName = error.name.toLowerCase();
        const errorMessage = error.message.toLowerCase();
        
        // Errores de validación
        if (errorName.includes('validation') || 
            errorMessage.includes('validación') || 
            errorMessage.includes('inválido') ||
            errorMessage.includes('requerido')) {
            return 'validation';
        }
        
        // Errores de base de datos
        if (errorName.includes('database') || 
            errorName.includes('mysql') || 
            errorName.includes('dynamodb') ||
            errorMessage.includes('base de datos')) {
            return 'database';
        }
        
        // Errores de red
        if (errorName.includes('network') || 
            errorName.includes('timeout') || 
            errorName.includes('connection')) {
            return 'network';
        }
        
        // Por defecto
        return 'unknown';
    }
}
 