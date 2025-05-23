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
exports.AppointmentService = void 0;
const AppointmentEntity_1 = require("../../domain/entities/AppointmentEntity");
const NotificationTypes_1 = require("../../domain/types/NotificationTypes");
const AppointmentDto_1 = require("../dtos/AppointmentDto");
/**
 * Servicio de aplicación para la gestión de citas médicas
 * Implementa toda la lógica de negocio, validaciones y orquestación
 */
class AppointmentService {
    constructor(appointmentRepository, notificationService, eventBusService, idGenerator) {
        this.appointmentRepository = appointmentRepository;
        this.notificationService = notificationService;
        this.eventBusService = eventBusService;
        this.idGenerator = idGenerator;
    }
    /**
    * Crea una nueva cita médica con todas las validaciones necesarias
    * @param requestDto Datos de la cita (sin ID)
    * @returns El ID de la cita creada
    */
    createAppointment(requestDto) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const appointment = AppointmentEntity_1.AppointmentEntity.createPending(appointmentId, requestDto.insuredId, scheduleIdNumber, requestDto.countryISO);
            try {
                // 1. Persistir en DynamoDB
                console.log('Guardando cita en DynamoDB...');
                yield this.appointmentRepository.save(appointment);
                console.log('Cita guardada exitosamente en DynamoDB');
                // 2. Enviar notificación por SNS según el país
                console.log('Enviando notificación por SNS...');
                yield this.sendAppointmentNotification(appointment);
                console.log('Notificación enviada exitosamente');
                // 3. Publicar evento de dominio en EventBridge
                console.log('Publicando evento en EventBridge...');
                yield this.publishAppointmentCreatedEvent(appointment);
                console.log('Evento publicado exitosamente');
                console.log('=== CITA CREADA EXITOSAMENTE ===');
                return appointmentId;
            }
            catch (error) {
                console.error('Error en la creación de cita:', error);
                throw new Error(`Error al crear la cita: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Valida TODOS los datos de entrada según las reglas de negocio
     * @throws Error si alguna validación falla
     */
    validateAppointmentRequest(requestDto) {
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
    getAppointmentsByInsured(requestDto) {
        return __awaiter(this, void 0, void 0, function* () {
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
                const appointments = yield this.appointmentRepository.findByInsuredId(requestDto.insuredId);
                console.log('Citas encontradas:', {
                    insuredId: requestDto.insuredId,
                    count: appointments.length
                });
                // Mapear entidades de dominio a DTOs
                return appointments.map(appointment => new AppointmentDto_1.AppointmentDto(appointment.id, appointment.insuredId, appointment.scheduleId, appointment.countryISO, appointment.status, appointment.createdAt));
            }
            catch (error) {
                console.error('Error al obtener citas:', error);
                throw new Error(`Error al consultar citas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Actualiza el estado de una cita existente
     * @param appointmentId ID de la cita
     * @param status Nuevo estado (pending, completed, cancelled)
     */
    updateAppointmentStatus(appointmentId, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Actualizando estado de cita:', { appointmentId, status });
                // Buscar la cita existente
                const appointment = yield this.appointmentRepository.findById(appointmentId);
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
                yield this.appointmentRepository.save(updatedAppointment);
                console.log('Estado actualizado exitosamente');
                // Si se completó la cita, publicar evento específico
                if (status === 'completed') {
                    yield this.publishAppointmentCompletedEvent(updatedAppointment);
                    console.log('Evento de cita completada publicado');
                }
            }
            catch (error) {
                console.error('Error al actualizar estado de cita:', error);
                throw new Error(`Error al actualizar cita: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Envía una notificación sobre la cita creada al SNS correspondiente
     * @param appointment Entidad de cita
     */
    sendAppointmentNotification(appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Determinar el canal según el país
                const channel = appointment.isPeru()
                    ? NotificationTypes_1.NotificationChannel.PERU
                    : NotificationTypes_1.NotificationChannel.CHILE;
                console.log('Canal de notificación seleccionado:', {
                    channel,
                    countryISO: appointment.countryISO
                });
                // Preparar contenido de la notificación
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
                // Enviar a SNS con metadatos adicionales
                yield this.notificationService.send(channel, notificationContent, {
                    priority: 'normal',
                    category: 'appointment',
                    countryISO: appointment.countryISO
                });
            }
            catch (error) {
                console.error('Error al enviar notificación:', error);
                throw new Error(`Error al enviar notificación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Publica un evento de creación de cita en EventBridge
     * @param appointment Entidad de cita creada
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
    /**
     * Publica un evento de cita completada en EventBridge
     * @param appointment Entidad de cita completada
     */
    publishAppointmentCompletedEvent(appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            const event = this.eventBusService.createAppointmentCompletedEvent({
                appointmentId: appointment.id,
                status: appointment.status,
                completedAt: new Date().toISOString()
            });
            yield this.eventBusService.publish(event);
        });
    }
}
exports.AppointmentService = AppointmentService;
