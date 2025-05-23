import { AppointmentData } from '../types/AppointmentTypes';

/**
 * Puerto secundario para procesadores de citas específicos por país
 */
export interface ICountryAppointmentProcessor {
    /**
     * Procesa una cita médica en el sistema del país específico
     * @param appointmentData Datos de la cita a procesar
     */
    processAppointment(appointmentData: AppointmentData): Promise<void>;
    
    /**
     * Envía una confirmación de cita procesada
     * @param appointmentData Datos de la cita procesada
     * @returns ID del evento enviado
     */
    sendConfirmation(appointmentData: AppointmentData): Promise<string>;
}