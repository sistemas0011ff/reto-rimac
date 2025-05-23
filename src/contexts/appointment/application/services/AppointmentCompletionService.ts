import { IAppointmentCompletionService } from '../interfaces/IAppointmentCompletionService';
import { IAppointmentRepository } from '../../domain/interfaces/IAppointmentRepository';
import { ICompletionValidator } from '../../domain/services/ICompletionValidator';
import { ICompletionMetricsService } from '../../domain/services/ICompletionMetricsService';
import { ICompletionEventPublisher } from '../../domain/services/ICompletionEventPublisher';
import { ICountryCompletionRulesService } from '../interfaces/ICountryCompletionRulesService';
import { AppointmentCompletionData } from '../../domain/types/AppointmentCompletionTypes';
import { EventBridgeMessage } from '../../domain/types/EventBridgeTypes';

/**
 * Implementación del servicio para procesar confirmaciones de citas completadas
 * Maneja el paso 6 del reto: actualizar estado a "completed" en DynamoDB
 */
export class AppointmentCompletionService implements IAppointmentCompletionService {
    constructor(
        private readonly appointmentRepository: IAppointmentRepository,
        private readonly validator: ICompletionValidator,
        private readonly metricsService: ICompletionMetricsService,
        private readonly eventPublisher: ICompletionEventPublisher,
        private readonly countryRulesService: ICountryCompletionRulesService
    ) {}
    
