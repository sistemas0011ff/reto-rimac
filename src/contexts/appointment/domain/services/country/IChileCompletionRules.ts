import { AppointmentEntity } from "../../entities/AppointmentEntity";

/**
 * Interface para las reglas de completación específicas de Chile
 */
export interface IChileCompletionRules {
    /**
     * Aplica las reglas de completación para citas de Chile
     * @param appointment Entidad de la cita completada en Chile
     */
    apply(appointment: AppointmentEntity): Promise<void>;
}   