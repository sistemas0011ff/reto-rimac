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
exports.CountryAppointmentService = void 0;
/**
 * Servicio de aplicación para procesamiento de citas por país
 */
class CountryAppointmentService {
    constructor(countryProcessor) {
        this.countryProcessor = countryProcessor;
    }
    /**
     * Procesa un mensaje de cita médica desde la cola SQS
     * @param messageBody Cuerpo del mensaje recibido
     */
    processMessage(messageBody) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('Procesando mensaje de cita:', {
                    messageType: messageBody.Type,
                    messageId: messageBody.MessageId
                });
                // Extraer datos de la cita del mensaje SNS
                const appointmentData = JSON.parse(messageBody.Message);
                console.log('Datos de cita extraídos:', {
                    appointmentId: appointmentData.id,
                    insuredId: appointmentData.insuredId,
                    countryISO: appointmentData.countryISO
                });
                // Procesar la cita en el sistema del país
                yield this.countryProcessor.processAppointment(appointmentData);
                // Enviar confirmación
                const eventId = yield this.countryProcessor.sendConfirmation(appointmentData);
                console.log('Procesamiento completado con éxito:', {
                    appointmentId: appointmentData.id,
                    eventId
                });
            }
            catch (error) {
                console.error('Error en el procesamiento de mensaje:', error);
                throw new Error(`Error al procesar mensaje: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
}
exports.CountryAppointmentService = CountryAppointmentService;
