// src/contexts/appointment/domain/types/CustomEventTypes.ts
import { EventType } from '../events/EventTypes';

/**
 * Configuración base para eventos personalizados
 */
export interface CustomEventConfig<T = unknown> {
    source: string;
    detailType: EventType; // ✅ Usar EventType en lugar de string
    detail: T;
}

/**
 * Datos para evento de finalización completa de cita
 */
export interface AppointmentFullyCompletedEventData {
    appointmentId: string;
    insuredId: string;
    countryISO: string;
    completedAt: string;
    finalizedAt: string;
}

/**
 * Datos para evento de métricas de procesamiento
 */
export interface ProcessingMetricsEventData {
    appointmentId: string;
    countryISO: string;
    processingTimeMs: number;
    processingStage: 'created' | 'processed' | 'completed';
    timestamp: string;
}

/**
 * Datos para evento de error en procesamiento
 */
export interface ProcessingErrorEventData {
    appointmentId: string;
    errorType: 'validation' | 'database' | 'network' | 'unknown';
    errorMessage: string;
    stage: 'creation' | 'processing' | 'completion';
    timestamp: string;
}

/**
 * Tipos de eventos personalizados disponibles
 */
export type CustomEventData = 
    | AppointmentFullyCompletedEventData
    | ProcessingMetricsEventData
    | ProcessingErrorEventData;