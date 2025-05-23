import { APIGatewayProxyHandler, APIGatewayProxyResult} from 'aws-lambda';
import 'reflect-metadata';
import Container, { TOKENS } from '../../di/iocContainer';
import { IAppointmentService } from '../../../contexts/appointment/application/interfaces/IAppointmentService';
import { CreateAppointmentRequestDto } from '../../../contexts/appointment/application/dtos/CreateAppointmentRequestDto';

/**
 * Handler para crear citas médicas
 * Responsabilidad única: Manejar la comunicación HTTP y delegar al servicio
 */
export const handler: APIGatewayProxyHandler = async (event, context, callback): Promise<APIGatewayProxyResult> => {
    try {
        const appointmentService = Container.get<IAppointmentService>(TOKENS.APPOINTMENT_SERVICE);
        
        const requestBody = event.body ? JSON.parse(event.body) : {};
        
        const requestDto = new CreateAppointmentRequestDto(
            requestBody.insuredId,
            requestBody.scheduleId,
            requestBody.countryISO
        );
        
        const appointmentId = await appointmentService.createAppointment(requestDto);
        
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
    } catch (error) {
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
};