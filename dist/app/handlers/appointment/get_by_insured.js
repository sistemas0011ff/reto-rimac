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
const GetAppointmentsByInsuredRequestDto_1 = require("../../../contexts/appointment/application/dtos/GetAppointmentsByInsuredRequestDto");
/**
 * Handler para obtener citas médicas por ID de asegurado
 * Implementa el endpoint GET /appointment/{insuredId} del reto
 */
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        console.log('=== INICIO CONSULTA DE CITAS POR ASEGURADO ===');
        console.log('Parámetros recibidos:', {
            pathParameters: event.pathParameters,
            httpMethod: event.httpMethod,
            path: event.path
        });
        const appointmentService = iocContainer_1.default.get(iocContainer_1.TOKENS.APPOINTMENT_SERVICE);
        const insuredId = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.insuredId;
        if (!insuredId) {
            console.warn('insuredId no proporcionado en la URL');
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                },
                body: JSON.stringify({
                    message: 'El parámetro insuredId es requerido en la URL',
                    error: 'MISSING_INSURED_ID'
                })
            };
        }
        const requestDto = new GetAppointmentsByInsuredRequestDto_1.GetAppointmentsByInsuredRequestDto(insuredId);
        const appointments = yield appointmentService.getAppointmentsByInsured(requestDto);
        console.log('Consulta ejecutada exitosamente:', {
            insuredId,
            appointmentsFound: appointments.length
        });
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({
                insuredId,
                totalAppointments: appointments.length,
                appointments: appointments.map(appointment => ({
                    id: appointment.id,
                    insuredId: appointment.insuredId,
                    scheduleId: appointment.scheduleId,
                    countryISO: appointment.countryISO,
                    status: appointment.status,
                    createdAt: appointment.createdAt,
                    isPending: appointment.status === 'pending',
                    isCompleted: appointment.status === 'completed'
                }))
            })
        };
    }
    catch (error) {
        console.error('Error al consultar citas por asegurado:', {
            error: error instanceof Error ? error.message : 'Error desconocido',
            stack: error instanceof Error ? error.stack : undefined,
            insuredId: (_b = event.pathParameters) === null || _b === void 0 ? void 0 : _b.insuredId
        });
        if (error instanceof Error && error.message.includes('5 dígitos')) {
            return {
                statusCode: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
                },
                body: JSON.stringify({
                    message: 'El ID del asegurado debe tener exactamente 5 dígitos',
                    error: 'INVALID_INSURED_ID_FORMAT',
                    insuredId: (_c = event.pathParameters) === null || _c === void 0 ? void 0 : _c.insuredId
                })
            };
        }
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: JSON.stringify({
                message: 'Error interno del servidor al consultar las citas',
                error: 'INTERNAL_SERVER_ERROR',
                details: error instanceof Error ? error.message : 'Error desconocido'
            })
        };
    }
    finally {
        console.log('=== FIN CONSULTA DE CITAS POR ASEGURADO ===');
    }
});
exports.handler = handler;
