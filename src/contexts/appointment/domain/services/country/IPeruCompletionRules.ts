import { AppointmentEntity } from "../../entities/AppointmentEntity";

/**
 * Interface para las reglas de completación específicas de Perú
 */
export interface IPeruCompletionRules {
    /**
     * Aplica las reglas de completación para citas de Perú
     * @param appointment Entidad de la cita completada en Perú
     */
    apply(appointment: AppointmentEntity): Promise<void>;
}
