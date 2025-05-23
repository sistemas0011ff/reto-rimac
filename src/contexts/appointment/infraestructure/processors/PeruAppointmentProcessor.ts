import { Connection, createConnection } from 'mysql2/promise';
import { ICountryAppointmentProcessor } from '../../domain/ports/ICountryAppointmentProcessor';
import { IEventBusService } from '../../domain/ports/IEventBusService';
import { AppointmentData, AppointmentConfirmationData } from '../../domain/types/AppointmentTypes';

/**
 * Procesador de citas específico para Perú
 */ 
export class PeruAppointmentProcessor implements ICountryAppointmentProcessor {
    private connection: Connection | null = null;
    
    constructor(
        private eventBusService: IEventBusService,
        private dbConfig: {
            host: string;
            user: string;
            password: string;
            database: string;
        }
    ) {}
    
    private async getConnection(): Promise<Connection> {
        if (!this.connection) {
            console.log('Creando nueva conexión a base de datos de Perú...');
            this.connection = await createConnection({
                host: this.dbConfig.host,
                user: this.dbConfig.user,
                password: this.dbConfig.password,
                database: this.dbConfig.database
            });
            console.log('Conexión establecida exitosamente');
        }
        return this.connection;
    }
    
    async processAppointment(appointmentData: AppointmentData): Promise<void> {
        console.log('Iniciando procesamiento de cita en base de datos MySQL de Perú:', {
            id: appointmentData.id,
            insuredId: appointmentData.insuredId,
            scheduleId: appointmentData.scheduleId
        });
        
        const conn = await this.getConnection();
        
        try {
            // Verificar si la cita ya existe
            const [existingRows] = await conn.execute(
                'SELECT id FROM appointments WHERE id = ?',
                [appointmentData.id]
            );
            
            if (Array.isArray(existingRows) && existingRows.length > 0) {
                console.log('La cita ya existe en la base de datos, actualizando estado');
                
                // Actualizar la cita existente
                await conn.execute(
                    `UPDATE appointments 
                     SET status = ?, 
                         updated_at = NOW() 
                     WHERE id = ?`,
                    [appointmentData.status, appointmentData.id]
                );
            } else {
                console.log('Insertando nueva cita en base de datos MySQL de Perú');
                
                // Insertar la nueva cita
                await conn.execute(
                    `INSERT INTO appointments (
                        id, 
                        insured_id, 
                        schedule_id, 
                        country_iso,
                        status, 
                        created_at, 
                        updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        appointmentData.id,
                        appointmentData.insuredId,
                        appointmentData.scheduleId,
                        'PE',
                        appointmentData.status,
                        new Date(appointmentData.createdAt)
                    ]
                );
            }
            
            console.log('Cita procesada correctamente en base de datos MySQL de Perú:', appointmentData.id);
        } catch (error) {
            console.error('Error al procesar cita en MySQL de Perú:', error);
            throw new Error(`Error al procesar cita en base de datos de Perú: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    
    async sendConfirmation(appointmentData: AppointmentData): Promise<string> {
        console.log('Enviando confirmación a EventBridge para la cita:', appointmentData.id);
        
        try {
            // Crear datos de confirmación
            const confirmationData: AppointmentConfirmationData = {
                appointmentId: appointmentData.id,
                status: 'completed',
                completedAt: new Date().toISOString()
            };
            
            // Crear evento de confirmación
            const event = this.eventBusService.createAppointmentCompletedEvent(confirmationData);
            
            // Publicar en EventBridge
            const eventId = await this.eventBusService.publish(event);
            
            console.log('Confirmación enviada exitosamente a EventBridge:', {
                appointmentId: appointmentData.id,
                eventId
            });
            
            return eventId;
        } catch (error) {
            console.error('Error al enviar confirmación a EventBridge:', error);
            throw new Error(`Error al enviar confirmación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
}