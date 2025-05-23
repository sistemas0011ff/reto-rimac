/**
 * Tipo para el detalle del evento de error de completación
 */
export interface CompletionErrorEventDetail {
    appointmentId: string;
    errorMessage: string;
    errorType: 'validation' | 'database' | 'network' | 'unknown';
    errorName: string;
    timestamp: string;
}

/**
 * Tipo para el detalle del evento de completación exitosa
 */
export interface CompletionSuccessEventDetail {
    appointmentId: string;
    insuredId: string;
    countryISO: string;
    completedAt: string;
    finalizedAt: string;
}