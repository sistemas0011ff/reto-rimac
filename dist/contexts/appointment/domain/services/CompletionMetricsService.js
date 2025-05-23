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
exports.CompletionMetricsService = void 0;
/**
 * Servicio responsable de registrar y gestionar métricas de completación
 */
class CompletionMetricsService {
    constructor() {
        this.completionCount = 0;
        this.lastCompletionAt = '';
        this.completionTimes = [];
    }
    /**
     * Registra métricas de una completación
     */
    recordCompletion(appointment, confirmationData) {
        return __awaiter(this, void 0, void 0, function* () {
            const createdAt = new Date(appointment.createdAt);
            const completedAt = new Date(confirmationData.completedAt);
            const processingTimeMs = completedAt.getTime() - createdAt.getTime();
            // Actualizar contadores
            this.completionCount++;
            this.lastCompletionAt = new Date().toISOString();
            this.completionTimes.push(processingTimeMs);
            // Mantener solo las últimas 100 mediciones
            if (this.completionTimes.length > 100) {
                this.completionTimes.shift();
            }
            console.log('Métricas de procesamiento registradas:', {
                appointmentId: appointment.id,
                countryISO: appointment.countryISO,
                processingTimeMs,
                processingTimeMinutes: Math.round(processingTimeMs / 60000)
            });
            // En producción: enviar a CloudWatch
            // await this.cloudWatchClient.putMetricData({...});
        });
    }
    /**
     * Obtiene estadísticas de completación
     */
    getStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const today = new Date().toISOString().split('T')[0];
            const todayCount = this.calculateTodayCount(); // Implementar lógica real
            return {
                totalCompleted: this.completionCount,
                completedToday: todayCount,
                averageCompletionTime: this.calculateAverageTime(),
                lastCompletionAt: this.lastCompletionAt
            };
        });
    }
    /**
     * Verifica salud del servicio
     */
    healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                service: 'CompletionMetricsService',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                stats: {
                    totalProcessed: this.completionCount,
                    lastProcessedAt: this.lastCompletionAt || 'Never'
                }
            };
        });
    }
    calculateAverageTime() {
        if (this.completionTimes.length === 0)
            return 0;
        const sum = this.completionTimes.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.completionTimes.length);
    }
    calculateTodayCount() {
        return this.completionCount;
    }
}
exports.CompletionMetricsService = CompletionMetricsService;
