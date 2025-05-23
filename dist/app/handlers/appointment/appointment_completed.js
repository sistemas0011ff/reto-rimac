"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.handler = void 0;
require("reflect-metadata");
const iocContainer_1 = __importStar(require("../../di/iocContainer"));
/**
 * Handler para procesar confirmaciones de citas completadas desde EventBridge
 * Paso 6 del reto: Actualizar estado a "completed" en DynamoDB
 */
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('===== INICIO PROCESAMIENTO DE CONFIRMACIONES =====');
        console.log('Número de confirmaciones recibidas:', event.Records.length);
        const completionService = iocContainer_1.default.get(iocContainer_1.TOKENS.APPOINTMENT_COMPLETION_SERVICE);
        // Procesar cada mensaje de confirmación
        for (const record of event.Records) {
            console.log('Procesando confirmación:', record.messageId);
            try {
                // El mensaje viene de EventBridge, procedemos a parsearlo
                const eventBridgeMessage = JSON.parse(record.body);
                yield completionService.processEventBridgeConfirmation(eventBridgeMessage);
                console.log('Confirmación procesada exitosamente:', record.messageId);
            }
            catch (recordError) {
                console.error('Error procesando confirmación individual:', {
                    messageId: record.messageId,
                    error: recordError instanceof Error ? recordError.message : 'Error desconocido',
                    body: record.body
                });
            }
        }
        console.log('===== FIN PROCESAMIENTO DE CONFIRMACIONES =====');
    }
    catch (error) {
        console.error('Error general al procesar confirmaciones:', error);
        console.log('===== ERROR EN PROCESAMIENTO DE CONFIRMACIONES =====');
        throw error;
    }
});
exports.handler = handler;
