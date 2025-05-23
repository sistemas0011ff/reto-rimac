import { v4 as uuidv4 } from 'uuid';
import { EventBridge } from 'aws-sdk';
import { IEventBusService } from '../../domain/ports/IEventBusService';
import { DomainEvent } from '../../domain/events/DomainEvent';
import { EventType } from '../../domain/events/EventTypes';
import { 
    AppointmentCreatedEventData,
    AppointmentCompletedEventData,
    AppointmentCancelledEventData 
} from '../../domain/events/AppointmentEvents';
import { CustomEventConfig, CustomEventData } from '../../domain/types/CustomEventTypes';

/**
 * Configuración para el servicio de EventBridge
 */
export interface EventBridgeConfig {
    region?: string;
    endpoint?: string;
    isOffline?: boolean;
    defaultEventBusName: string;
}

/**
 * Implementación del servicio de bus de eventos utilizando AWS EventBridge
 */
export class EventBridgeService implements IEventBusService {
    private eventBridge: EventBridge;
    private defaultBusName: string;
    
    constructor(private config: EventBridgeConfig) {
        const options: EventBridge.ClientConfiguration = {};
        
        // Configuración para entorno local/offline
        if (config.isOffline) {
            options.endpoint = config.endpoint || process.env.EVENT_BRIDGE_ENDPOINT || 'http://localhost:4010';
            options.region = config.region || process.env.AWS_REGION || 'us-east-2';
            // Usar credenciales vacías para desarrollo local
            options.accessKeyId = '';
            options.secretAccessKey = '';
            
            // Log para debugging
            console.log('EventBridgeService configurado para entorno local:', {
                endpoint: options.endpoint,
                region: options.region,
                isOffline: config.isOffline
            });
        } else {
            
            options.region = config.region || process.env.AWS_REGION || 'us-east-2';
            
            // Configurar timeouts más altos para VPC
            options.httpOptions = {
                timeout: 45000, // 45 segundos timeout total
                connectTimeout: 15000 // 15 segundos para conectar
            };
            
            console.log('EventBridgeService configurado para AWS con VPC:', {
                region: options.region,
                timeout: options.httpOptions.timeout,
                connectTimeout: options.httpOptions.connectTimeout
            });
        }
        
        // Inicializar cliente de EventBridge con las opciones configuradas
        this.eventBridge = new EventBridge(options);
        this.defaultBusName = config.defaultEventBusName;
        
        // ✅ AGREGADO: Log de configuración inicial
        console.log('EventBridgeService inicializado:', {
            defaultBusName: this.defaultBusName,
            isOffline: config.isOffline,
            region: options.region,
            hasVpcConfig: !config.isOffline,
            timeoutConfig: options.httpOptions
        });
    }
    
    /**
     * Publica un evento en el bus predeterminado
     */
    async publish<T>(event: DomainEvent<T>): Promise<string> {
        return this.publishToBus(this.defaultBusName, event);
    }
    
