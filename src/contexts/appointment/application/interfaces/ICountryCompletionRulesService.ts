import { AppointmentEntity } from "../../domain/entities/AppointmentEntity";

/**
 * Interface para el servicio que aplica reglas de completación según el país
 */
export interface ICountryCompletionRulesService {
    /**
     * Aplica las reglas de completación específicas del país de la cita
     * @param appointment Entidad de la cita completada
     */
    applyCompletionRules(appointment: AppointmentEntity): Promise<void>;
}
