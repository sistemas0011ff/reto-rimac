"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAppointmentCommandResult = void 0;
/**
 * Resultado de la creación de una cita médica
 * Implementa la interfaz ICommandResult
 */
class CreateAppointmentCommandResult {
    /**
     * @param result Indica si la operación fue exitosa (true) o fallida (false)
     * @param value Entidad de cita resultante
     */
    constructor(result, value) {
        this.result = result;
        this.value = value;
    }
    /**
     * Crea un resultado exitoso
     * @param appointment Entidad de cita creada
     */
    static success(appointment) {
        return new CreateAppointmentCommandResult(true, appointment);
    }
    /**
     * Crea un resultado fallido
     * @param appointment Entidad de cita con error o parcial
     */
    static failure(appointment) {
        return new CreateAppointmentCommandResult(false, appointment);
    }
    /**
     * Verifica si el resultado es exitoso
     */
    isSuccess() {
        return this.result === true;
    }
    /**
     * Verifica si el resultado es fallido
     */
    isFailure() {
        return this.result === false;
    }
}
exports.CreateAppointmentCommandResult = CreateAppointmentCommandResult;
