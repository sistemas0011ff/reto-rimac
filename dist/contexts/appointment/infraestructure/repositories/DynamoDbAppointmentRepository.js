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
exports.DynamoDbAppointmentRepository = void 0;
const aws_sdk_1 = require("aws-sdk");
const AppointmentEntity_1 = require("../../domain/entities/AppointmentEntity");
/**
 * Implementación del repositorio de citas médicas utilizando DynamoDB
 */
class DynamoDbAppointmentRepository {
    /**
     * @param config Configuración para DynamoDB
     */
    constructor(config) {
        this.config = config;
        console.log('VALORES DE CONFIGURACIÓN RECIBIDOS EN DynamoDbAppointmentRepository:', {
            configIsOffline: config.isOffline,
            configEndpoint: config.dynamoDbEndpoint,
            configRegion: config.region,
            configTable: config.appointmentsTable,
            envIsOffline: process.env.IS_OFFLINE,
            envDynamoDbEndpoint: process.env.DYNAMODB_ENDPOINT,
            envAwsRegion: process.env.AWS_REGION,
            envAppointmentsTable: process.env.APPOINTMENTS_TABLE
        });
        if (config.isOffline) {
            const dynamoDbOptions = {
                endpoint: config.dynamoDbEndpoint || process.env.DYNAMODB_ENDPOINT || '',
                region: config.region || process.env.AWS_REGION || 'us-east-2',
                accessKeyId: '',
                secretAccessKey: ''
            };
            console.log('DynamoDbAppointmentRepository configurado para entorno local:', {
                endpoint: dynamoDbOptions.endpoint,
                region: dynamoDbOptions.region,
                isOffline: config.isOffline
            });
            const dynamoDb = new aws_sdk_1.DynamoDB(dynamoDbOptions);
            this.dynamoDb = new aws_sdk_1.DynamoDB.DocumentClient({ service: dynamoDb });
        }
        else {
            console.log('DynamoDbAppointmentRepository configurado para AWS REAL');
            this.dynamoDb = new aws_sdk_1.DynamoDB.DocumentClient({
                region: config.region || process.env.AWS_REGION || 'us-east-2'
            });
        }
        this.tableName = config.appointmentsTable || process.env.APPOINTMENTS_TABLE || 'Appointments';
    }
    /**
     * Guarda una cita en DynamoDB
     * Si la cita ya existe, se actualiza
     */
    save(appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = {
                    TableName: this.tableName,
                    Item: {
                        id: appointment.id,
                        insuredId: appointment.insuredId,
                        scheduleId: appointment.scheduleId,
                        countryISO: appointment.countryISO,
                        status: appointment.status,
                        createdAt: appointment.createdAt,
                        updatedAt: new Date().toISOString()
                    }
                };
                // Manejo adicional para entorno local
                if (this.config.isOffline) {
                    console.log('Guardando cita en DynamoDB local:', {
                        id: appointment.id,
                        tableName: this.tableName
                    });
                }
                yield this.dynamoDb.put(params).promise();
            }
            catch (error) {
                console.error('Error al guardar cita en DynamoDB:', error);
                // Manejo especial para errores de autenticación en entorno local
                if (this.config.isOffline && error instanceof Error &&
                    (error.message.includes('The security token included in the request is invalid') ||
                        error.message.includes('The Access Key ID or security token is invalid'))) {
                    console.warn('Error de autenticación en entorno local - esto es esperado en desarrollo');
                    return;
                }
                throw new Error(`Error al guardar cita: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Busca citas por ID de asegurado
     */
    findByInsuredId(insuredId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = {
                    TableName: this.tableName,
                    IndexName: 'InsuredIndex',
                    KeyConditionExpression: 'insuredId = :insuredId',
                    ExpressionAttributeValues: {
                        ':insuredId': insuredId
                    }
                };
                // Manejo adicional para entorno local
                if (this.config.isOffline) {
                    console.log('Buscando citas por asegurado en DynamoDB local:', {
                        insuredId,
                        tableName: this.tableName,
                        indexName: params.IndexName
                    });
                }
                const result = yield this.dynamoDb.query(params).promise();
                if (!result.Items || result.Items.length === 0) {
                    return [];
                }
                return result.Items.map(item => this.mapToEntity(item));
            }
            catch (error) {
                console.error('Error al buscar citas por asegurado en DynamoDB:', error);
                if (this.config.isOffline && error instanceof Error &&
                    (error.message.includes('The security token included in the request is invalid') ||
                        error.message.includes('The Access Key ID or security token is invalid'))) {
                    console.warn('Error de autenticación en entorno local - esto es esperado en desarrollo');
                    return [];
                }
                throw new Error(`Error al buscar citas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Busca una cita por su ID
     */
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = {
                    TableName: this.tableName,
                    Key: { id }
                };
                if (this.config.isOffline) {
                    console.log('Buscando cita por ID en DynamoDB local:', {
                        id,
                        tableName: this.tableName
                    });
                }
                const result = yield this.dynamoDb.get(params).promise();
                if (!result.Item) {
                    return null;
                }
                return this.mapToEntity(result.Item);
            }
            catch (error) {
                console.error('Error al buscar cita por ID en DynamoDB:', error);
                if (this.config.isOffline && error instanceof Error &&
                    (error.message.includes('The security token included in the request is invalid') ||
                        error.message.includes('The Access Key ID or security token is invalid'))) {
                    console.warn('Error de autenticación en entorno local - esto es esperado en desarrollo');
                    return null;
                }
                throw new Error(`Error al buscar cita: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Actualiza el estado de una cita
     * @deprecated Use save() con una entidad actualizada en su lugar
     */
    updateStatus(id, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = {
                    TableName: this.tableName,
                    Key: { id },
                    UpdateExpression: 'set #status = :status, updatedAt = :updatedAt',
                    ExpressionAttributeNames: {
                        '#status': 'status'
                    },
                    ExpressionAttributeValues: {
                        ':status': status,
                        ':updatedAt': new Date().toISOString()
                    },
                    ReturnValues: 'NONE'
                };
                if (this.config.isOffline) {
                    console.log('Actualizando estado de cita en DynamoDB local:', {
                        id,
                        status,
                        tableName: this.tableName
                    });
                }
                yield this.dynamoDb.update(params).promise();
            }
            catch (error) {
                console.error('Error al actualizar estado de cita en DynamoDB:', error);
                if (this.config.isOffline && error instanceof Error &&
                    (error.message.includes('The security token included in the request is invalid') ||
                        error.message.includes('The Access Key ID or security token is invalid'))) {
                    console.warn('Error de autenticación en entorno local - esto es esperado en desarrollo');
                    return;
                }
                throw new Error(`Error al actualizar cita: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Convierte un item de DynamoDB a una entidad de dominio
     */
    mapToEntity(item) {
        return new AppointmentEntity_1.AppointmentEntity(item.id, item.insuredId, item.scheduleId, item.countryISO, item.status, item.createdAt);
    }
    /**
     * Elimina una cita (método adicional que podría ser útil)
     */
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = {
                    TableName: this.tableName,
                    Key: { id }
                };
                if (this.config.isOffline) {
                    console.log('Eliminando cita en DynamoDB local:', {
                        id,
                        tableName: this.tableName
                    });
                }
                yield this.dynamoDb.delete(params).promise();
            }
            catch (error) {
                console.error('Error al eliminar cita en DynamoDB:', error);
                // Manejo especial para errores de autenticación en entorno local
                if (this.config.isOffline && error instanceof Error &&
                    (error.message.includes('The security token included in the request is invalid') ||
                        error.message.includes('The Access Key ID or security token is invalid'))) {
                    console.warn('Error de autenticación en entorno local - esto es esperado en desarrollo');
                    return;
                }
                throw new Error(`Error al eliminar cita: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
    /**
     * Busca todas las citas (método adicional que podría ser útil)
     */
    findAll() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const params = {
                    TableName: this.tableName
                };
                // Manejo adicional para entorno local
                if (this.config.isOffline) {
                    console.log('Buscando todas las citas en DynamoDB local:', {
                        tableName: this.tableName
                    });
                }
                const result = yield this.dynamoDb.scan(params).promise();
                if (!result.Items || result.Items.length === 0) {
                    return [];
                }
                return result.Items.map(item => this.mapToEntity(item));
            }
            catch (error) {
                console.error('Error al buscar todas las citas en DynamoDB:', error);
                if (this.config.isOffline && error instanceof Error &&
                    (error.message.includes('The security token included in the request is invalid') ||
                        error.message.includes('The Access Key ID or security token is invalid'))) {
                    console.warn('Error de autenticación en entorno local - esto es esperado en desarrollo');
                    return [];
                }
                throw new Error(`Error al buscar citas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            }
        });
    }
}
exports.DynamoDbAppointmentRepository = DynamoDbAppointmentRepository;
