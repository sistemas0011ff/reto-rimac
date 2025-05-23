import { AppointmentDto } from '../dtos/AppointmentDto';
import { CreateAppointmentRequestDto } from '../dtos/CreateAppointmentRequestDto';
import { GetAppointmentsByInsuredRequestDto } from '../dtos/GetAppointmentsByInsuredRequestDto';

/**
 * Interfaz del servicio de aplicación para la gestión de citas médicas
 */
export interface IAppointmentService {
    /**
     * Crea una nueva cita médica
     * @param requestDto Datos para crear la cita
     * @returns El ID de la cita creada
     */
    createAppointment(requestDto: CreateAppointmentRequestDto): Promise<string>;
    
   
    /**
     * Actualiza el estado de una cita
     * @param appointmentId ID de la cita
     * @param status Nuevo estado de la cita
     */
    updateAppointmentStatus(appointmentId: string, status: string): Promise<void>;

    /**
     * Obtiene todas las citas de un asegurado usando un DTO request
     * @param requestDto DTO con los parámetros de la consulta
     * @returns Lista de DTOs de citas
     */
    getAppointmentsByInsured(requestDto: GetAppointmentsByInsuredRequestDto): Promise<AppointmentDto[]>;
}