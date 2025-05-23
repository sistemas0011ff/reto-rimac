/**
 * Tipos de contenido que pueden ser enviados como notificaciones
 */
export type NotificationContent = {
    id: string;
    subject?: string;
    body: string | Record<string, unknown>;
    timestamp: string;
};

/**
 * Canales disponibles para enviar notificaciones
 */
export enum NotificationChannel {
    PERU = 'peru',
    CHILE = 'chile',
    GENERAL = 'general'
}

/**
 * Atributos adicionales para el procesamiento de notificaciones
 */
export interface NotificationAttributes {
    priority?: 'high' | 'normal' | 'low';
    category?: string;
    tags?: string[];
    [key: string]: unknown;
}