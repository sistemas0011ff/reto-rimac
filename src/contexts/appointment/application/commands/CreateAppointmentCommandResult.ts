import { ICommandResult } from "../../../shared/cqrs/ICommandResult";
import { AppointmentEntity } from "../../domain/entities/AppointmentEntity";

/**
 * Resultado de la creación de una cita médica
 * Implementa la interfaz ICommandResult
 */
export class CreateAppointmentCommandResult implements ICommandResult<boolean, AppointmentEntity> {
    /**
     * @param result Indica si la operación fue exitosa (true) o fallida (false)
     * @param value Entidad de cita resultante
     */
    constructor(
        public readonly result: boolean,
        public readonly value: AppointmentEntity
    ) {}
    
    /**
     * Crea un resultado exitoso
     * @param appointment Entidad de cita creada
     */
    static success(appointment: AppointmentEntity): CreateAppointmentCommandResult {
        return new CreateAppointmentCommandResult(true, appointment);
    }
    
    /**
     * Crea un resultado fallido
     * @param appointment Entidad de cita con error o parcial
     */
    static failure(appointment: AppointmentEntity): CreateAppointmentCommandResult {
        return new CreateAppointmentCommandResult(false, appointment);
    }
    
    /**
     * Verifica si el resultado es exitoso
     */
    isSuccess(): boolean {
        return this.result === true;
    }
    
    /**
     * Verifica si el resultado es fallido
     */
    isFailure(): boolean {
        return this.result === false;
    }
}