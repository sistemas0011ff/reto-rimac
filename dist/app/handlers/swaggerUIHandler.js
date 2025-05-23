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
exports.handler = void 0;
const handler = (event) => __awaiter(void 0, void 0, void 0, function* () {
    let baseUrl;
    const hostHeader = event.headers.Host || event.headers.host;
    if (hostHeader) {
        const isLocal = hostHeader.includes('localhost');
        baseUrl = isLocal ? `http://${hostHeader}/${event.requestContext.stage}` : `https://${hostHeader}/${event.requestContext.stage}`;
    }
    else {
        baseUrl = 'http://default-host';
    }
    const swaggerSpec = {
        openapi: '3.0.0',
        info: {
            title: 'Medical Appointments API',
            version: '1.0.0',
            description: 'API para gestionar citas médicas - Sistema de agendamiento para asegurados',
        },
        servers: [
            {
                url: baseUrl,
            },
        ],
        paths: {
            '/appointment': {
                post: {
                    summary: 'Crea una nueva cita médica',
                    description: 'Registra una nueva solicitud de agendamiento de cita médica. El estado inicial será "pending" y se procesará de forma asíncrona.',
                    tags: [
                        'appointments'
                    ],
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/CreateAppointmentRequest'
                                },
                                examples: {
                                    peru: {
                                        summary: 'Ejemplo para Perú',
                                        value: {
                                            insuredId: '12345',
                                            scheduleId: '1001',
                                            countryISO: 'PE'
                                        }
                                    },
                                    chile: {
                                        summary: 'Ejemplo para Chile',
                                        value: {
                                            insuredId: '30001',
                                            scheduleId: '2001',
                                            countryISO: 'CL'
                                        }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '202': {
                            description: 'Solicitud de agendamiento en proceso',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            message: {
                                                type: 'string',
                                                example: 'Solicitud de agendamiento en proceso'
                                            },
                                            appointmentId: {
                                                type: 'string',
                                                format: 'uuid',
                                                example: '123e4567-e89b-12d3-a456-426614174000'
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'Datos de entrada no válidos',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            message: { type: 'string' },
                                            error: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Error interno del servidor'
                        }
                    }
                }
            },
            '/appointment/{insuredId}': {
                get: {
                    summary: 'Obtiene las citas médicas de un asegurado',
                    description: 'Consulta todas las citas médicas de un asegurado específico, incluyendo su estado actual (pending, completed, cancelled).',
                    tags: [
                        'appointments'
                    ],
                    parameters: [
                        {
                            name: 'insuredId',
                            in: 'path',
                            required: true,
                            description: 'ID del asegurado (exactamente 5 dígitos)',
                            schema: {
                                type: 'string',
                                pattern: '^\\d{5}$'
                            },
                            examples: {
                                peru: {
                                    summary: 'Asegurado de Perú',
                                    value: '12345'
                                },
                                chile: {
                                    summary: 'Asegurado de Chile',
                                    value: '30001'
                                }
                            }
                        }
                    ],
                    responses: {
                        '200': {
                            description: 'Lista de citas médicas del asegurado',
                            content: {
                                'application/json': {
                                    schema: {
                                        $ref: '#/components/schemas/AppointmentListResponse'
                                    },
                                    examples: {
                                        withAppointments: {
                                            summary: 'Asegurado con citas',
                                            value: {
                                                insuredId: '12345',
                                                totalAppointments: 2,
                                                appointments: [
                                                    {
                                                        id: '123e4567-e89b-12d3-a456-426614174000',
                                                        insuredId: '12345',
                                                        scheduleId: '1001',
                                                        countryISO: 'PE',
                                                        status: 'completed',
                                                        createdAt: '2025-05-22T07:00:00.000Z'
                                                    },
                                                    {
                                                        id: '456e7890-e89b-12d3-a456-426614174001',
                                                        insuredId: '12345',
                                                        scheduleId: '1002',
                                                        countryISO: 'PE',
                                                        status: 'pending',
                                                        createdAt: '2025-05-22T08:00:00.000Z'
                                                    }
                                                ]
                                            }
                                        },
                                        noAppointments: {
                                            summary: 'Asegurado sin citas',
                                            value: {
                                                insuredId: '99999',
                                                totalAppointments: 0,
                                                appointments: []
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        '400': {
                            description: 'ID de asegurado inválido',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            message: {
                                                type: 'string',
                                                example: 'El ID del asegurado debe tener exactamente 5 dígitos'
                                            },
                                            error: {
                                                type: 'string',
                                                example: 'INVALID_INSURED_ID_FORMAT'
                                            },
                                            insuredId: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        },
                        '500': {
                            description: 'Error interno del servidor'
                        }
                    }
                }
            }
        },
        components: {
            schemas: {
                CreateAppointmentRequest: {
                    type: 'object',
                    properties: {
                        insuredId: {
                            type: 'string',
                            description: 'ID del asegurado (exactamente 5 dígitos)',
                            pattern: '^\\d{5}$',
                            example: '12345'
                        },
                        scheduleId: {
                            type: 'string',
                            description: 'ID del horario médico (número positivo)',
                            example: '1001'
                        },
                        countryISO: {
                            type: 'string',
                            description: 'Código ISO del país',
                            enum: ['PE', 'CL'],
                            example: 'PE'
                        }
                    },
                    required: ['insuredId', 'scheduleId', 'countryISO']
                },
                Appointment: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            description: 'ID único de la cita',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                        },
                        insuredId: {
                            type: 'string',
                            description: 'ID del asegurado',
                            example: '12345'
                        },
                        scheduleId: {
                            type: 'string',
                            description: 'ID del horario médico',
                            example: '1001'
                        },
                        countryISO: {
                            type: 'string',
                            enum: ['PE', 'CL'],
                            description: 'Código del país',
                            example: 'PE'
                        },
                        status: {
                            type: 'string',
                            enum: ['pending', 'completed', 'cancelled'],
                            description: 'Estado actual de la cita',
                            example: 'completed'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Fecha y hora de creación',
                            example: '2025-05-22T07:00:00.000Z'
                        }
                    }
                },
                AppointmentListResponse: {
                    type: 'object',
                    properties: {
                        insuredId: {
                            type: 'string',
                            description: 'ID del asegurado consultado',
                            example: '12345'
                        },
                        totalAppointments: {
                            type: 'integer',
                            description: 'Total de citas encontradas',
                            example: 2
                        },
                        appointments: {
                            type: 'array',
                            items: {
                                $ref: '#/components/schemas/Appointment'
                            },
                            description: 'Lista de citas del asegurado'
                        }
                    }
                }
            },
        },
    };
    const swaggerSpecJsonString = JSON.stringify(swaggerSpec);
    const swaggerUiHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Medical Appointments API - Swagger UI</title>
        <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.3.2/swagger-ui.css">
        <style>
            body { 
                margin: 0; 
                padding: 0; 
            }
            .swagger-ui .topbar { 
                background-color: #1b1b1b; 
            }
            .swagger-ui .info .title { 
                color: #3b4151; 
            }
            .swagger-ui .info .description { 
                color: #3b4151; 
            }
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.3.2/swagger-ui-bundle.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.3.2/swagger-ui-standalone-preset.js"></script>
        <script>
            window.onload = () => {
                window.ui = SwaggerUIBundle({
                    spec: ${swaggerSpecJsonString},
                    dom_id: '#swagger-ui',
                    deepLinking: true,
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset
                    ],
                    layout: "StandaloneLayout",
                    defaultModelsExpandDepth: 1,
                    defaultModelExpandDepth: 1,
                    displayRequestDuration: true,
                    syntaxHighlight: {
                        activated: true,
                        theme: "agate"
                    },
                    tryItOutEnabled: true,
                    filter: true
                });
            };
        </script>
    </body>
    </html>
    `;
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Surrogate-Control': 'no-store'
        },
        body: swaggerUiHtml,
    };
});
exports.handler = handler;
