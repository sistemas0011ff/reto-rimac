
/**
 * Datos de confirmación de una cita completada
 * Recibidos desde EventBridge en el paso 5 del reto
 */
export interface AppointmentCompletionData {
    /**
     * ID único de la cita
     */
    appointmentId: string;
    
    /**
     * Estado de la cita (debe ser 'completed')
     */
    status: 'completed';
    
    /**
     * Timestamp de cuando se completó la cita
     */
    completedAt: string;
    
    /**
     * Tiempo de procesamiento en milisegundos (opcional)
     */
    processingTime?: number;
    
    /**
     * País de la cita (opcional, para estadísticas)
     */
    countryISO?: 'PE' | 'CL';
    
    /**
     * Metadatos adicionales (opcional)
     */
    metadata?: Record<string, unknown>;
}

/**
 * Datos extendidos de confirmación con información del procesador
 */
export interface ExtendedAppointmentCompletionData extends AppointmentCompletionData {
    /**
     * ID del procesador que completó la cita
     */
    processorId: string;
    
    /**
     * Región donde se procesó
     */
    processingRegion: string;
    
    /**
     * Versión del procesador
     */
    processorVersion: string;
}