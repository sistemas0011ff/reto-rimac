"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentDto = void 0;
class AppointmentDto {
    constructor(id, insuredId, scheduleId, countryISO, status, createdAt) {
        this.id = id;
        this.insuredId = insuredId;
        this.scheduleId = scheduleId;
        this.countryISO = countryISO;
        this.status = status;
        this.createdAt = createdAt;
    }
}
exports.AppointmentDto = AppointmentDto;
