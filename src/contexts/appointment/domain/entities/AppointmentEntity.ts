/**
 * Entidad de dominio que representa una cita médica
 */
export class AppointmentEntity {
    /**
     * @param id Identificador único de la cita
     * @param insuredId Código del asegurado (5 dígitos)
     * @param scheduleId Identificador del espacio para agendar la cita
     * @param countryISO Código ISO del país (PE o CL)
     * @param status Estado de la cita (pending, completed)
     * @param createdAt Fecha de creación de la cita
     */
    constructor(
        public readonly id: string,
        public readonly insuredId: string,
        public readonly scheduleId: number,
        public readonly countryISO: string,
        public readonly status: string,
        public readonly createdAt: string
    ) {}
    
    /**
     * Crea una nueva instancia de cita con estado "pending"
     */
    static createPending(
        id: string,
        insuredId: string,
        scheduleId: number,
        countryISO: string
    ): AppointmentEntity {
        return new AppointmentEntity(
            id,
            insuredId,
            scheduleId,
            countryISO,
            'pending',
            new Date().toISOString()
        );
    }
    
    /**
     * Retorna una nueva instancia de la cita con el estado actualizado
     */
    withStatus(status: string): AppointmentEntity {
        return new AppointmentEntity(
            this.id,
            this.insuredId,
            this.scheduleId,
            this.countryISO,
            status,
            this.createdAt
        );
    }
    
    /**
     * Valida si la cita es para Perú
     */
    isPeru(): boolean {
        return this.countryISO === 'PE';
    }
    
    /**
     * Valida si la cita es para Chile
     */
    isChile(): boolean {
        return this.countryISO === 'CL';
    }
    
    /**
     * Valida si la cita está en estado pendiente
     */
    isPending(): boolean {
        return this.status === 'pending';
    }
    
    /**
     * Valida si la cita está en estado completado
     */
    isCompleted(): boolean {
        return this.status === 'completed';
    }
}