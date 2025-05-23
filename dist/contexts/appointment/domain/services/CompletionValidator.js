"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionValidator = void 0;
/**
 * Servicio responsable de todas las validaciones de completación
 */
class CompletionValidator {
    /**
     * Valida los datos de confirmación recibidos
     */
    validateConfirmationData(confirmationData) {
        if (!confirmationData.appointmentId) {
            throw new Error('ID de cita requerido en datos de confirmación');
        }
        if (!confirmationData.status) {
            throw new Error('Estado requerido en datos de confirmación');
        }
        if (confirmationData.status !== 'completed') {
            throw new Error(`Estado inválido: ${confirmationData.status}. Se esperaba 'completed'`);
        }
        if (!confirmationData.completedAt) {
            throw new Error('Fecha de completación requerida');
        }
        this.validateDateFormat(confirmationData.completedAt);
        console.log('Datos de confirmación validados correctamente');
    }
    /**
     * Valida el estado actual de la cita
     */
    validateAppointmentStatus(appointment) {
        if (appointment.status === 'completed') {
            console.warn('La cita ya está marcada como completada');
            throw new Error('La cita ya fue completada anteriormente');
        }
        if (appointment.status === 'cancelled') {
            throw new Error('No se puede completar una cita cancelada');
        }
        if (appointment.status !== 'pending') {
            throw new Error(`Estado inválido para completar: ${appointment.status}`);
        }
    }
    /**
     * Valida formato de fecha
     */
    validateDateFormat(dateString) {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            throw new Error('Formato de fecha inválido');
        }
    }
}
exports.CompletionValidator = CompletionValidator;
