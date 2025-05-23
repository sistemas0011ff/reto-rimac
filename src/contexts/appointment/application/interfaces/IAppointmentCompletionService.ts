import { AppointmentCompletionData } from "../../domain/types/AppointmentCompletionTypes";
import { EventBridgeMessage } from "../../domain/types/EventBridgeTypes";

/**
 * Interfaz para el servicio de gestión de confirmaciones de citas completadas
 * Define el contrato para procesar confirmaciones del paso 6 del reto
 */
export interface IAppointmentCompletionService {
    /**
     * Procesa una confirmación de cita completada desde EventBridge
     * Actualiza el estado en DynamoDB según el paso 6 del reto
     * @param confirmationData Datos de la confirmación recibida
     */
    processCompletionConfirmation(confirmationData: AppointmentCompletionData): Promise<void>;
    
    /**
     * Obtiene estadísticas de confirmaciones procesadas
     * @returns Estadísticas de completación
     */
    getCompletionStats(): Promise<{
        totalCompleted: number;
        completedToday: number;
        averageCompletionTime: number;
    }>;
    
    /**
     * Verifica la salud del servicio de completación
     * @returns Estado del servicio
     */
    healthCheck(): Promise<{
        service: string;
        status: 'healthy' | 'unhealthy';
        timestamp: string;
        stats: {
            totalProcessed: number;
            lastProcessedAt: string;
        };
    }>;
    
    /**
     * Procesa una confirmación desde un mensaje de EventBridge/SQS
     * @param eventBridgeMessage Mensaje completo de EventBridge tipado
     */
    processEventBridgeConfirmation(eventBridgeMessage: EventBridgeMessage): Promise<void>;
}