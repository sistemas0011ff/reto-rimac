import { IQueryHandler } from "../../../shared/cqrs/IQueryHandler";
import { GetAppointmentsByInsuredQuery } from "./GetAppointmentsByInsuredQuery";
import { AppointmentDto } from "../dtos/AppointmentDto";
import { IAppointmentRepository } from "../../domain/interfaces/IAppointmentRepository";

/**
 * Handler para procesar consultas de citas por asegurado
 */
export class GetAppointmentsByInsuredQueryHandler implements IQueryHandler<GetAppointmentsByInsuredQuery, AppointmentDto[]> {
    constructor(
        private appointmentRepository: IAppointmentRepository
    ) {}
    
    /**
     * Ejecuta la consulta
     * @param query Consulta a ejecutar
     * @returns Lista de DTOs de citas
     */
    async execute(query: GetAppointmentsByInsuredQuery): Promise<AppointmentDto[]> {
        
        if (!/^\d{5}$/.test(query.insuredId)) {
            throw new Error('El ID del asegurado debe tener exactamente 5 dígitos');
        }
        
        
        const appointments = await this.appointmentRepository.findByInsuredId(query.insuredId);
        
        return appointments.map(appointment => new AppointmentDto(
            appointment.id,
            appointment.insuredId,
            appointment.scheduleId,
            appointment.countryISO,
            appointment.status,
            appointment.createdAt
        ));
    }
}