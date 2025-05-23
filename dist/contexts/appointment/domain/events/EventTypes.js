"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventType = void 0;
/**
 * Tipos de eventos del dominio de citas médicas
 * Incluye eventos estándar y eventos personalizados
 */
var EventType;
(function (EventType) {
    // Eventos principales del flujo
    EventType["APPOINTMENT_CREATED"] = "appointment.created";
    EventType["APPOINTMENT_COMPLETED"] = "appointment.completed";
    EventType["APPOINTMENT_CANCELLED"] = "appointment.cancelled";
    EventType["APPOINTMENT_UPDATED"] = "appointment.updated";
    // Eventos de procesamiento por país
    EventType["APPOINTMENT_PROCESSED_PERU"] = "appointment.processed.peru";
    EventType["APPOINTMENT_PROCESSED_CHILE"] = "appointment.processed.chile";
    // Eventos personalizados para completación
    EventType["APPOINTMENT_FULLY_COMPLETED"] = "appointment.fully.completed";
    EventType["APPOINTMENT_COMPLETION_ERROR"] = "appointment.completion.error";
    EventType["PROCESSING_METRICS"] = "processing.metrics";
    EventType["PROCESSING_ERROR"] = "processing.error";
    // Eventos de sistema
    EventType["SYSTEM_HEALTH_CHECK"] = "system.health.check";
    EventType["SERVICE_STATUS_CHANGED"] = "service.status.changed";
})(EventType || (exports.EventType = EventType = {}));
