import { EventType } from './EventTypes';

/**
 * Estructura base para los eventos del dominio
 */
export interface DomainEvent<T = unknown> {
    id: string;         // Identificador único del evento
    type: EventType;    // Tipo de evento
    timestamp: string;  // Momento en que ocurrió el evento
    data: T;            // Datos asociados al evento
    source?: string;    // Origen o servicio que emitió el evento
}