import { ICommandHandler } from "../../../shared/cqrs/ICommandHandler";
import { CreateAppointmentCommand } from "./CreateAppointmentCommand";
import { CreateAppointmentCommandResult } from "./CreateAppointmentCommandResult";
import { AppointmentEntity } from "../../domain/entities/AppointmentEntity";
import { IAppointmentRepository } from "../../domain/interfaces/IAppointmentRepository";
import { INotificationService } from "../../domain/ports/INotificationService";
import { NotificationChannel, NotificationContent } from "../../domain/types/NotificationTypes";
import { IEventBusService } from "../../domain/ports/IEventBusService";
import { AppointmentCreatedEventData } from "../../domain/events/AppointmentEvents"; 
import { IIdGenerator } from "../../domain/services/IIdGenerator";

/**
 * Handler para procesar comandos de creación de citas médicas
 * Responsable de generar el ID y orquestar el proceso
 */
export class CreateAppointmentCommandHandler implements ICommandHandler<CreateAppointmentCommand, CreateAppointmentCommandResult> {
    /**
     * @param appointmentRepository Repositorio de citas
     * @param notificationService Servicio de notificaciones
     * @param eventBusService Servicio de bus de eventos
     * @param idGenerator Generador de IDs único
     */
    constructor(
        private appointmentRepository: IAppointmentRepository,
        private notificationService: INotificationService,
        private eventBusService: IEventBusService,
        private idGenerator: IIdGenerator
    ) {}
    
    /**
     * Maneja el comando de creación de citas
     * @param command Comando a procesar 
     * @returns Resultado de la operación
     */
    async handle(command: CreateAppointmentCommand): Promise<CreateAppointmentCommandResult> {
        try {
            
            const appointmentId = command.id || this.idGenerator.generate();
            
            const commandWithId = command.id ? command : CreateAppointmentCommand.create(
                appointmentId,
                command.insuredId,
                command.scheduleId,
                command.countryISO
            );
            
            // Validar comando
            commandWithId.validate();
            
            // Crear entidad de dominio
            const appointment = AppointmentEntity.createPending(
                appointmentId,
                commandWithId.insuredId,
                commandWithId.scheduleId,
                commandWithId.countryISO
            );
            
            // Guardar en repositorio
            await this.appointmentRepository.save(appointment);
            
            // Enviar notificación
            await this.sendAppointmentNotification(appointment);
            
            // Publicar evento de dominio
            await this.publishAppointmentCreatedEvent(appointment);
            
            // Retornar resultado exitoso
            return CreateAppointmentCommandResult.success(appointment);
            
        } catch (error) {
            console.error('Error al crear cita:', error);
            
            // Crear una entidad temporal para el resultado de error
            const failedAppointment = new AppointmentEntity(
                'error-id',
                command.insuredId,
                command.scheduleId,
                command.countryISO,
                'error',
                new Date().toISOString()
            );
             
            return CreateAppointmentCommandResult.failure(failedAppointment);
        }
    }
    
    /**
     * Envía una notificación sobre la cita
     */
    private async sendAppointmentNotification(appointment: AppointmentEntity): Promise<void> {
        const channel = appointment.isPeru() 
            ? NotificationChannel.PERU 
            : NotificationChannel.CHILE;
            
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
        
        await this.notificationService.send(
            channel,
            notificationContent,
            { 
                priority: 'normal',
                category: 'appointment'
            }
        );
    }
    
    /**
     * Publica un evento de creación de cita
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
}