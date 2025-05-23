/**
 * DTO para solicitar la creación de una cita médica
 */
export class CreateAppointmentRequestDto {
    constructor(
        public readonly insuredId: string,
        public readonly scheduleId: string | number,
        public readonly countryISO: string
    ) {}
}