    /**
     * Publica un evento en un bus específico
     */
    async publishToBus<T>(busName: string, event: DomainEvent<T>): Promise<string> {
        try {
            
            console.log('=== INICIANDO PUBLICACIÓN EN EVENTBRIDGE ===');
            console.log('EventBridgeService - publishToBus llamado con:', {
                busName,
                eventId: event.id,
                eventType: event.type,
                eventSource: event.source,
                eventTimestamp: event.timestamp,
                dataKeys: event.data ? Object.keys(event.data) : []
            });
            
            // Preparar los parámetros de la solicitud EventBridge
            const params: EventBridge.PutEventsRequest = {
                Entries: [
                    {
                        EventBusName: busName,
                        Source: event.source || 'custom.appointment',
                        DetailType: event.type,
                        Detail: JSON.stringify({
                            id: event.id,
                            timestamp: event.timestamp,
                            ...event.data
                        })
                    }
                ]
            };
          
            
            if (params.Entries[0].DetailType !== 'appointment.completed') {
                console.warn('⚠️  ADVERTENCIA: DetailType no es appointment.completed:', params.Entries[0].DetailType);
            }
            
            if (params.Entries[0].Source !== 'custom.appointment') {
                console.warn('⚠️  ADVERTENCIA: Source no es custom.appointment:', params.Entries[0].Source);
            }
            
            if (!params.Entries[0].EventBusName) {
                console.error('❌ ERROR CRÍTICO: EventBusName está vacío!');
            }
            
            // Manejo adicional para entorno local
            if (this.config.isOffline) {
                console.log('EventBridgeService - Publicando evento en modo local:', {
                    busName,
                    type: event.type,
                    source: event.source || 'custom.appointment',
                    endpoint: this.config.endpoint
                });
            }
            
            // Enviar el evento a EventBridge
            console.log('EventBridgeService - Enviando evento a EventBridge...');
            const result = await this.eventBridge.putEvents(params).promise();
            
            //  Log detallado del resultado
            console.log('EventBridgeService - Respuesta de EventBridge recibida:', {
                FailedEntryCount: result.FailedEntryCount,
                Entries: result.Entries?.map(entry => ({
                    EventId: entry.EventId,
                    ErrorCode: entry.ErrorCode,
                    ErrorMessage: entry.ErrorMessage
                }))
            });
            
            // Verificar errores en la respuesta
            if (result.FailedEntryCount && result.FailedEntryCount > 0) {
                const failedEntry = result.Entries?.find(entry => entry.ErrorCode);
                console.error('❌ EventBridge reportó entrada fallida:', {
                    ErrorCode: failedEntry?.ErrorCode,
                    ErrorMessage: failedEntry?.ErrorMessage,
                    FailedEntryCount: result.FailedEntryCount
                });
                throw new Error(`Error al publicar evento: ${failedEntry?.ErrorCode} - ${failedEntry?.ErrorMessage}`);
            }
            
            const eventId = result.Entries?.[0]?.EventId || '';
            
            console.log('✅ EventBridgeService - Evento publicado exitosamente:', {
                originalEventId: event.id,
                eventBridgeEventId: eventId,
                busName,
                type: event.type,
                source: event.source || 'custom.appointment'
            });
            
            console.log('=== FIN PUBLICACIÓN EN EVENTBRIDGE ===');
            
            return eventId;
        } catch (error) {

            console.error('❌ EventBridgeService - ERROR en publishToBus:', {
                busName,
                eventType: event.type,
                eventSource: event.source,
                error: error instanceof Error ? {
                    message: error.message,
                    name: error.name,
                    stack: error.stack
                } : error
            });
            
            if (this.config.isOffline && error instanceof Error && 
                (error.message.includes('The security token included in the request is invalid') ||
                 error.message.includes('The Access Key ID or security token is invalid'))) {
                console.warn('EventBridgeService - Error de autenticación en entorno local - esto es esperado en desarrollo');
                const localEventId = 'local-event-id-' + uuidv4().substring(0, 8);
                console.log('EventBridgeService - Retornando ID de evento local:', localEventId);
                return localEventId;
            }
            
            console.log('=== ERROR EN PUBLICACIÓN EVENTBRIDGE ===');
            throw new Error(`Error al publicar evento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    
    /**
     * Crea un evento de creación de cita
     */
    createAppointmentCreatedEvent(
        data: AppointmentCreatedEventData,
        source?: string
    ): DomainEvent<AppointmentCreatedEventData> {
        return this.createEvent(EventType.APPOINTMENT_CREATED, data, source);
    }
    
    /**
     * Crea un evento de cita completada
     */
    createAppointmentCompletedEvent(
        data: AppointmentCompletedEventData,
        source?: string
    ): DomainEvent<AppointmentCompletedEventData> {
        console.log('EventBridgeService - Creando evento de cita completada:', {
            appointmentId: data.appointmentId,
            status: data.status,
            source: source || 'custom.appointment'
        });
        
        const event = this.createEvent(EventType.APPOINTMENT_COMPLETED, data, source);
        
        console.log('EventBridgeService - Evento de cita completada creado:', {
            id: event.id,
            type: event.type,
            source: event.source,
            timestamp: event.timestamp
        });
        
        return event;
    }
    
    /**
     * Crea un evento de cita cancelada
     */
    createAppointmentCancelledEvent(
        data: AppointmentCancelledEventData,
        source?: string
    ): DomainEvent<AppointmentCancelledEventData> {
        return this.createEvent(EventType.APPOINTMENT_CANCELLED, data, source);
    }
    
    /**
     * Crea un evento genérico del dominio
     */
    createEvent<T>(type: EventType, data: T, source?: string): DomainEvent<T> {
        const event = {
            id: uuidv4(),
            type,
            timestamp: new Date().toISOString(),
            data,
            source: source || 'custom.appointment'
        };
        
        // ✅ AGREGADO: Log de creación de evento genérico
        console.log('EventBridgeService - Evento genérico creado:', {
            id: event.id,
            type: event.type,
            source: event.source
        });
        
        return event;
    }
    
    /**
     * Crea un evento personalizado con tipos específicos
     * Sin usar any - completamente tipado
     */
    createCustomEvent<T extends CustomEventData>(
        eventConfig: CustomEventConfig<T>
    ): DomainEvent<T> {
        return {
            id: uuidv4(),
            type: eventConfig.detailType,
            timestamp: new Date().toISOString(),
            data: eventConfig.detail,
            source: eventConfig.source
        };
    }
    
    /**
     * Método legacy para compatibilidad con código existente
     * @deprecated Use publish() instead
     */
    async putEvent(event: {
        Source: string;
        DetailType: string;
        Detail: string;
        EventBusName?: string;
    }): Promise<string> {
        try {
            const params: EventBridge.PutEventsRequest = {
                Entries: [
                    {
                        Source: event.Source,
                        DetailType: event.DetailType,
                        Detail: event.Detail,
                        EventBusName: event.EventBusName || this.defaultBusName
                    }
                ]
            };
            
            // Manejo adicional para entorno local
            if (this.config.isOffline) {
                console.log('Publicando evento legacy en modo local:', {
                    busName: event.EventBusName || this.defaultBusName,
                    type: event.DetailType,
                    source: event.Source
                });
            }
            
            const result = await this.eventBridge.putEvents(params).promise();
            
            if (result.FailedEntryCount && result.FailedEntryCount > 0) {
                const failedEntry = result.Entries?.find(entry => entry.ErrorCode);
                throw new Error(`Error al publicar evento: ${failedEntry?.ErrorCode} - ${failedEntry?.ErrorMessage}`);
            }
            
            return result.Entries?.[0]?.EventId || '';
        } catch (error) {
            console.error('Error al publicar evento en EventBridge:', error);
            
            // Manejo especial para errores de autenticación en entorno local
            if (this.config.isOffline && error instanceof Error && 
                (error.message.includes('The security token included in the request is invalid') ||
                 error.message.includes('The Access Key ID or security token is invalid'))) {
                console.warn('Error de autenticación en entorno local - esto es esperado en desarrollo');
                return 'local-event-id-' + uuidv4().substring(0, 8);
            }
            
            throw new Error(`Error al publicar evento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
}