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
exports.CompletionEventPublisher = void 0;
const EventTypes_1 = require("../../domain/events/EventTypes");
/**
 * Servicio responsable de publicar eventos de completación
 */
class CompletionEventPublisher {
    constructor(eventBusService) {
        this.eventBusService = eventBusService;
    }
    /**
     * Publica el evento final de completación
     */
    publishFinalCompletionEvent(appointment, confirmationData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Publicando evento final de completación...');
                const finalEvent = this.eventBusService.createEvent(EventTypes_1.EventType.APPOINTMENT_FULLY_COMPLETED, {
                    appointmentId: appointment.id,
                    insuredId: appointment.insuredId,
                    countryISO: appointment.countryISO,
                    completedAt: confirmationData.completedAt,
                    finalizedAt: new Date().toISOString()
                }, 'custom.appointment.completion');
                yield this.eventBusService.publish(finalEvent);
                console.log('Evento final publicado exitosamente');
            }
            catch (error) {
                console.error('Error publicando evento final:', error);
                throw new Error(`Error al publicar evento: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Publica evento de error en completación
     */
    publishCompletionErrorEvent(appointmentId, error) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Mapear el tipo de error a los valores permitidos
                const errorType = this.mapErrorType(error);
                const errorEvent = this.eventBusService.createEvent(EventTypes_1.EventType.APPOINTMENT_COMPLETION_ERROR, {
                    appointmentId,
                    errorMessage: error.message,
                    errorType: errorType,
                    errorName: error.name,
                    timestamp: new Date().toISOString()
                }, 'custom.appointment.completion');
                yield this.eventBusService.publish(errorEvent);
            }
            catch (publishError) {
                console.error('Error publicando evento de error:', publishError);
            }
        });
    }
    /**
     * Mapea el error a un tipo permitido
     */
    mapErrorType(error) {
        const errorName = error.name.toLowerCase();
        const errorMessage = error.message.toLowerCase();
        // Errores de validación
        if (errorName.includes('validation') ||
            errorMessage.includes('validación') ||
            errorMessage.includes('inválido') ||
            errorMessage.includes('requerido')) {
            return 'validation';
        }
        // Errores de base de datos
        if (errorName.includes('database') ||
            errorName.includes('mysql') ||
            errorName.includes('dynamodb') ||
            errorMessage.includes('base de datos')) {
            return 'database';
        }
        // Errores de red
        if (errorName.includes('network') ||
            errorName.includes('timeout') ||
            errorName.includes('connection')) {
            return 'network';
        }
        // Por defecto
        return 'unknown';
    }
}
exports.CompletionEventPublisher = CompletionEventPublisher;
