
import { 
    INotificationService 
} from '../../../domain/ports/INotificationService';
import { 
    NotificationChannel, 
    NotificationContent, 
    NotificationAttributes 
} from '../../../domain/types/NotificationTypes';
import { SNS } from 'aws-sdk';

/**
 * Interfaz para la configuración del adaptador SNS
 */
export interface SNSConfig {
    isOffline?: boolean;
    region?: string;
    snsEndpoint?: string;
    peruTopicArn?: string;
    chileTopicArn?: string;
    generalTopicArn?: string;
}

/**
 * Adaptador que implementa el servicio de notificación usando AWS SNS
 */
export class SNSNotificationAdapter implements INotificationService {
    private sns: SNS;
    private topicArns: Record<string, string>;
    private isOffline: boolean;
    
    constructor(private config: SNSConfig) {
        const options: SNS.ClientConfiguration = {};
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
        } else {
            options.region = config.region || process.env.AWS_REGION || 'us-east-2';
        }
        
        this.sns = new SNS(options);
        
        // Mapeo de canales a ARNs de tópicos
        this.topicArns = {
            [NotificationChannel.PERU]: config.peruTopicArn || process.env.PERU_TOPIC_ARN || '',
            [NotificationChannel.CHILE]: config.chileTopicArn || process.env.CHILE_TOPIC_ARN || '',
            [NotificationChannel.GENERAL]: config.generalTopicArn || process.env.GENERAL_TOPIC_ARN || ''
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
    private convertToSNSAttributes(attributes?: NotificationAttributes): SNS.MessageAttributeMap {
        if (!attributes) return {};
        
        const snsAttributes: SNS.MessageAttributeMap = {};
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (value === undefined) return;
            
            if (typeof value === 'string') {
                snsAttributes[key] = {
                    DataType: 'String',
                    StringValue: value
                };
            } else if (Array.isArray(value)) {
                snsAttributes[key] = {
                    DataType: 'String.Array',
                    StringValue: JSON.stringify(value)
                };
            } else if (typeof value === 'number') {
                snsAttributes[key] = {
                    DataType: 'Number',
                    StringValue: value.toString()
                };
            } else if (typeof value === 'boolean') {
                snsAttributes[key] = {
                    DataType: 'String',
                    StringValue: value ? 'true' : 'false'
                };
            } else {
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
    async send(
        channel: NotificationChannel | string,
        content: NotificationContent,
        attributes?: NotificationAttributes
    ): Promise<string> {
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
        if (channel === NotificationChannel.PERU || channel === NotificationChannel.CHILE) {
            snsAttributes['countryISO'] = {
                DataType: 'String',
                StringValue: channel === NotificationChannel.PERU ? 'PE' : 'CL'
            };
        }
        
        const params: SNS.PublishInput = {
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
            const result = await this.sns.publish(params).promise();
            return result.MessageId || '';
        } catch (error) {
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
    }
    
    /**
     * Obtiene los ARN de los tópicos configurados
     * Útil para diagnóstico en entorno local
     */
    getConfiguredTopicArns(): Record<string, string> {
        return { ...this.topicArns };
    }
    
    /**
     * Método para verificar la conexión con SNS
     * Útil para diagnóstico en entorno local
     */
    async checkConnection(): Promise<boolean> {
        try {
            if (!this.isOffline) {
                // En producción verificamos listando los tópicos
                await this.sns.listTopics().promise();
                return true;
            } else {                
                try {
                    await this.sns.publish({
                        TopicArn: 'arn:aws:sns:us-east-2:123456789012:test-topic',
                        Message: 'Test connection'
                    }).promise();
                    return true;
                } catch (error) {                    
                    if (error instanceof Error && 
                        (error.message.includes('The security token included in the request is invalid') ||
                         error.message.includes('The Access Key ID or security token is invalid'))) {                        
                        return true;
                    }
                    throw error;
                }
            }
        } catch (error) {
            console.error('Error al verificar conexión con SNS:', error);
            return false;
        }
    }
}