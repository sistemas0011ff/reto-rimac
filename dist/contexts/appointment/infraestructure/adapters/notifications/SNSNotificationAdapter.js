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
exports.SNSNotificationAdapter = void 0;
const NotificationTypes_1 = require("../../../domain/types/NotificationTypes");
const aws_sdk_1 = require("aws-sdk");
/**
 * Adaptador que implementa el servicio de notificación usando AWS SNS
 */
class SNSNotificationAdapter {
    constructor(config) {
        this.config = config;
        const options = {};
        this.isOffline = !!config.isOffline;
        if (this.isOffline) {
            options.endpoint = config.snsEndpoint || process.env.SNS_ENDPOINT || 'http://localhost:4002';
            options.region = config.region || process.env.AWS_REGION || 'us-east-2';
            options.accessKeyId = '';
            options.secretAccessKey = '';
            console.log('SNSNotificationAdapter configurado para entorno local:', {
                endpoint: options.endpoint,
                region: options.region,
                isOffline: this.isOffline
            });
        }
        else {
            options.region = config.region || process.env.AWS_REGION || 'us-east-2';
        }
        this.sns = new aws_sdk_1.SNS(options);
        // Mapeo de canales a ARNs de tópicos
        this.topicArns = {
            [NotificationTypes_1.NotificationChannel.PERU]: config.peruTopicArn || process.env.PERU_TOPIC_ARN || '',
            [NotificationTypes_1.NotificationChannel.CHILE]: config.chileTopicArn || process.env.CHILE_TOPIC_ARN || '',
            [NotificationTypes_1.NotificationChannel.GENERAL]: config.generalTopicArn || process.env.GENERAL_TOPIC_ARN || ''
        };
        // Verificar que tenemos los ARN necesarios
        if (this.isOffline) {
            Object.entries(this.topicArns).forEach(([channel, arn]) => {
                if (!arn) {
                    console.warn(`Advertencia: No se ha configurado ARN para el canal ${channel} en modo local`);
                }
            });
        }
    }
    /**
     * Convierte los atributos de notificación del dominio a atributos de mensaje SNS
     */
    convertToSNSAttributes(attributes) {
        if (!attributes)
            return {};
        const snsAttributes = {};
        Object.entries(attributes).forEach(([key, value]) => {
            if (value === undefined)
                return;
            if (typeof value === 'string') {
                snsAttributes[key] = {
                    DataType: 'String',
                    StringValue: value
                };
            }
            else if (Array.isArray(value)) {
                snsAttributes[key] = {
                    DataType: 'String.Array',
                    StringValue: JSON.stringify(value)
                };
            }
            else if (typeof value === 'number') {
                snsAttributes[key] = {
                    DataType: 'Number',
                    StringValue: value.toString()
                };
            }
            else if (typeof value === 'boolean') {
                snsAttributes[key] = {
                    DataType: 'String',
                    StringValue: value ? 'true' : 'false'
                };
            }
            else {
                snsAttributes[key] = {
                    DataType: 'String',
                    StringValue: JSON.stringify(value)
                };
            }
        });
        return snsAttributes;
    }
    /**
     * Implementación del método send usando AWS SNS
     */
    send(channel, content, attributes) {
        return __awaiter(this, void 0, void 0, function* () {
            const topicArn = this.topicArns[channel];
            if (!topicArn) {
                const error = `No se encontró ARN para el canal de notificación: ${channel}`;
                // En modo local, podemos simular el envío si no tenemos ARN configurado
                if (this.isOffline) {
                    console.warn(`Advertencia: ${error}. Simulando envío de mensaje en entorno local.`);
                    return `local-message-${Date.now()}`;
                }
                throw new Error(error);
            }
            const message = typeof content.body === 'string'
                ? content.body
                : JSON.stringify(content.body);
            const subject = content.subject || `Notificación ${content.id}`;
            const snsAttributes = this.convertToSNSAttributes(attributes);
            // Incluir countryISO como atributo para filtrado
            if (channel === NotificationTypes_1.NotificationChannel.PERU || channel === NotificationTypes_1.NotificationChannel.CHILE) {
                snsAttributes['countryISO'] = {
                    DataType: 'String',
                    StringValue: channel === NotificationTypes_1.NotificationChannel.PERU ? 'PE' : 'CL'
                };
            }
            const params = {
                TopicArn: topicArn,
                Message: message,
                Subject: subject,
                MessageAttributes: snsAttributes
            };
            // Logs adicionales para entorno local
            if (this.isOffline) {
                console.log('Enviando notificación SNS en entorno local:', {
                    channel,
                    topicArn,
                    subject,
                    messageLength: message.length,
                    attributes: Object.keys(snsAttributes)
                });
            }
            try {
                const result = yield this.sns.publish(params).promise();
                return result.MessageId || '';
            }
            catch (error) {
                console.error('Error al publicar mensaje en SNS:', error);
                // Manejo especial para errores de autenticación en entorno local
                if (this.isOffline && error instanceof Error &&
                    (error.message.includes('The security token included in the request is invalid') ||
                        error.message.includes('The Access Key ID or security token is invalid'))) {
                    console.warn('Error de autenticación en entorno local - esto es esperado en desarrollo');
                    console.log('Simulando envío de notificación en entorno local:', {
                        channel,
                        subject,
                        id: content.id
                    });
                    // Generar un ID ficticio para entorno local
                    return `local-message-${Date.now()}`;
                }
                throw new Error(`Error al enviar notificación: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Obtiene los ARN de los tópicos configurados
     * Útil para diagnóstico en entorno local
     */
    getConfiguredTopicArns() {
        return Object.assign({}, this.topicArns);
    }
    /**
     * Método para verificar la conexión con SNS
     * Útil para diagnóstico en entorno local
     */
    checkConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!this.isOffline) {
                    // En producción verificamos listando los tópicos
                    yield this.sns.listTopics().promise();
                    return true;
                }
                else {
                    try {
                        yield this.sns.publish({
                            TopicArn: 'arn:aws:sns:us-east-2:123456789012:test-topic',
                            Message: 'Test connection'
                        }).promise();
                        return true;
                    }
                    catch (error) {
                        if (error instanceof Error &&
                            (error.message.includes('The security token included in the request is invalid') ||
                                error.message.includes('The Access Key ID or security token is invalid'))) {
                            return true;
                        }
                        throw error;
                    }
                }
            }
            catch (error) {
                console.error('Error al verificar conexión con SNS:', error);
                return false;
            }
        });
    }
}
exports.SNSNotificationAdapter = SNSNotificationAdapter;
