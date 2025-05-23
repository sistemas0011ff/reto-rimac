/**
 * Tipo para mensajes de EventBridge
 */
export interface EventBridgeMessage {
    version: string;
    id: string;
    'detail-type': string;
    source: string;
    account: string;
    time: string;
    region: string;
    resources: string[];
    detail: Record<string, unknown>;
}

/**
 * Tipo específico para mensajes de completación
 */
export interface CompletionEventBridgeMessage extends EventBridgeMessage {
    'detail-type': 'appointment.completed';
    source: 'custom.appointment';
    detail: {
        appointmentId: string;
        status: 'completed';
        completedAt: string;
    };
}