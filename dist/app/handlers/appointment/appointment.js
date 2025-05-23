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
const CreateAppointmentRequestDto_1 = require("../../../contexts/appointment/application/dtos/CreateAppointmentRequestDto");
/**
 * Handler para crear citas médicas
 * Responsabilidad única: Manejar la comunicación HTTP y delegar al servicio
 */
const handler = (event, context, callback) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appointmentService = iocContainer_1.default.get(iocContainer_1.TOKENS.APPOINTMENT_SERVICE);
        const requestBody = event.body ? JSON.parse(event.body) : {};
        const requestDto = new CreateAppointmentRequestDto_1.CreateAppointmentRequestDto(requestBody.insuredId, requestBody.scheduleId, requestBody.countryISO);
        const appointmentId = yield appointmentService.createAppointment(requestDto);
        // Respuesta exitosa
        return {
            statusCode: 202,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({
                message: 'Solicitud de agendamiento en proceso',
                appointmentId
            })
        };
    }
    catch (error) {
        console.error('Error en handler de cita:', error);
        // Manejo de errores según el tipo
        if (error instanceof SyntaxError) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    message: 'El cuerpo de la solicitud debe ser un JSON válido',
                    error: 'INVALID_JSON'
                })
            };
        }
        if (error instanceof Error && error.message.includes('validación')) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({
                    message: error.message,
                    error: 'VALIDATION_ERROR'
                })
            };
        }
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Error interno del servidor',
                error: 'INTERNAL_SERVER_ERROR'
            })
        };
    }
});
exports.handler = handler;
