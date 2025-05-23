"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAppointmentCommand = exports.SupportedCountries = void 0;
/**
 * Países soportados para citas médicas
 */
var SupportedCountries;
(function (SupportedCountries) {
    SupportedCountries["PERU"] = "PE";
    SupportedCountries["CHILE"] = "CL";
})(SupportedCountries || (exports.SupportedCountries = SupportedCountries = {}));
/**
 * Comando para la creación de una cita médica
 */
class CreateAppointmentCommand {
    /**
     * @param id Identificador único de la cita (debe venir del servicio/handler)
     * @param insuredId Código del asegurado (5 dígitos)
     * @param scheduleId Identificador del espacio para agendar la cita
     * @param countryISO Código ISO del país (PE o CL)
     */
    constructor(id, insuredId, scheduleId, countryISO) {
        this.id = id;
        this.insuredId = insuredId;
        this.scheduleId = scheduleId;
        this.countryISO = countryISO;
        this.createdAt = new Date().toISOString();
    }
    static create(id, insuredId, scheduleId, countryISO) {
        return new CreateAppointmentCommand(id, insuredId, scheduleId, countryISO);
    }
    /**
     * Valida que los datos del comando sean correctos
     * @throws Error si los datos son inválidos
     */
    validate() {
        // Validar que el ID no sea vacío
        if (!this.id) {
            throw new Error('El ID de la cita es requerido');
        }
        // Validar que el insuredId tenga 5 dígitos
        if (!/^\d{5}$/.test(this.insuredId)) {
            throw new Error('El ID del asegurado debe tener exactamente 5 dígitos');
        }
        // Validar que scheduleId sea un número positivo
        if (typeof this.scheduleId !== 'number' || this.scheduleId <= 0) {
            throw new Error('El ID del espacio debe ser un número positivo');
        }
        // Validar que countryISO sea PE o CL
        if (this.countryISO !== SupportedCountries.PERU && this.countryISO !== SupportedCountries.CHILE) {
            throw new Error('El código de país debe ser PE o CL');
        }
    }
    /**
     * Verifica si la cita es para Perú
     */
    isPeru() {
        return this.countryISO === SupportedCountries.PERU;
    }
    /**
     * Verifica si la cita es para Chile
     */
    isChile() {
        return this.countryISO === SupportedCountries.CHILE;
    }
}
exports.CreateAppointmentCommand = CreateAppointmentCommand;
