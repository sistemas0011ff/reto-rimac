/**
 * Datos para el evento de creación de cita
 */
export interface AppointmentCreatedEventData {
    appointmentId: string;
    insuredId: string;
    scheduleId: number;
    countryISO: string;
    status: string;
    createdAt: string;
}

/**
 * Datos para el evento de cita completada
 */
export interface AppointmentCompletedEventData {
    appointmentId: string;
    status: string;
    completedAt: string;
}

/**
 * Datos para el evento de cita cancelada
 */
export interface AppointmentCancelledEventData {
    appointmentId: string;
    reason?: string;
    cancelledAt: string;
}