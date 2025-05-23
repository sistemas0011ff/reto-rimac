"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAppointmentsByInsuredQueryHandler = void 0;
const AppointmentDto_1 = require("../dtos/AppointmentDto");
/**
 * Handler para procesar consultas de citas por asegurado
 */
class GetAppointmentsByInsuredQueryHandler {
    constructor(appointmentRepository) {
        this.appointmentRepository = appointmentRepository;
    }
    /**
     * Ejecuta la consulta
     * @param query Consulta a ejecutar
     * @returns Lista de DTOs de citas
     */
    execute(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!/^\d{5}$/.test(query.insuredId)) {
                throw new Error('El ID del asegurado debe tener exactamente 5 dígitos');
            }
            const appointments = yield this.appointmentRepository.findByInsuredId(query.insuredId);
            return appointments.map(appointment => new AppointmentDto_1.AppointmentDto(appointment.id, appointment.insuredId, appointment.scheduleId, appointment.countryISO, appointment.status, appointment.createdAt));
        });
    }
}
exports.GetAppointmentsByInsuredQueryHandler = GetAppointmentsByInsuredQueryHandler;
