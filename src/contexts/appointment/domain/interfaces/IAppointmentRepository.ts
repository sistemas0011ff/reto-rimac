import { AppointmentEntity } from '../entities/AppointmentEntity';

/**
 * Interfaz del repositorio para la gestión de citas médicas
 */
export interface IAppointmentRepository {
    /**
     * Guarda una cita en el repositorio
     * @param appointment Entidad de cita a guardar
     */
    save(appointment: AppointmentEntity): Promise<void>;
    
    /**
     * Busca citas por ID de asegurado
     * @param insuredId ID del asegurado
     * @returns Lista de entidades de cita del asegurado
     */
    findByInsuredId(insuredId: string): Promise<AppointmentEntity[]>;
    
    /**
     * Busca una cita por su identificador único
     * @param id Identificador único de la cita
     * @returns La entidad de cita o null si no se encuentra
     */
    findById(id: string): Promise<AppointmentEntity | null>;
    
    /**
     * Actualiza el estado de una cita
     * @param id ID de la cita
     * @param status Nuevo estado
     * @deprecated Use save() con una entidad actualizada en su lugar
     */
    updateStatus(id: string, status: string): Promise<void>;
}