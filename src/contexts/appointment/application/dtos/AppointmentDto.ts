export class AppointmentDto {
    constructor(
        public readonly id: string,
        public readonly insuredId: string,
        public readonly scheduleId: number,
        public readonly countryISO: string,
        public readonly status: string,
        public readonly createdAt: string
    ) {}
}