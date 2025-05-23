/**
 * Tipos de eventos del dominio de citas médicas
 * Incluye eventos estándar y eventos personalizados
 */
export enum EventType {
    // Eventos principales del flujo
    APPOINTMENT_CREATED = 'appointment.created',
    APPOINTMENT_COMPLETED = 'appointment.completed',
    APPOINTMENT_CANCELLED = 'appointment.cancelled',
    APPOINTMENT_UPDATED = 'appointment.updated',
    
    // Eventos de procesamiento por país
    APPOINTMENT_PROCESSED_PERU = 'appointment.processed.peru',
    APPOINTMENT_PROCESSED_CHILE = 'appointment.processed.chile',
    
    // Eventos personalizados para completación
    APPOINTMENT_FULLY_COMPLETED = 'appointment.fully.completed',
    APPOINTMENT_COMPLETION_ERROR = 'appointment.completion.error', 
    PROCESSING_METRICS = 'processing.metrics',
    PROCESSING_ERROR = 'processing.error',
    
    // Eventos de sistema
    SYSTEM_HEALTH_CHECK = 'system.health.check',
    SERVICE_STATUS_CHANGED = 'service.status.changed'
}