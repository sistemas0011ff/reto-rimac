import { DynamoDB } from 'aws-sdk';
import { AppointmentEntity } from '../../domain/entities/AppointmentEntity';
import { IAppointmentRepository } from '../../domain/interfaces/IAppointmentRepository';

/**
 * Configuración para el repositorio DynamoDB
 */
export interface DynamoDbConfig {
    isOffline?: boolean;
    region?: string;
    dynamoDbEndpoint?: string;
    appointmentsTable?: string;
}

/**
 * Implementación del repositorio de citas médicas utilizando DynamoDB
 */
export class DynamoDbAppointmentRepository implements IAppointmentRepository {
    private dynamoDb: DynamoDB.DocumentClient;
    private tableName: string;
    
    /**
     * @param config Configuración para DynamoDB
     */
   constructor(private config: DynamoDbConfig) {
        
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

            const dynamoDbOptions: DynamoDB.ClientConfiguration = {
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
            
            const dynamoDb = new DynamoDB(dynamoDbOptions);
            this.dynamoDb = new DynamoDB.DocumentClient({ service: dynamoDb });
        } else {
            console.log('DynamoDbAppointmentRepository configurado para AWS REAL'); 
            
            this.dynamoDb = new DynamoDB.DocumentClient({
                region: config.region || process.env.AWS_REGION || 'us-east-2'
            });
        }
        
        this.tableName = config.appointmentsTable || process.env.APPOINTMENTS_TABLE || 'Appointments';
    }
    /**
     * Guarda una cita en DynamoDB
     * Si la cita ya existe, se actualiza
     */
    async save(appointment: AppointmentEntity): Promise<void> {
        try {
            const params: DynamoDB.DocumentClient.PutItemInput = {
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
            
            await this.dynamoDb.put(params).promise();
            
        } catch (error) {
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
    }
    
    /**
     * Busca citas por ID de asegurado
     */
    async findByInsuredId(insuredId: string): Promise<AppointmentEntity[]> {
        try {
            const params: DynamoDB.DocumentClient.QueryInput = {
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
            
            const result = await this.dynamoDb.query(params).promise();
            
            if (!result.Items || result.Items.length === 0) {
                return [];
            }
            
            return result.Items.map(item => this.mapToEntity(item));
            
        } catch (error) {
            console.error('Error al buscar citas por asegurado en DynamoDB:', error);
             
            if (this.config.isOffline && error instanceof Error && 
                (error.message.includes('The security token included in the request is invalid') ||
                 error.message.includes('The Access Key ID or security token is invalid'))) {
                console.warn('Error de autenticación en entorno local - esto es esperado en desarrollo');
               
                return [];
            }
            
            throw new Error(`Error al buscar citas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    
    /**
     * Busca una cita por su ID
     */
    async findById(id: string): Promise<AppointmentEntity | null> {
        try {
            const params: DynamoDB.DocumentClient.GetItemInput = {
                TableName: this.tableName,
                Key: { id }
            };
             
            if (this.config.isOffline) {
                console.log('Buscando cita por ID en DynamoDB local:', {
                    id,
                    tableName: this.tableName
                });
            }
            
            const result = await this.dynamoDb.get(params).promise();
            
            if (!result.Item) {
                return null;
            }
            
            return this.mapToEntity(result.Item);
            
        } catch (error) {
            console.error('Error al buscar cita por ID en DynamoDB:', error);
             
            if (this.config.isOffline && error instanceof Error && 
                (error.message.includes('The security token included in the request is invalid') ||
                 error.message.includes('The Access Key ID or security token is invalid'))) {
                console.warn('Error de autenticación en entorno local - esto es esperado en desarrollo');
              
                return null;
            }
            
            throw new Error(`Error al buscar cita: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    
    /**
     * Actualiza el estado de una cita
     * @deprecated Use save() con una entidad actualizada en su lugar
     */
    async updateStatus(id: string, status: string): Promise<void> {
        try {
            const params: DynamoDB.DocumentClient.UpdateItemInput = {
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
            
            await this.dynamoDb.update(params).promise();
            
        } catch (error) {
            console.error('Error al actualizar estado de cita en DynamoDB:', error);
             
            if (this.config.isOffline && error instanceof Error && 
                (error.message.includes('The security token included in the request is invalid') ||
                 error.message.includes('The Access Key ID or security token is invalid'))) {
                console.warn('Error de autenticación en entorno local - esto es esperado en desarrollo');
      
                return;
            }
            
            throw new Error(`Error al actualizar cita: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
    
    /**
     * Convierte un item de DynamoDB a una entidad de dominio
     */
    private mapToEntity(item: any): AppointmentEntity {
        return new AppointmentEntity(
            item.id,
            item.insuredId,
            item.scheduleId,
            item.countryISO,
            item.status,
            item.createdAt
        );
    }
    
    /**
     * Elimina una cita (método adicional que podría ser útil)
     */
    async delete(id: string): Promise<void> {
        try {
            const params: DynamoDB.DocumentClient.DeleteItemInput = {
                TableName: this.tableName,
                Key: { id }
            };
             
            if (this.config.isOffline) {
                console.log('Eliminando cita en DynamoDB local:', {
                    id,
                    tableName: this.tableName
                });
            }
            
            await this.dynamoDb.delete(params).promise();
            
        } catch (error) {
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
    }
    
    /**
     * Busca todas las citas (método adicional que podría ser útil)
     */
    async findAll(): Promise<AppointmentEntity[]> {
        try {
            const params: DynamoDB.DocumentClient.ScanInput = {
                TableName: this.tableName
            };
            
            // Manejo adicional para entorno local
            if (this.config.isOffline) {
                console.log('Buscando todas las citas en DynamoDB local:', {
                    tableName: this.tableName
                });
            }
            
            const result = await this.dynamoDb.scan(params).promise();
            
            if (!result.Items || result.Items.length === 0) {
                return [];
            }
            
            return result.Items.map(item => this.mapToEntity(item));
            
        } catch (error) {
            console.error('Error al buscar todas las citas en DynamoDB:', error);
            
            if (this.config.isOffline && error instanceof Error && 
                (error.message.includes('The security token included in the request is invalid') ||
                 error.message.includes('The Access Key ID or security token is invalid'))) {
                console.warn('Error de autenticación en entorno local - esto es esperado en desarrollo');
                return [];
            }
            
            throw new Error(`Error al buscar citas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    }
}