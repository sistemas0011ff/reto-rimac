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
exports.PeruAppointmentProcessor = void 0;
const promise_1 = require("mysql2/promise");
/**
 * Procesador de citas específico para Perú
 */
class PeruAppointmentProcessor {
    constructor(eventBusService, dbConfig) {
        this.eventBusService = eventBusService;
        this.dbConfig = dbConfig;
        this.connection = null;
    }
    getConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connection) {
                console.log('Creando nueva conexión a base de datos de Perú...');
                this.connection = yield (0, promise_1.createConnection)({
                    host: this.dbConfig.host,
                    user: this.dbConfig.user,
                    password: this.dbConfig.password,
                    database: this.dbConfig.database
                });
                console.log('Conexión establecida exitosamente');
            }
            return this.connection;
        });
    }
    processAppointment(appointmentData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Iniciando procesamiento de cita en base de datos MySQL de Perú:', {
                id: appointmentData.id,
                insuredId: appointmentData.insuredId,
                scheduleId: appointmentData.scheduleId
            });
            const conn = yield this.getConnection();
            try {
                // Verificar si la cita ya existe
                const [existingRows] = yield conn.execute('SELECT id FROM appointments WHERE id = ?', [appointmentData.id]);
                if (Array.isArray(existingRows) && existingRows.length > 0) {
                    console.log('La cita ya existe en la base de datos, actualizando estado');
                    // Actualizar la cita existente
                    yield conn.execute(`UPDATE appointments 
                     SET status = ?, 
                         updated_at = NOW() 
                     WHERE id = ?`, [appointmentData.status, appointmentData.id]);
                }
                else {
                    console.log('Insertando nueva cita en base de datos MySQL de Perú');
                    // Insertar la nueva cita
                    yield conn.execute(`INSERT INTO appointments (
                        id, 
                        insured_id, 
                        schedule_id, 
                        country_iso,
                        status, 
                        created_at, 
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW())`, [
                        appointmentData.id,
                        appointmentData.insuredId,
                        appointmentData.scheduleId,
                        'PE',
                        appointmentData.status,
                        new Date(appointmentData.createdAt)
                    ]);
                }
                console.log('Cita procesada correctamente en base de datos MySQL de Perú:', appointmentData.id);
            }
            catch (error) {
                console.error('Error al procesar cita en MySQL de Perú:', error);
                throw new Error(`Error al procesar cita en base de datos de Perú: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    sendConfirmation(appointmentData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Enviando confirmación a EventBridge para la cita:', appointmentData.id);
            try {
                // Crear datos de confirmación
                const confirmationData = {
                    appointmentId: appointmentData.id,
                    status: 'completed',
                    completedAt: new Date().toISOString()
                };
                // Crear evento de confirmación
                const event = this.eventBusService.createAppointmentCompletedEvent(confirmationData);
                // Publicar en EventBridge
                const eventId = yield this.eventBusService.publish(event);
                console.log('Confirmación enviada exitosamente a EventBridge:', {
                    appointmentId: appointmentData.id,
                    eventId
                });
                return eventId;
            }
            catch (error) {
                console.error('Error al enviar confirmación a EventBridge:', error);
                throw new Error(`Error al enviar confirmación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
}
exports.PeruAppointmentProcessor = PeruAppointmentProcessor;
