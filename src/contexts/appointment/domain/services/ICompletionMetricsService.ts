import { AppointmentEntity } from "../entities/AppointmentEntity";
import { AppointmentCompletionData } from "../types/AppointmentCompletionTypes";

export interface ICompletionMetricsService {
    recordCompletion(appointment: AppointmentEntity, confirmationData: AppointmentCompletionData): Promise<void>;
    getStats(): Promise<CompletionStats>;
    healthCheck(): Promise<HealthCheckResult>;
}

export interface CompletionStats {
    totalCompleted: number;
    completedToday: number;
    averageCompletionTime: number;
    lastCompletionAt: string;
}

export interface HealthCheckResult {
    service: string;
    status: 'healthy' | 'unhealthy';
    timestamp: string;
    stats: {
        totalProcessed: number;
        lastProcessedAt: string;
    };
}