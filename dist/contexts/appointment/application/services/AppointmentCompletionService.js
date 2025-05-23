"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentCompletionService = void 0;
/**
 * Implementación del servicio para procesar confirmaciones de citas completadas
 * Maneja el paso 6 del reto: actualizar estado a "completed" en DynamoDB
 */
class AppointmentCompletionService {
    constructor(appointmentRepository, validator, metricsService, eventPublisher, countryRulesService) {
        this.appointmentRepository = appointmentRepository;
        this.validator = validator;
        this.metricsService = metricsService;
        this.eventPublisher = eventPublisher;
        this.countryRulesService = countryRulesService;
    }
    /**
     * Procesa una confirmación de cita completada (PASO 6 DEL RETO)
     */
    processCompletionConfirmation(confirmationData) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const appointment = yield this.appointmentRepository.findById(confirmationData.appointmentId);
                if (!appointment) {
                    throw new Error(`No se encontró la cita con ID: ${confirmationData.appointmentId}`);
                }
                // 3. Validar estado actual de la cita
                this.validator.validateAppointmentStatus(appointment);
                // 4. Actualizar estado a "completed" en DynamoDB (PASO 6)
                yield this.appointmentRepository.updateStatus(confirmationData.appointmentId, 'completed');
                console.log('✅ Estado actualizado a "completed" en DynamoDB (PASO 6 COMPLETADO)');
                // 5. Registrar métricas
                yield this.metricsService.recordCompletion(appointment, confirmationData);
                // 6. Aplicar reglas específicas del país
                yield this.countryRulesService.applyCompletionRules(appointment);
                // 7. Publicar evento de completación final
                yield this.eventPublisher.publishFinalCompletionEvent(appointment, confirmationData);
                console.log('=== FIN PROCESAMIENTO DE CONFIRMACIÓN ===');
            }
            catch (error) {
                console.error('Error en procesamiento de confirmación:', error);
                // Publicar evento de error
                if (confirmationData.appointmentId) {
                    yield this.eventPublisher.publishCompletionErrorEvent(confirmationData.appointmentId, error);
                }
                throw new Error(`Error al procesar confirmación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Procesa una confirmación desde un mensaje de EventBridge/SQS
     */
    processEventBridgeConfirmation(eventBridgeMessage) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const confirmationData = this.extractConfirmationData(eventBridgeMessage.detail);
                // Procesar la confirmación
                yield this.processCompletionConfirmation(confirmationData);
            }
            catch (error) {
                console.error('Error procesando mensaje EventBridge:', error);
                throw new Error(`Error procesando mensaje EventBridge: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Obtiene estadísticas de confirmaciones procesadas
     */
    getCompletionStats() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const stats = yield this.metricsService.getStats();
                return {
                    totalCompleted: stats.totalCompleted,
                    completedToday: stats.completedToday,
                    averageCompletionTime: stats.averageCompletionTime
                };
            }
            catch (error) {
                console.error('Error obteniendo estadísticas:', error);
                return {
                    totalCompleted: 0,
                    completedToday: 0,
                    averageCompletionTime: 0
                };
            }
        });
    }
    /**
     * Verifica la salud del servicio de completación
     */
    healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Obtener health check del servicio de métricas
                const metricsHealth = yield this.metricsService.healthCheck();
                // Verificar conectividad con DynamoDB
                const dbHealthy = yield this.checkDatabaseHealth();
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
            }
            catch (error) {
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
        });
    }
    /**
     * Extrae y valida los datos de confirmación del mensaje
     */
    extractConfirmationData(detail) {
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
            status: detail.status,
            completedAt: detail.completedAt,
            processingTime: typeof detail.processingTime === 'number' ? detail.processingTime : undefined,
            countryISO: (detail.countryISO === 'PE' || detail.countryISO === 'CL') ? detail.countryISO : undefined,
            metadata: detail.metadata
        };
    }
    /**
     * Verifica la salud de la conexión con DynamoDB
     */
    checkDatabaseHealth() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.appointmentRepository.findById('health-check-id');
                return true;
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('No se encontró')) {
                    return true;
                }
                console.error('Error verificando salud de BD:', error);
                return false;
            }
        });
    }
}
exports.AppointmentCompletionService = AppointmentCompletionService;
