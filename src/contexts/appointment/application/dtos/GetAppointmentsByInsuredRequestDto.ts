/**
 * DTO para la solicitud de consulta de citas por asegurado
 * Usado en la capa de aplicación para recibir parámetros del handler
 */
export class GetAppointmentsByInsuredRequestDto {
    /**
     * Constructor del DTO
     * @param insuredId ID del asegurado (5 dígitos)
     */
    constructor(
        public readonly insuredId: string
    ) {}
}