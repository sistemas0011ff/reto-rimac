import { ICompletionMetricsService, CompletionStats, HealthCheckResult } from '../../domain/services/ICompletionMetricsService';
import { AppointmentEntity } from '../../domain/entities/AppointmentEntity';
import { AppointmentCompletionData } from '../../domain/types/AppointmentCompletionTypes';

/**
 * Servicio responsable de registrar y gestionar métricas de completación
 */
export class CompletionMetricsService implements ICompletionMetricsService {
    private completionCount: number = 0;
    private lastCompletionAt: string = '';
    private completionTimes: number[] = [];
    
    /**
     * Registra métricas de una completación
     */
    async recordCompletion(
        appointment: AppointmentEntity, 
        confirmationData: AppointmentCompletionData
    ): Promise<void> {
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
    }
    
    /**
     * Obtiene estadísticas de completación
     */
    async getStats(): Promise<CompletionStats> {
        const today = new Date().toISOString().split('T')[0];
        const todayCount = this.calculateTodayCount(); // Implementar lógica real
        
        return {
            totalCompleted: this.completionCount,
            completedToday: todayCount,
            averageCompletionTime: this.calculateAverageTime(),
            lastCompletionAt: this.lastCompletionAt
        };
    }
    
    /**
     * Verifica salud del servicio
     */
    async healthCheck(): Promise<HealthCheckResult> {
        return {
            service: 'CompletionMetricsService',
            status: 'healthy',
            timestamp: new Date().toISOString(),
            stats: {
                totalProcessed: this.completionCount,
                lastProcessedAt: this.lastCompletionAt || 'Never'
            }
        };
    }
    
    private calculateAverageTime(): number {
        if (this.completionTimes.length === 0) return 0;
        const sum = this.completionTimes.reduce((a, b) => a + b, 0);
        return Math.round(sum / this.completionTimes.length);
    }
    
    private calculateTodayCount(): number {
        return this.completionCount;
    }
}
