"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAppointmentRequestDto = void 0;
/**
 * DTO para solicitar la creación de una cita médica
 */
class CreateAppointmentRequestDto {
    constructor(insuredId, scheduleId, countryISO) {
        this.insuredId = insuredId;
        this.scheduleId = scheduleId;
        this.countryISO = countryISO;
    }
}
exports.CreateAppointmentRequestDto = CreateAppointmentRequestDto;
