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
exports.EventBridgeService = void 0;
const uuid_1 = require("uuid");
const aws_sdk_1 = require("aws-sdk");
const EventTypes_1 = require("../../domain/events/EventTypes");
/**
 * Implementación del servicio de bus de eventos utilizando AWS EventBridge
 */
class EventBridgeService {
    constructor(config) {
        this.config = config;
        const options = {};
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
        }
        else {
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
        this.eventBridge = new aws_sdk_1.EventBridge(options);
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
    publish(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.publishToBus(this.defaultBusName, event);
        });
    }
    /**
     * Publica un evento en un bus específico
     */
    publishToBus(busName, event) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
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
                const params = {
                    Entries: [
                        {
                            EventBusName: busName,
                            Source: event.source || 'custom.appointment',
                            DetailType: event.type,
                            Detail: JSON.stringify(Object.assign({ id: event.id, timestamp: event.timestamp }, event.data))
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
                const result = yield this.eventBridge.putEvents(params).promise();
                //  Log detallado del resultado
                console.log('EventBridgeService - Respuesta de EventBridge recibida:', {
                    FailedEntryCount: result.FailedEntryCount,
                    Entries: (_a = result.Entries) === null || _a === void 0 ? void 0 : _a.map(entry => ({
                        EventId: entry.EventId,
                        ErrorCode: entry.ErrorCode,
                        ErrorMessage: entry.ErrorMessage
                    }))
                });
                // Verificar errores en la respuesta
                if (result.FailedEntryCount && result.FailedEntryCount > 0) {
                    const failedEntry = (_b = result.Entries) === null || _b === void 0 ? void 0 : _b.find(entry => entry.ErrorCode);
                    console.error('❌ EventBridge reportó entrada fallida:', {
                        ErrorCode: failedEntry === null || failedEntry === void 0 ? void 0 : failedEntry.ErrorCode,
                        ErrorMessage: failedEntry === null || failedEntry === void 0 ? void 0 : failedEntry.ErrorMessage,
                        FailedEntryCount: result.FailedEntryCount
                    });
                    throw new Error(`Error al publicar evento: ${failedEntry === null || failedEntry === void 0 ? void 0 : failedEntry.ErrorCode} - ${failedEntry === null || failedEntry === void 0 ? void 0 : failedEntry.ErrorMessage}`);
                }
                const eventId = ((_d = (_c = result.Entries) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.EventId) || '';
                console.log('✅ EventBridgeService - Evento publicado exitosamente:', {
                    originalEventId: event.id,
                    eventBridgeEventId: eventId,
                    busName,
                    type: event.type,
                    source: event.source || 'custom.appointment'
                });
                console.log('=== FIN PUBLICACIÓN EN EVENTBRIDGE ===');
                return eventId;
            }
            catch (error) {
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
                    const localEventId = 'local-event-id-' + (0, uuid_1.v4)().substring(0, 8);
                    console.log('EventBridgeService - Retornando ID de evento local:', localEventId);
                    return localEventId;
                }
                console.log('=== ERROR EN PUBLICACIÓN EVENTBRIDGE ===');
                throw new Error(`Error al publicar evento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Crea un evento de creación de cita
     */
    createAppointmentCreatedEvent(data, source) {
        return this.createEvent(EventTypes_1.EventType.APPOINTMENT_CREATED, data, source);
    }
    /**
     * Crea un evento de cita completada
     */
    createAppointmentCompletedEvent(data, source) {
        console.log('EventBridgeService - Creando evento de cita completada:', {
            appointmentId: data.appointmentId,
            status: data.status,
            source: source || 'custom.appointment'
        });
        const event = this.createEvent(EventTypes_1.EventType.APPOINTMENT_COMPLETED, data, source);
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
    createAppointmentCancelledEvent(data, source) {
        return this.createEvent(EventTypes_1.EventType.APPOINTMENT_CANCELLED, data, source);
    }
    /**
     * Crea un evento genérico del dominio
     */
    createEvent(type, data, source) {
        const event = {
            id: (0, uuid_1.v4)(),
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
    createCustomEvent(eventConfig) {
        return {
            id: (0, uuid_1.v4)(),
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
    putEvent(event) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const params = {
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
                const result = yield this.eventBridge.putEvents(params).promise();
                if (result.FailedEntryCount && result.FailedEntryCount > 0) {
                    const failedEntry = (_a = result.Entries) === null || _a === void 0 ? void 0 : _a.find(entry => entry.ErrorCode);
                    throw new Error(`Error al publicar evento: ${failedEntry === null || failedEntry === void 0 ? void 0 : failedEntry.ErrorCode} - ${failedEntry === null || failedEntry === void 0 ? void 0 : failedEntry.ErrorMessage}`);
                }
                return ((_c = (_b = result.Entries) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.EventId) || '';
            }
            catch (error) {
                console.error('Error al publicar evento en EventBridge:', error);
                // Manejo especial para errores de autenticación en entorno local
                if (this.config.isOffline && error instanceof Error &&
                    (error.message.includes('The security token included in the request is invalid') ||
                        error.message.includes('The Access Key ID or security token is invalid'))) {
                    console.warn('Error de autenticación en entorno local - esto es esperado en desarrollo');
                    return 'local-event-id-' + (0, uuid_1.v4)().substring(0, 8);
                }
                throw new Error(`Error al publicar evento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
}
exports.EventBridgeService = EventBridgeService;
