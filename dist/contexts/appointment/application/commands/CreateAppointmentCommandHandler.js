"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAppointmentCommandHandler = void 0;
const CreateAppointmentCommand_1 = require("./CreateAppointmentCommand");
const CreateAppointmentCommandResult_1 = require("./CreateAppointmentCommandResult");
const AppointmentEntity_1 = require("../../domain/entities/AppointmentEntity");
const NotificationTypes_1 = require("../../domain/types/NotificationTypes");
/**
 * Handler para procesar comandos de creación de citas médicas
 * Responsable de generar el ID y orquestar el proceso
 */
class CreateAppointmentCommandHandler {
    /**
     * @param appointmentRepository Repositorio de citas
     * @param notificationService Servicio de notificaciones
     * @param eventBusService Servicio de bus de eventos
     * @param idGenerator Generador de IDs único
     */
    constructor(appointmentRepository, notificationService, eventBusService, idGenerator) {
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
        this.eventBusService = eventBusService;
        this.idGenerator = idGenerator;
    }
    /**
     * Maneja el comando de creación de citas
     * @param command Comando a procesar
     * @returns Resultado de la operación
     */
    handle(command) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const appointmentId = command.id || this.idGenerator.generate();
                const commandWithId = command.id ? command : CreateAppointmentCommand_1.CreateAppointmentCommand.create(appointmentId, command.insuredId, command.scheduleId, command.countryISO);
                // Validar comando
                commandWithId.validate();
                // Crear entidad de dominio
                const appointment = AppointmentEntity_1.AppointmentEntity.createPending(appointmentId, commandWithId.insuredId, commandWithId.scheduleId, commandWithId.countryISO);
                // Guardar en repositorio
                yield this.appointmentRepository.save(appointment);
                // Enviar notificación
                yield this.sendAppointmentNotification(appointment);
                // Publicar evento de dominio
                yield this.publishAppointmentCreatedEvent(appointment);
                // Retornar resultado exitoso
                return CreateAppointmentCommandResult_1.CreateAppointmentCommandResult.success(appointment);
            }
            catch (error) {
                console.error('Error al crear cita:', error);
                // Crear una entidad temporal para el resultado de error
                const failedAppointment = new AppointmentEntity_1.AppointmentEntity('error-id', command.insuredId, command.scheduleId, command.countryISO, 'error', new Date().toISOString());
                return CreateAppointmentCommandResult_1.CreateAppointmentCommandResult.failure(failedAppointment);
            }
        });
    }
    /**
     * Envía una notificación sobre la cita
     */
    sendAppointmentNotification(appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            const channel = appointment.isPeru()
                ? NotificationTypes_1.NotificationChannel.PERU
                : NotificationTypes_1.NotificationChannel.CHILE;
            const notificationContent = {
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
            yield this.notificationService.send(channel, notificationContent, {
                priority: 'normal',
                category: 'appointment'
            });
        });
    }
    /**
     * Publica un evento de creación de cita
     */
    publishAppointmentCreatedEvent(appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            const eventData = {
                appointmentId: appointment.id,
                insuredId: appointment.insuredId,
                scheduleId: appointment.scheduleId,
                countryISO: appointment.countryISO,
                status: appointment.status,
                createdAt: appointment.createdAt
            };
            const event = this.eventBusService.createAppointmentCreatedEvent(eventData);
            yield this.eventBusService.publish(event);
        });
    }
}
exports.CreateAppointmentCommandHandler = CreateAppointmentCommandHandler;
