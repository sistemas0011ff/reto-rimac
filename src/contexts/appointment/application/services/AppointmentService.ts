import { AppointmentEntity } from '../../domain/entities/AppointmentEntity';
import { IAppointmentRepository } from '../../domain/interfaces/IAppointmentRepository';
import { INotificationService } from '../../domain/ports/INotificationService';
import { IEventBusService } from '../../domain/ports/IEventBusService';
import { NotificationChannel, NotificationContent } from '../../domain/types/NotificationTypes';
import { AppointmentCreatedEventData } from '../../domain/events/AppointmentEvents';
import { AppointmentDto } from '../dtos/AppointmentDto';
import { CreateAppointmentRequestDto } from '../dtos/CreateAppointmentRequestDto';
import { IAppointmentService } from '../interfaces/IAppointmentService';
import { GetAppointmentsByInsuredRequestDto } from '../dtos/GetAppointmentsByInsuredRequestDto';
import { IIdGenerator } from '../../domain/services/IIdGenerator';

/**
 * Servicio de aplicación para la gestión de citas médicas
 * Implementa toda la lógica de negocio, validaciones y orquestación
 */
export class AppointmentService implements IAppointmentService {
    constructor(
        private appointmentRepository: IAppointmentRepository,
        private notificationService: INotificationService,
        private eventBusService: IEventBusService,
        private idGenerator: IIdGenerator
    ) {}
    
     
     /**
     * Crea una nueva cita médica con todas las validaciones necesarias
     * @param requestDto Datos de la cita (sin ID)
     * @returns El ID de la cita creada
     */
    async createAppointment(requestDto: CreateAppointmentRequestDto): Promise<string> {
        console.log('=== INICIO CREACIÓN DE CITA ===');
        console.log('Datos recibidos:', {
            insuredId: requestDto.insuredId,
            scheduleId: requestDto.scheduleId,
            countryISO: requestDto.countryISO
        });
         
        this.validateAppointmentRequest(requestDto);
         
        const appointmentId = this.idGenerator.generate(); 
        
        // Convertir scheduleId a número si es string
        const scheduleIdNumber = typeof requestDto.scheduleId === 'string' 
            ? parseInt(requestDto.scheduleId, 10) 
            : requestDto.scheduleId;
        
        // Crear entidad de dominio con estado inicial 'pending'
        const appointment = AppointmentEntity.createPending(
            appointmentId,
            requestDto.insuredId,
            scheduleIdNumber,
            requestDto.countryISO
        );
        
        try {
            // 1. Persistir en DynamoDB
            console.log('Guardando cita en DynamoDB...');
            await this.appointmentRepository.save(appointment);
            console.log('Cita guardada exitosamente en DynamoDB');
            
            // 2. Enviar notificación por SNS según el país
            console.log('Enviando notificación por SNS...');
            await this.sendAppointmentNotification(appointment);
            console.log('Notificación enviada exitosamente');
            
            // 3. Publicar evento de dominio en EventBridge
            console.log('Publicando evento en EventBridge...');
            await this.publishAppointmentCreatedEvent(appointment);
            console.log('Evento publicado exitosamente');
            
            console.log('=== CITA CREADA EXITOSAMENTE ===');
            return appointmentId;
            
        } catch (error) {
            console.error('Error en la creación de cita:', error);
            throw new Error(`Error al crear la cita: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    
    
    /**
     * Valida TODOS los datos de entrada según las reglas de negocio
     * @throws Error si alguna validación falla
     */
    private validateAppointmentRequest(requestDto: CreateAppointmentRequestDto): void {
        // Validar presencia de campos requeridos
        if (!requestDto.insuredId) {
            throw new Error('Error de validación: El campo insuredId es requerido');
        }
        
        if (!requestDto.scheduleId) {
            throw new Error('Error de validación: El campo scheduleId es requerido');
        }
        
        if (!requestDto.countryISO) {
            throw new Error('Error de validación: El campo countryISO es requerido');
        }
        
        // Validar formato del insuredId (exactamente 5 dígitos)
        if (!/^\d{5}$/.test(requestDto.insuredId)) {
            throw new Error('Error de validación: El ID del asegurado debe tener exactamente 5 dígitos');
        }
        
        // Validar que scheduleId sea un número positivo
        const scheduleIdNumber = typeof requestDto.scheduleId === 'string' 
            ? parseInt(requestDto.scheduleId, 10) 
            : requestDto.scheduleId;
            
        if (isNaN(scheduleIdNumber) || scheduleIdNumber <= 0) {
            throw new Error('Error de validación: El ID del espacio debe ser un número positivo');
        }
        
        // Validar que countryISO sea PE o CL únicamente
        if (requestDto.countryISO !== 'PE' && requestDto.countryISO !== 'CL') {
            throw new Error('Error de validación: El código de país debe ser PE o CL');
        }
    }
    
    /**
     * Obtiene todas las citas de un asegurado
     * @param requestDto DTO con el ID del asegurado
     * @returns Lista de citas del asegurado
     */
    async getAppointmentsByInsured(requestDto: GetAppointmentsByInsuredRequestDto): Promise<AppointmentDto[]> {
        // Validar el request
        if (!requestDto.insuredId) {
            throw new Error('Error de validación: El ID del asegurado es requerido');
        }
        
        // Validar formato del insuredId
        if (!/^\d{5}$/.test(requestDto.insuredId)) {
            throw new Error('Error de validación: El ID del asegurado debe tener exactamente 5 dígitos');
        }
        
        try {
            console.log('Consultando citas para asegurado:', requestDto.insuredId);
            
            // Buscar en el repositorio
            const appointments = await this.appointmentRepository.findByInsuredId(requestDto.insuredId);
            
            console.log('Citas encontradas:', {
                insuredId: requestDto.insuredId,
                count: appointments.length
            });
            
            // Mapear entidades de dominio a DTOs
            return appointments.map(appointment => new AppointmentDto(
                appointment.id,
                appointment.insuredId,
                appointment.scheduleId,
                appointment.countryISO,
                appointment.status,
                appointment.createdAt
            ));
            
        } catch (error) {
            console.error('Error al obtener citas:', error);
            throw new Error(`Error al consultar citas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    
    /**
     * Actualiza el estado de una cita existente
     * @param appointmentId ID de la cita
     * @param status Nuevo estado (pending, completed, cancelled)
     */
    async updateAppointmentStatus(appointmentId: string, status: string): Promise<void> {
        try {
            console.log('Actualizando estado de cita:', { appointmentId, status });
            
            // Buscar la cita existente
            const appointment = await this.appointmentRepository.findById(appointmentId);
            
            if (!appointment) {
                throw new Error(`No se encontró la cita con ID: ${appointmentId}`);
            }
            
            // Validar estado permitido
            const allowedStatuses = ['pending', 'completed', 'cancelled'];
            if (!allowedStatuses.includes(status)) {
                throw new Error(`Estado no válido: ${status}. Estados permitidos: ${allowedStatuses.join(', ')}`);
            }
            
            // Crear nueva instancia con estado actualizado (inmutabilidad)
            const updatedAppointment = appointment.withStatus(status);
            
            // Persistir cambios
            await this.appointmentRepository.save(updatedAppointment);
            console.log('Estado actualizado exitosamente');
            
            // Si se completó la cita, publicar evento específico
            if (status === 'completed') {
                await this.publishAppointmentCompletedEvent(updatedAppointment);
                console.log('Evento de cita completada publicado');
            }
            
        } catch (error) {
            console.error('Error al actualizar estado de cita:', error);
            throw new Error(`Error al actualizar cita: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    
    /**
     * Envía una notificación sobre la cita creada al SNS correspondiente
     * @param appointment Entidad de cita
     */
    private async sendAppointmentNotification(appointment: AppointmentEntity): Promise<void> {
        try {
            // Determinar el canal según el país
            const channel = appointment.isPeru() 
                ? NotificationChannel.PERU 
                : NotificationChannel.CHILE;
                
            console.log('Canal de notificación seleccionado:', {
                channel,
                countryISO: appointment.countryISO
            });
                
            // Preparar contenido de la notificación
            const notificationContent: NotificationContent = {
                id: appointment.id,
                subject: `Nueva cita médica: ${appointment.id}`,
                body: {
                    id: appointment.id,
                    insuredId: appointment.insuredId,
                    scheduleId: appointment.scheduleId,
                    countryISO: appointment.countryISO,
                    status: appointment.status,
                    createdAt: appointment.createdAt
                },
                timestamp: new Date().toISOString()
            };
            
            // Enviar a SNS con metadatos adicionales
            await this.notificationService.send(
                channel,
                notificationContent,
                { 
                    priority: 'normal',
                    category: 'appointment',
                    countryISO: appointment.countryISO
                }
            );
            
        } catch (error) {
            console.error('Error al enviar notificación:', error);
            throw new Error(`Error al enviar notificación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    
    /**
     * Publica un evento de creación de cita en EventBridge
     * @param appointment Entidad de cita creada
     */
    private async publishAppointmentCreatedEvent(appointment: AppointmentEntity): Promise<void> {
        const eventData: AppointmentCreatedEventData = {
            appointmentId: appointment.id,
            insuredId: appointment.insuredId,
            scheduleId: appointment.scheduleId,
            countryISO: appointment.countryISO,
            status: appointment.status,
            createdAt: appointment.createdAt
        };
        
        const event = this.eventBusService.createAppointmentCreatedEvent(eventData);
        await this.eventBusService.publish(event);
    }
    
    /**
     * Publica un evento de cita completada en EventBridge
     * @param appointment Entidad de cita completada
     */
    private async publishAppointmentCompletedEvent(appointment: AppointmentEntity): Promise<void> {
        const event = this.eventBusService.createAppointmentCompletedEvent({
            appointmentId: appointment.id,
            status: appointment.status,
            completedAt: new Date().toISOString()
        });
        
        await this.eventBusService.publish(event);
    }
}