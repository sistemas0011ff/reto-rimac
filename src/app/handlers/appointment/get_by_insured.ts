import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import 'reflect-metadata';
import Container, { TOKENS } from '../../di/iocContainer';
import { IAppointmentService } from '../../../contexts/appointment/application/interfaces/IAppointmentService';
import { GetAppointmentsByInsuredRequestDto } from '../../../contexts/appointment/application/dtos/GetAppointmentsByInsuredRequestDto';

/**
 * Handler para obtener citas médicas por ID de asegurado
 * Implementa el endpoint GET /appointment/{insuredId} del reto
 */
export const handler: APIGatewayProxyHandler = async (
    event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
    try {
        console.log('=== INICIO CONSULTA DE CITAS POR ASEGURADO ===');
        console.log('Parámetros recibidos:', {
            pathParameters: event.pathParameters,
            httpMethod: event.httpMethod,
            path: event.path
        });

        const appointmentService = Container.get<IAppointmentService>(TOKENS.APPOINTMENT_SERVICE);

        const insuredId = event.pathParameters?.insuredId;

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
 
        const requestDto = new GetAppointmentsByInsuredRequestDto(insuredId);

        const appointments = await appointmentService.getAppointmentsByInsured(requestDto);

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

    } catch (error) {
        console.error('Error al consultar citas por asegurado:', {
            error: error instanceof Error ? error.message : 'Error desconocido',
            stack: error instanceof Error ? error.stack : undefined,
            insuredId: event.pathParameters?.insuredId
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
                    insuredId: event.pathParameters?.insuredId
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
    } finally {
        console.log('=== FIN CONSULTA DE CITAS POR ASEGURADO ===');
    }
};