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
exports.PeruAppointmentService = void 0;
/**
 * Servicio de aplicación específico para procesamiento de citas de Perú
 * Implementa lógicas de negocio específicas del sistema de salud peruano
 */
class PeruAppointmentService {
    constructor(peruProcessor) {
        this.peruProcessor = peruProcessor;
        this.processedCount = 0;
        this.lastProcessedAt = '';
    }
    /**
     * Procesa un mensaje de cita médica desde la cola SQS de Perú
     * @param messageBody Cuerpo del mensaje SNS recibido desde SQS
     */
    processMessage(messageBody) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('=== INICIO PROCESAMIENTO PERÚ ===');
                console.log('PeruAppointmentService - Procesando mensaje de cita:', {
                    messageType: messageBody.Type,
                    messageId: messageBody.MessageId,
                    timestamp: messageBody.Timestamp
                });
                // Validar que el mensaje viene de SNS
                this.validateSNSMessage(messageBody);
                // Extraer y validar datos de la cita del mensaje SNS
                const appointmentData = this.extractAppointmentData(messageBody);
                // Validar que la cita es para Perú
                this.validatePeruAppointment(appointmentData);
                console.log('PeruAppointmentService - Datos de cita validados para Perú:', {
                    appointmentId: appointmentData.id,
                    insuredId: appointmentData.insuredId,
                    countryISO: appointmentData.countryISO,
                    scheduleId: appointmentData.scheduleId
                });
                // Aplicar lógicas específicas de Perú antes del procesamiento
                yield this.applyPeruSpecificLogic(appointmentData);
                // Procesar la cita en el sistema de Perú (MySQL)
                yield this.peruProcessor.processAppointment(appointmentData);
                // Enviar confirmación a EventBridge
                const eventId = yield this.peruProcessor.sendConfirmation(appointmentData);
                // Actualizar métricas
                this.processedCount++;
                this.lastProcessedAt = new Date().toISOString();
                console.log('PeruAppointmentService - Procesamiento completado exitosamente:', {
                    appointmentId: appointmentData.id,
                    eventId,
                    country: 'Peru',
                    totalProcessed: this.processedCount
                });
                console.log('=== FIN PROCESAMIENTO PERÚ ===');
            }
            catch (error) {
                console.error('PeruAppointmentService - Error en el procesamiento:', error);
                // Log específico para errores de Perú
                console.error('=== ERROR PROCESAMIENTO PERÚ ===', {
                    error: error instanceof Error ? error.message : 'Error desconocido',
                    messageId: messageBody.MessageId,
                    timestamp: new Date().toISOString()
                });
                throw new Error(`Error en PeruAppointmentService: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Valida que el mensaje recibido sea un mensaje SNS válido
     * @param messageBody Cuerpo del mensaje a validar
     */
    validateSNSMessage(messageBody) {
        if (!messageBody.Type || messageBody.Type !== 'Notification') {
            throw new Error('Mensaje inválido: No es una notificación SNS válida');
        }
        if (!messageBody.Message) {
            throw new Error('Mensaje inválido: No contiene datos de cita');
        }
        if (!messageBody.MessageId) {
            throw new Error('Mensaje inválido: No tiene MessageId');
        }
        console.log('PeruAppointmentService - Mensaje SNS validado correctamente');
    }
    /**
     * Extrae y parsea los datos de la cita desde el mensaje SNS
     * @param messageBody Cuerpo del mensaje SNS
     * @returns Datos de la cita parseados
     */
    extractAppointmentData(messageBody) {
        try {
            const appointmentData = JSON.parse(messageBody.Message);
            // Validar campos obligatorios
            if (!appointmentData.id) {
                throw new Error('Datos inválidos: ID de cita requerido');
            }
            if (!appointmentData.insuredId) {
                throw new Error('Datos inválidos: ID de asegurado requerido');
            }
            if (!appointmentData.scheduleId) {
                throw new Error('Datos inválidos: ID de horario requerido');
            }
            if (!appointmentData.countryISO) {
                throw new Error('Datos inválidos: Código de país requerido');
            }
            if (!appointmentData.status) {
                throw new Error('Datos inválidos: Estado de cita requerido');
            }
            if (!appointmentData.createdAt) {
                throw new Error('Datos inválidos: Fecha de creación requerida');
            }
            console.log('PeruAppointmentService - Datos de cita extraídos y validados');
            return appointmentData;
        }
        catch (parseError) {
            console.error('PeruAppointmentService - Error al parsear datos de cita:', parseError);
            throw new Error(`Error al parsear datos de cita: ${parseError instanceof Error ? parseError.message : 'Error de parsing'}`);
        }
    }
    /**
     * Valida que la cita sea específicamente para Perú
     * @param appointmentData Datos de la cita a validar
     */
    validatePeruAppointment(appointmentData) {
        if (appointmentData.countryISO !== 'PE') {
            throw new Error(`Cita no corresponde a Perú. País recibido: ${appointmentData.countryISO}`);
        }
        // Validar formato de insuredId para Perú (5 dígitos)
        if (!/^\d{5}$/.test(appointmentData.insuredId)) {
            throw new Error(`ID de asegurado inválido para Perú: ${appointmentData.insuredId}. Debe tener 5 dígitos`);
        }
        // Validar que el scheduleId sea válido
        const scheduleIdNum = typeof appointmentData.scheduleId === 'string'
            ? parseInt(appointmentData.scheduleId, 10)
            : appointmentData.scheduleId;
        if (isNaN(scheduleIdNum) || scheduleIdNum <= 0) {
            throw new Error(`ID de horario inválido para Perú: ${appointmentData.scheduleId}`);
        }
        console.log('PeruAppointmentService - Cita validada para Perú');
    }
    /**
     * Aplica lógicas específicas de negocio para Perú antes del procesamiento
     * @param appointmentData Datos de la cita
     */
    applyPeruSpecificLogic(appointmentData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('PeruAppointmentService - Aplicando lógicas específicas de Perú...');
            try {
                // Lógica específica 1: Validar horarios de atención para Perú
                yield this.validatePeruBusinessHours(appointmentData);
                // Lógica específica 2: Aplicar reglas de asegurados peruanos
                yield this.applyPeruInsuranceRules(appointmentData);
                // Lógica específica 3: Verificar disponibilidad de especialistas en Perú
                yield this.checkPeruSpecialistAvailability(appointmentData);
                console.log('PeruAppointmentService - Lógicas específicas de Perú aplicadas exitosamente');
            }
            catch (error) {
                console.error('PeruAppointmentService - Error en lógicas específicas de Perú:', error);
                throw new Error(`Error en lógicas de Perú: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Valida horarios de atención específicos para Perú
     * @param appointmentData Datos de la cita
     */
    validatePeruBusinessHours(appointmentData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Obtener hora actual en zona horaria de Perú (UTC-5)
            const peruTime = new Date();
            peruTime.setHours(peruTime.getHours() - 5); // Ajustar a UTC-5
            const hour = peruTime.getHours();
            const dayOfWeek = peruTime.getDay(); // 0 = Domingo, 6 = Sábado
            console.log('PeruAppointmentService - Validando horarios de Perú:', {
                hora: hour,
                diaSemana: dayOfWeek,
                appointmentId: appointmentData.id
            });
            // Validar horarios de atención en Perú: Lunes a Viernes 8:00 - 18:00, Sábados 8:00 - 14:00
            if (dayOfWeek === 0) { // Domingo
                console.warn('PeruAppointmentService - Cita procesada en domingo (fuera de horario normal)');
            }
            else if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lunes a Viernes
                if (hour < 8 || hour >= 18) {
                    console.warn('PeruAppointmentService - Cita procesada fuera de horario laboral (8:00-18:00)');
                }
            }
            else if (dayOfWeek === 6) { // Sábado
                if (hour < 8 || hour >= 14) {
                    console.warn('PeruAppointmentService - Cita procesada fuera de horario de sábado (8:00-14:00)');
                }
            }
            console.log('PeruAppointmentService - Validación de horarios de Perú completada');
        });
    }
    /**
     * Aplica reglas específicas de seguros médicos en Perú
     * @param appointmentData Datos de la cita
     */
    applyPeruInsuranceRules(appointmentData) {
        return __awaiter(this, void 0, void 0, function* () {
            // Lógica específica para validar tipos de seguro en Perú
            const insuredId = appointmentData.insuredId;
            let insuranceType;
            if (insuredId.startsWith('1')) {
                insuranceType = 'EsSalud';
            }
            else if (insuredId.startsWith('2')) {
                insuranceType = 'SIS';
            }
            else if (insuredId.startsWith('3')) {
                insuranceType = 'Privado';
            }
            else {
                insuranceType = 'Otro';
            }
            console.log('PeruAppointmentService - Tipo de seguro identificado:', {
                insuredId,
                insuranceType,
                appointmentId: appointmentData.id
            });
            // Aplicar validaciones específicas según tipo de seguro
            switch (insuranceType) {
                case 'EsSalud':
                    yield this.validateEsSaludRules(appointmentData);
                    break;
                case 'SIS':
                    yield this.validateSISRules(appointmentData);
                    break;
                case 'Privado':
                    yield this.validatePrivateInsuranceRules(appointmentData);
                    break;
                default:
                    console.log('PeruAppointmentService - Procesando con reglas generales');
            }
        });
    }
    /**
     * Valida reglas específicas de EsSalud
     */
    validateEsSaludRules(appointmentData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('PeruAppointmentService - Aplicando reglas de EsSalud para:', appointmentData.id);
            // Por ejemplo: verificar vigencia, copagos, etc.
            // Simulación de validación
            const isVigente = true;
            if (!isVigente) {
                throw new Error('Asegurado EsSalud no vigente');
            }
        });
    }
    /**
     * Valida reglas específicas del SIS
     */
    validateSISRules(appointmentData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('PeruAppointmentService - Aplicando reglas del SIS para:', appointmentData.id);
            // Por ejemplo: verificar afiliación, cobertura, etc.
            // Simulación de validación
            const tieneCobertura = true;
            if (!tieneCobertura) {
                throw new Error('Asegurado SIS sin cobertura para esta especialidad');
            }
        });
    }
    /**
     * Valida reglas de seguros privados
     */
    validatePrivateInsuranceRules(appointmentData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('PeruAppointmentService - Aplicando reglas de seguro privado para:', appointmentData.id);
            // Por ejemplo: verificar póliza, deducibles, etc.
            // Simulación de validación
            const polizaActiva = true;
            if (!polizaActiva) {
                throw new Error('Póliza de seguro privado no activa');
            }
        });
    }
    /**
     * Verifica disponibilidad de especialistas en Perú
     * @param appointmentData Datos de la cita
     */
    checkPeruSpecialistAvailability(appointmentData) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('PeruAppointmentService - Verificando disponibilidad de especialistas en Perú...');
            // Simular verificación de disponibilidad
            const scheduleId = appointmentData.scheduleId;
            const scheduleIdNum = typeof scheduleId === 'string' ? parseInt(scheduleId, 10) : scheduleId;
            if (scheduleIdNum >= 1000 && scheduleIdNum < 2000) {
                console.log('PeruAppointmentService - Horario de especialista general disponible');
            }
            else if (scheduleIdNum >= 2000 && scheduleIdNum < 3000) {
                console.log('PeruAppointmentService - Horario de especialista premium disponible');
            }
            else if (scheduleIdNum >= 3000) {
                console.log('PeruAppointmentService - Horario de especialista de alta complejidad');
            }
            else {
                console.log('PeruAppointmentService - Horario estándar disponible');
            }
            console.log('PeruAppointmentService - Verificación de disponibilidad completada');
        });
    }
    /**
     * Obtiene estadísticas específicas de procesamiento en Perú
     */
    getProcessingStats() {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                country: 'Peru',
                totalProcessed: this.processedCount,
                lastProcessedAt: this.lastProcessedAt || 'Nunca',
                status: 'healthy'
            };
        });
    }
    /**
     * Verifica la salud del servicio de Perú
     */
    healthCheck() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('PeruAppointmentService - Verificando salud del servicio...');
                // En una implementación real, verificarías:
                // - Conexión a MySQL de Perú
                // - Conexión a EventBridge
                // - Estado de recursos críticos
                return {
                    service: 'PeruAppointmentService',
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    dependencies: {
                        database: 'connected',
                        eventBridge: 'connected'
                    }
                };
            }
            catch (error) {
                console.error('PeruAppointmentService - Error en health check:', error);
                return {
                    service: 'PeruAppointmentService',
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    dependencies: {
                        database: 'disconnected',
                        eventBridge: 'disconnected'
                    }
                };
            }
        });
    }
}
exports.PeruAppointmentService = PeruAppointmentService;
