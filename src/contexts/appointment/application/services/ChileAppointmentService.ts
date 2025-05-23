
import { ICountryAppointmentService } from '../interfaces/ICountryAppointmentService';
import { ICountryAppointmentProcessor } from '../../domain/ports/ICountryAppointmentProcessor';
import { AppointmentData, SNSMessageBody } from '../../domain/types/AppointmentTypes';

/**
 * Servicio de aplicación específico para procesamiento de citas de Chile
 * Implementa lógicas de negocio específicas del sistema de salud chileno
 */
export class ChileAppointmentService implements ICountryAppointmentService {
    private processedCount: number = 0;
    private lastProcessedAt: string = '';
    
    constructor(
        private chileProcessor: ICountryAppointmentProcessor
    ) {}
    
    /**
     * Procesa un mensaje de cita médica desde la cola SQS de Chile
     * @param messageBody Cuerpo del mensaje SNS recibido desde SQS
     */
    async processMessage(messageBody: SNSMessageBody): Promise<void> {
        try {
            console.log('=== INICIO PROCESAMIENTO CHILE ===');
            console.log('ChileAppointmentService - Procesando mensaje de cita:', {
                messageType: messageBody.Type,
                messageId: messageBody.MessageId,
                timestamp: messageBody.Timestamp
            });
            
            // Validar que el mensaje viene de SNS
            this.validateSNSMessage(messageBody);
            
            // Extraer y validar datos de la cita del mensaje SNS
            const appointmentData = this.extractAppointmentData(messageBody);
            
            // Validar que la cita es para Chile
            this.validateChileAppointment(appointmentData);
            
            console.log('ChileAppointmentService - Datos de cita validados para Chile:', {
                appointmentId: appointmentData.id,
                insuredId: appointmentData.insuredId,
                countryISO: appointmentData.countryISO,
                scheduleId: appointmentData.scheduleId
            });
            
            // Aplicar lógicas específicas de Chile antes del procesamiento
            await this.applyChileSpecificLogic(appointmentData);
            
            // Procesar la cita en el sistema de Chile (MySQL)
            await this.chileProcessor.processAppointment(appointmentData);
            
            // Enviar confirmación a EventBridge
            const eventId = await this.chileProcessor.sendConfirmation(appointmentData);
            
            // Actualizar métricas
            this.processedCount++;
            this.lastProcessedAt = new Date().toISOString();
            
            console.log('ChileAppointmentService - Procesamiento completado exitosamente:', {
                appointmentId: appointmentData.id,
                eventId,
                country: 'Chile',
                totalProcessed: this.processedCount
            });
            
            console.log('=== FIN PROCESAMIENTO CHILE ===');
            
        } catch (error) {
            console.error('ChileAppointmentService - Error en el procesamiento:', error);
            
            // Log específico para errores de Chile
            console.error('=== ERROR PROCESAMIENTO CHILE ===', {
                error: error instanceof Error ? error.message : 'Error desconocido',
                messageId: messageBody.MessageId,
                timestamp: new Date().toISOString()
            });
            
            throw new Error(`Error en ChileAppointmentService: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    
    /**
     * Valida que el mensaje recibido sea un mensaje SNS válido
     * @param messageBody Cuerpo del mensaje a validar
     */
    private validateSNSMessage(messageBody: SNSMessageBody): void {
        if (!messageBody.Type || messageBody.Type !== 'Notification') {
            throw new Error('Mensaje inválido: No es una notificación SNS válida');
        }
        
        if (!messageBody.Message) {
            throw new Error('Mensaje inválido: No contiene datos de cita');
        }
        
        if (!messageBody.MessageId) {
            throw new Error('Mensaje inválido: No tiene MessageId');
        }
        
        console.log('ChileAppointmentService - Mensaje SNS validado correctamente');
    }
    
    /**
     * Extrae y parsea los datos de la cita desde el mensaje SNS
     * @param messageBody Cuerpo del mensaje SNS
     * @returns Datos de la cita parseados
     */
    private extractAppointmentData(messageBody: SNSMessageBody): AppointmentData {
        try {
            const appointmentData: AppointmentData = JSON.parse(messageBody.Message);
            
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
            
            console.log('ChileAppointmentService - Datos de cita extraídos y validados');
            return appointmentData;
            
        } catch (parseError) {
            console.error('ChileAppointmentService - Error al parsear datos de cita:', parseError);
            throw new Error(`Error al parsear datos de cita: ${parseError instanceof Error ? parseError.message : 'Error de parsing'}`);
        }
    }
    
    /**
     * Valida que la cita sea específicamente para Chile
     * @param appointmentData Datos de la cita a validar
     */
    private validateChileAppointment(appointmentData: AppointmentData): void {
        if (appointmentData.countryISO !== 'CL') {
            throw new Error(`Cita no corresponde a Chile. País recibido: ${appointmentData.countryISO}`);
        }
        
        // Validar formato de insuredId para Chile (5 dígitos)
        if (!/^\d{5}$/.test(appointmentData.insuredId)) {
            throw new Error(`ID de asegurado inválido para Chile: ${appointmentData.insuredId}. Debe tener 5 dígitos`);
        }
        
        // Validar que el scheduleId sea válido
        const scheduleIdNum = typeof appointmentData.scheduleId === 'string' 
            ? parseInt(appointmentData.scheduleId, 10) 
            : appointmentData.scheduleId;
            
        if (isNaN(scheduleIdNum) || scheduleIdNum <= 0) {
            throw new Error(`ID de horario inválido para Chile: ${appointmentData.scheduleId}`);
        }
        
        console.log('ChileAppointmentService - Cita validada para Chile');
    }
    
    /**
     * Aplica lógicas específicas de negocio para Chile antes del procesamiento
     * @param appointmentData Datos de la cita
     */
    private async applyChileSpecificLogic(appointmentData: AppointmentData): Promise<void> {
        console.log('ChileAppointmentService - Aplicando lógicas específicas de Chile...');
        
        try {
            // Lógica específica 1: Validar horarios de atención para Chile
            await this.validateChileBusinessHours(appointmentData);
            
            // Lógica específica 2: Aplicar reglas de seguros chilenos
            await this.applyChileInsuranceRules(appointmentData);
            
            // Lógica específica 3: Verificar disponibilidad de especialistas en Chile
            await this.checkChileSpecialistAvailability(appointmentData);
            
            console.log('ChileAppointmentService - Lógicas específicas de Chile aplicadas exitosamente');
            
        } catch (error) {
            console.error('ChileAppointmentService - Error en lógicas específicas de Chile:', error);
            throw new Error(`Error en lógicas de Chile: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    
    /**
     * Valida horarios de atención específicos para Chile
     * @param appointmentData Datos de la cita
     */
    private async validateChileBusinessHours(appointmentData: AppointmentData): Promise<void> {
        // Obtener hora actual en zona horaria de Chile (UTC-3 en verano, UTC-4 en invierno)
        const chileTime = new Date();
        chileTime.setHours(chileTime.getHours() - 4); // Ajustar a UTC-4 (horario estándar)
        
        const hour = chileTime.getHours();
        const dayOfWeek = chileTime.getDay(); // 0 = Domingo, 6 = Sábado
        
        console.log('ChileAppointmentService - Validando horarios de Chile:', {
            hora: hour,
            diaSemana: dayOfWeek,
            appointmentId: appointmentData.id
        });
        
        // Validar horarios de atención en Chile: Lunes a Viernes 8:00 - 19:00, Sábados 8:00 - 13:00
        if (dayOfWeek === 0) { // Domingo
            console.warn('ChileAppointmentService - Cita procesada en domingo (fuera de horario normal)');
        } else if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Lunes a Viernes
            if (hour < 8 || hour >= 19) {
                console.warn('ChileAppointmentService - Cita procesada fuera de horario laboral (8:00-19:00)');
            }
        } else if (dayOfWeek === 6) { // Sábado
            if (hour < 8 || hour >= 13) {
                console.warn('ChileAppointmentService - Cita procesada fuera de horario de sábado (8:00-13:00)');
            }
        }
        
        console.log('ChileAppointmentService - Validación de horarios de Chile completada');
    }
    
    /**
     * Aplica reglas específicas de seguros médicos en Chile
     * @param appointmentData Datos de la cita
     */
    private async applyChileInsuranceRules(appointmentData: AppointmentData): Promise<void> {
        // Lógica específica para validar tipos de seguro en Chile
        const insuredId = appointmentData.insuredId;
        
        // Determinar tipo de seguro basado en el ID (ejemplo de lógica de negocio)
        let insuranceType: string;
        
        if (insuredId.startsWith('1')) {
            insuranceType = 'FONASA';
        } else if (insuredId.startsWith('2')) {
            insuranceType = 'ISAPRE';
        } else if (insuredId.startsWith('3')) {
            insuranceType = 'Particular';
        } else {
            insuranceType = 'Otro';
        }
        
        console.log('ChileAppointmentService - Tipo de seguro identificado:', {
            insuredId,
            insuranceType,
            appointmentId: appointmentData.id
        });
        
        // Aplicar validaciones específicas según tipo de seguro
        switch (insuranceType) {
            case 'FONASA':
                await this.validateFONASARules(appointmentData);
                break;
            case 'ISAPRE':
                await this.validateISAPRERules(appointmentData);
                break;
            case 'Particular':
                await this.validatePrivateInsuranceRules(appointmentData);
                break;
            default:
                console.log('ChileAppointmentService - Procesando con reglas generales');
        }
    }
    
    /**
     * Valida reglas específicas de FONASA
     */
    private async validateFONASARules(appointmentData: AppointmentData): Promise<void> {
        console.log('ChileAppointmentService - Aplicando reglas de FONASA para:', appointmentData.id);
        // Por ejemplo: verificar tramo de FONASA, modalidad de atención, etc.
        
        // Simulación de validación
        const isVigente = true;
        if (!isVigente) {
            throw new Error('Beneficiario FONASA no vigente');
        }
    }
    
    /**
     * Valida reglas específicas de ISAPRE
     */
    private async validateISAPRERules(appointmentData: AppointmentData): Promise<void> {
        console.log('ChileAppointmentService - Aplicando reglas de ISAPRE para:', appointmentData.id);
        
        // Por ejemplo: verificar vigencia, plan de salud, prestaciones cubiertas, etc.
        
        // Simulación de validación
        const tieneCobertura = true;
        if (!tieneCobertura) {
            throw new Error('ISAPRE sin cobertura para esta especialidad');
        }
    }
    
    /**
     * Valida reglas de seguros particulares
     */
    private async validatePrivateInsuranceRules(appointmentData: AppointmentData): Promise<void> {
        console.log('ChileAppointmentService - Aplicando reglas de seguro particular para:', appointmentData.id);
        // Por ejemplo: verificar capacidad de pago, etc.
        
        // Simulación de validación
        const pagoConfirmado = true; 
        if (!pagoConfirmado) {
            throw new Error('Método de pago no confirmado para paciente particular');
        }
    }
    
    /**
     * Verifica disponibilidad de especialistas en Chile
     * @param appointmentData Datos de la cita
     */
    private async checkChileSpecialistAvailability(appointmentData: AppointmentData): Promise<void> {
        console.log('ChileAppointmentService - Verificando disponibilidad de especialistas en Chile...');
        
        // Simular verificación de disponibilidad
        const scheduleId = appointmentData.scheduleId;
        const scheduleIdNum = typeof scheduleId === 'string' ? parseInt(scheduleId, 10) : scheduleId;
        
        // Ejemplo de lógica: ciertos horarios pueden tener restricciones en Chile
        if (scheduleIdNum >= 1000 && scheduleIdNum < 2000) {
            console.log('ChileAppointmentService - Horario de especialista general disponible');
        } else if (scheduleIdNum >= 2000 && scheduleIdNum < 3000) {
            console.log('ChileAppointmentService - Horario de especialista senior disponible');
        } else if (scheduleIdNum >= 3000) {
            console.log('ChileAppointmentService - Horario de especialista de alta complejidad'); 
        } else {
            console.log('ChileAppointmentService - Horario estándar disponible');
        }
        
        console.log('ChileAppointmentService - Verificación de disponibilidad completada');
    }
    
    /**
     * Obtiene estadísticas específicas de procesamiento en Chile
     */
    public async getProcessingStats(): Promise<{
        country: string;
        totalProcessed: number;
        lastProcessedAt: string;
        status: 'healthy' | 'unhealthy';
    }> {
        return {
            country: 'Chile',
            totalProcessed: this.processedCount,
            lastProcessedAt: this.lastProcessedAt || 'Nunca',
            status: 'healthy'
        };
    }
    
    /**
     * Verifica la salud del servicio de Chile
     */
    public async healthCheck(): Promise<{
        service: string;
        status: 'healthy' | 'unhealthy';
        timestamp: string;
        dependencies?: {
            database: 'connected' | 'disconnected';
            eventBridge: 'connected' | 'disconnected';
        };
    }> {
        try {
            console.log('ChileAppointmentService - Verificando salud del servicio...');
            
            // En una implementación real, verificarías:
            // - Conexión a MySQL de Chile
            // - Conexión a EventBridge
            // - Estado de recursos críticos
            
            return {
                service: 'ChileAppointmentService',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                dependencies: {
                    database: 'connected', 
                    eventBridge: 'connected'
                }
            };
        } catch (error) {
            console.error('ChileAppointmentService - Error en health check:', error);
            return {
                service: 'ChileAppointmentService',
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                dependencies: {
                    database: 'disconnected',
                    eventBridge: 'disconnected'
                }
            };
        }
    }
}