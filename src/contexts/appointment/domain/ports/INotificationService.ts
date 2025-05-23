import { 
    NotificationChannel, 
    NotificationContent,
    NotificationAttributes 
} from '../types/NotificationTypes';

/**
 * Puerto secundario para servicios de notificación
 * Abstracción que define cómo el dominio se comunica con servicios de notificación externos
 */
export interface INotificationService {
    /**
     * Envía una notificación a través de un canal específico
     * 
     * @param channel Canal por el que se enviará la notificación
     * @param content Contenido de la notificación
     * @param attributes Atributos adicionales para el procesamiento
     * @returns Promesa que se resuelve con el ID de la notificación enviada
     */
    send(
        channel: NotificationChannel | string,
        content: NotificationContent,
        attributes?: NotificationAttributes
    ): Promise<string>;
}