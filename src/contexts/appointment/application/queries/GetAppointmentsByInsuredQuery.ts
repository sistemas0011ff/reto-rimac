/**
 * Consulta para obtener citas por ID de asegurado
 */
export class GetAppointmentsByInsuredQuery {
    constructor(
        public readonly insuredId: string
    ) {}
}