"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAppointmentsByInsuredRequestDto = void 0;
/**
 * DTO para la solicitud de consulta de citas por asegurado
 * Usado en la capa de aplicación para recibir parámetros del handler
 */
class GetAppointmentsByInsuredRequestDto {
    /**
     * Constructor del DTO
     * @param insuredId ID del asegurado (5 dígitos)
     */
    constructor(insuredId) {
        this.insuredId = insuredId;
    }
}
exports.GetAppointmentsByInsuredRequestDto = GetAppointmentsByInsuredRequestDto;
