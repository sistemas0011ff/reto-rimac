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
exports.ChileAppointmentProcessor = void 0;
const promise_1 = require("mysql2/promise");
/**
 * Procesador de citas específico para Chile
 */
class ChileAppointmentProcessor {
    constructor(eventBusService, dbConfig) {
        this.eventBusService = eventBusService;
        this.dbConfig = dbConfig;
        this.connection = null;
    }
    getConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.connection) {
                console.log('Creando nueva conexión a base de datos de Chile...');
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
            console.log('Iniciando procesamiento de cita en base de datos MySQL de Chile:', {
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
                    console.log('Insertando nueva cita en base de datos MySQL de Chile');
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
                        'CL',
                        appointmentData.status,
                        new Date(appointmentData.createdAt)
                    ]);
                }
                console.log('Cita procesada correctamente en base de datos MySQL de Chile:', appointmentData.id);
            }
            catch (error) {
                console.error('Error al procesar cita en MySQL de Chile:', error);
                throw new Error(`Error al procesar cita en base de datos de Chile: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    sendConfirmation(appointmentData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            console.log('=== INICIANDO ENVÍO DE CONFIRMACIÓN - CHILE ===');
            console.log('ChileAppointmentProcessor - Enviando confirmación a EventBridge para la cita:', appointmentData.id);
            console.log('ChileAppointmentProcessor - Información de entorno:', {
                awsRegion: process.env.AWS_REGION,
                eventBusName: process.env.EVENT_BUS_NAME,
                isOffline: process.env.IS_OFFLINE,
                lambdaVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
                lambdaName: process.env.AWS_LAMBDA_FUNCTION_NAME
            });
            try {
                console.log('ChileAppointmentProcessor - Paso 1: Creando datos de confirmación...');
                const confirmationData = {
                    appointmentId: appointmentData.id,
                    status: 'completed',
                    completedAt: new Date().toISOString()
                };
                console.log('ChileAppointmentProcessor - Paso 1 COMPLETADO - Datos de confirmación creados:', {
                    appointmentId: confirmationData.appointmentId,
                    status: confirmationData.status,
                    completedAt: confirmationData.completedAt
                });
                console.log('ChileAppointmentProcessor - Paso 2: Creando evento...');
                const startCreateEvent = Date.now();
                const event = this.eventBusService.createAppointmentCompletedEvent(confirmationData);
                const createEventTime = Date.now() - startCreateEvent;
                console.log('ChileAppointmentProcessor - Paso 2 COMPLETADO - Evento creado en:', createEventTime, 'ms');
                console.log('ChileAppointmentProcessor - Evento creado para EventBridge:', {
                    eventId: event.id,
                    eventType: event.type,
                    eventSource: event.source,
                    eventTimestamp: event.timestamp,
                    dataKeys: Object.keys(event.data || {})
                });
                if (event.type !== 'appointment.completed') {
                    console.error('❌ ERROR CRÍTICO: Tipo de evento incorrecto!', {
                        expected: 'appointment.completed',
                        actual: event.type
                    });
                }
                if (event.source !== 'custom.appointment') {
                    console.error('❌ ERROR CRÍTICO: Source de evento incorrecto!', {
                        expected: 'custom.appointment',
                        actual: event.source
                    });
                }
                console.log('ChileAppointmentProcessor - Paso 3: Iniciando publicación en EventBridge...');
                const startPublish = Date.now();
                const eventId = yield this.eventBusService.publish(event);
                const publishTime = Date.now() - startPublish;
                console.log('ChileAppointmentProcessor - Paso 3 COMPLETADO - Tiempo de publicación:', publishTime, 'ms');
                console.log('✅ ChileAppointmentProcessor - Confirmación enviada exitosamente a EventBridge:', {
                    appointmentId: appointmentData.id,
                    eventId,
                    eventType: event.type,
                    eventSource: event.source,
                    publishTimeMs: publishTime,
                    createEventTimeMs: createEventTime,
                    totalTimeMs: createEventTime + publishTime,
                    success: true
                });
                console.log('=== FIN ENVÍO DE CONFIRMACIÓN - CHILE ===');
                return eventId;
            }
            catch (error) {
                console.error('❌ ChileAppointmentProcessor - ERROR al enviar confirmación a EventBridge:', {
                    appointmentId: appointmentData.id,
                    error: error instanceof Error ? error.message : 'Error desconocido',
                    errorName: error instanceof Error ? error.name : 'Unknown',
                    errorCode: (error === null || error === void 0 ? void 0 : error.code) || 'NO_CODE',
                    stack: error instanceof Error ? (_a = error.stack) === null || _a === void 0 ? void 0 : _a.split('\n').slice(0, 5) : undefined
                });
                console.log('=== ERROR EN ENVÍO DE CONFIRMACIÓN - CHILE ===');
                throw new Error(`Error al enviar confirmación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
}
exports.ChileAppointmentProcessor = ChileAppointmentProcessor;
