"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentEntity = void 0;
/**
 * Entidad de dominio que representa una cita médica
 */
class AppointmentEntity {
    /**
     * @param id Identificador único de la cita
     * @param insuredId Código del asegurado (5 dígitos)
     * @param scheduleId Identificador del espacio para agendar la cita
     * @param countryISO Código ISO del país (PE o CL)
     * @param status Estado de la cita (pending, completed)
     * @param createdAt Fecha de creación de la cita
     */
    constructor(id, insuredId, scheduleId, countryISO, status, createdAt) {
        this.id = id;
        this.insuredId = insuredId;
        this.scheduleId = scheduleId;
        this.countryISO = countryISO;
        this.status = status;
        this.createdAt = createdAt;
    }
    /**
     * Crea una nueva instancia de cita con estado "pending"
     */
    static createPending(id, insuredId, scheduleId, countryISO) {
        return new AppointmentEntity(id, insuredId, scheduleId, countryISO, 'pending', new Date().toISOString());
    }
    /**
     * Retorna una nueva instancia de la cita con el estado actualizado
     */
    withStatus(status) {
        return new AppointmentEntity(this.id, this.insuredId, this.scheduleId, this.countryISO, status, this.createdAt);
    }
    /**
     * Valida si la cita es para Perú
     */
    isPeru() {
        return this.countryISO === 'PE';
    }
    /**
     * Valida si la cita es para Chile
     */
    isChile() {
        return this.countryISO === 'CL';
    }
    /**
     * Valida si la cita está en estado pendiente
     */
    isPending() {
        return this.status === 'pending';
    }
    /**
     * Valida si la cita está en estado completado
     */
    isCompleted() {
        return this.status === 'completed';
    }
}
exports.AppointmentEntity = AppointmentEntity;