    /**
     * Procesa una confirmación de cita completada (PASO 6 DEL RETO)
     */
    async processCompletionConfirmation(confirmationData: AppointmentCompletionData): Promise<void> {
        console.log('=== INICIO PROCESAMIENTO DE CONFIRMACIÓN ===');
        console.log('Procesando confirmación:', {
            appointmentId: confirmationData.appointmentId,
            status: confirmationData.status,
            completedAt: confirmationData.completedAt
        });
        
        try {
            // 1. Validar datos de entrada
            this.validator.validateConfirmationData(confirmationData);
            
            // 2. Buscar la cita en DynamoDB
            const appointment = await this.appointmentRepository.findById(confirmationData.appointmentId);
            if (!appointment) {
                throw new Error(`No se encontró la cita con ID: ${confirmationData.appointmentId}`);
            }
            
            // 3. Validar estado actual de la cita
            this.validator.validateAppointmentStatus(appointment);
            
            // 4. Actualizar estado a "completed" en DynamoDB (PASO 6)
            await this.appointmentRepository.updateStatus(
                confirmationData.appointmentId, 
                'completed'
            );
            
            console.log('✅ Estado actualizado a "completed" en DynamoDB (PASO 6 COMPLETADO)');
            
            // 5. Registrar métricas
            await this.metricsService.recordCompletion(appointment, confirmationData);
            
            // 6. Aplicar reglas específicas del país
            await this.countryRulesService.applyCompletionRules(appointment);
            
            // 7. Publicar evento de completación final
            await this.eventPublisher.publishFinalCompletionEvent(appointment, confirmationData);
            
            console.log('=== FIN PROCESAMIENTO DE CONFIRMACIÓN ===');
            
        } catch (error) {
            console.error('Error en procesamiento de confirmación:', error);
            
            // Publicar evento de error
            if (confirmationData.appointmentId) {
                await this.eventPublisher.publishCompletionErrorEvent(
                    confirmationData.appointmentId,
                    error as Error
                );
            }
            
            throw new Error(`Error al procesar confirmación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    
    /**
     * Procesa una confirmación desde un mensaje de EventBridge/SQS
     */
    async processEventBridgeConfirmation(eventBridgeMessage: EventBridgeMessage): Promise<void> {
        console.log('Procesando mensaje de EventBridge:', {
            source: eventBridgeMessage.source,
            detailType: eventBridgeMessage['detail-type'],
            hasDetail: !!eventBridgeMessage.detail
        });
        
        try {
            // Validar estructura básica del mensaje
            if (!eventBridgeMessage.detail) {
                throw new Error('Mensaje de EventBridge sin datos de detalle');
            }
            
            // Validar que sea un evento de completación
            if (eventBridgeMessage['detail-type'] !== 'appointment.completed') {
                throw new Error(`Tipo de evento no esperado: ${eventBridgeMessage['detail-type']}`);
            }
            
            // Extraer y validar datos de confirmación
            const confirmationData: AppointmentCompletionData = this.extractConfirmationData(eventBridgeMessage.detail);
            
            // Procesar la confirmación
            await this.processCompletionConfirmation(confirmationData);
            
        } catch (error) {
            console.error('Error procesando mensaje EventBridge:', error);
            throw new Error(`Error procesando mensaje EventBridge: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    
    /**
     * Obtiene estadísticas de confirmaciones procesadas
     */
    async getCompletionStats(): Promise<{
        totalCompleted: number;
        completedToday: number;
        averageCompletionTime: number;
    }> {
        try {
            const stats = await this.metricsService.getStats();
            
            return {
                totalCompleted: stats.totalCompleted,
                completedToday: stats.completedToday,
                averageCompletionTime: stats.averageCompletionTime
            };
            
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
             
            return {
                totalCompleted: 0,
                completedToday: 0,
                averageCompletionTime: 0
            };
        }
    }
    
    /**
     * Verifica la salud del servicio de completación
     */
    async healthCheck(): Promise<{
        service: string;
        status: 'healthy' | 'unhealthy';
        timestamp: string;
        stats: {
            totalProcessed: number;
            lastProcessedAt: string;
        };
    }> {
        try {
            // Obtener health check del servicio de métricas
            const metricsHealth = await this.metricsService.healthCheck();
            
            // Verificar conectividad con DynamoDB
            const dbHealthy = await this.checkDatabaseHealth();
            
            // Determinar estado general
            const isHealthy = metricsHealth.status === 'healthy' && dbHealthy;
            
            return {
                service: 'AppointmentCompletionService',
                status: isHealthy ? 'healthy' : 'unhealthy',
                timestamp: new Date().toISOString(),
                stats: {
                    totalProcessed: metricsHealth.stats.totalProcessed,
                    lastProcessedAt: metricsHealth.stats.lastProcessedAt
                }
            };
            
        } catch (error) {
            console.error('Error en health check:', error);
            
            return {
                service: 'AppointmentCompletionService',
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                stats: {
                    totalProcessed: 0,
                    lastProcessedAt: 'Never'
                }
            };
        }
    }
    
    /**
     * Extrae y valida los datos de confirmación del mensaje
     */
    private extractConfirmationData(detail: Record<string, unknown>): AppointmentCompletionData {
        // Validar campos requeridos
        if (!detail.appointmentId || typeof detail.appointmentId !== 'string') {
            throw new Error('appointmentId faltante o inválido en el detalle del evento');
        }
        
        if (!detail.status || detail.status !== 'completed') {
            throw new Error('status faltante o inválido en el detalle del evento');
        }
        
        if (!detail.completedAt || typeof detail.completedAt !== 'string') {
            throw new Error('completedAt faltante o inválido en el detalle del evento');
        }
        
        return {
            appointmentId: detail.appointmentId,
            status: detail.status as 'completed',
            completedAt: detail.completedAt, 
            processingTime: typeof detail.processingTime === 'number' ? detail.processingTime : undefined,
            countryISO: (detail.countryISO === 'PE' || detail.countryISO === 'CL') ? detail.countryISO : undefined,
            metadata: detail.metadata as Record<string, unknown> | undefined
        };
    }
    
    /**
     * Verifica la salud de la conexión con DynamoDB
     */
    private async checkDatabaseHealth(): Promise<boolean> {
        try { 
            await this.appointmentRepository.findById('health-check-id');
            return true;
        } catch (error) { 
            if (error instanceof Error && error.message.includes('No se encontró')) {
                return true;
            }
            console.error('Error verificando salud de BD:', error);
            return false;
        }
    }
}