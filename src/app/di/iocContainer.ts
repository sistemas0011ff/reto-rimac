
import 'reflect-metadata';
import { Container } from 'typedi';


import { AppointmentService } from '../../contexts/appointment/application/services/AppointmentService';
import { DynamoDbAppointmentRepository } from '../../contexts/appointment/infraestructure/repositories/DynamoDbAppointmentRepository';
import { SNSNotificationAdapter } from '../../contexts/appointment/infraestructure/adapters/notifications/SNSNotificationAdapter';
import { EventBridgeService } from '../../contexts/appointment/infraestructure/services/EventBridgeService';
import { CreateAppointmentCommandHandler } from '../../contexts/appointment/application/commands/CreateAppointmentCommandHandler';
import { GetAppointmentsByInsuredQueryHandler } from '../../contexts/appointment/application/queries/GetAppointmentsByInsuredQueryHandler';

import { ICountryAppointmentProcessor } from '../../contexts/appointment/domain/ports/ICountryAppointmentProcessor';
import { ICountryAppointmentService } from '../../contexts/appointment/application/interfaces/ICountryAppointmentService';
import { IAppointmentCompletionService } from '../../contexts/appointment/application/interfaces/IAppointmentCompletionService';

import { PeruAppointmentService } from '../../contexts/appointment/application/services/PeruAppointmentService';
import { ChileAppointmentService } from '../../contexts/appointment/application/services/ChileAppointmentService';
import { AppointmentCompletionService } from '../../contexts/appointment/application/services/AppointmentCompletionService';

import { PeruAppointmentProcessor } from '../../contexts/appointment/infraestructure/processors/PeruAppointmentProcessor';
import { ChileAppointmentProcessor } from '../../contexts/appointment/infraestructure/processors/ChileAppointmentProcessor';
import { IIdGenerator } from '../../contexts/appointment/domain/services/IIdGenerator';
import { UuidGenerator } from '../../contexts/appointment/infraestructure/services/UuidGenerator';
import { PeruCompletionRules } from '../../contexts/appointment/infraestructure/services/country/PeruCompletionRules';
import { IPeruCompletionRules } from '../../contexts/appointment/domain/services/country/IPeruCompletionRules';
import { ChileCompletionRules } from '../../contexts/appointment/infraestructure/services/country/ChileCompletionRules';
import { IChileCompletionRules } from '../../contexts/appointment/domain/services/country/IChileCompletionRules';
import { CompletionValidator } from '../../contexts/appointment/domain/services/CompletionValidator';
import { ICompletionValidator } from '../../contexts/appointment/domain/services/ICompletionValidator';
import { CompletionMetricsService } from '../../contexts/appointment/domain/services/CompletionMetricsService';
import { ICompletionMetricsService } from '../../contexts/appointment/domain/services/ICompletionMetricsService';
import { CompletionEventPublisher } from '../../contexts/appointment/infraestructure/services/CompletionEventPublisher';
import { IEventBusService } from '../../contexts/appointment/domain/ports/IEventBusService';
import { CountryCompletionRulesService } from '../../contexts/appointment/application/services/CountryCompletionRulesService';
import { ICompletionEventPublisher } from '../../contexts/appointment/domain/services/ICompletionEventPublisher';
import { ICountryCompletionRulesService } from '../../contexts/appointment/application/interfaces/ICountryCompletionRulesService';
import { IAppointmentRepository } from '../../contexts/appointment/domain/interfaces/IAppointmentRepository';

export const TOKENS = {
  CONFIG: 'aws.config',
  ID_GENERATOR: 'id.generator',
  APPOINTMENT_REPOSITORY: 'appointment.repository',
  NOTIFICATION_SERVICE: 'notification.service',
  EVENT_BUS_SERVICE: 'event.bus.service',
  CREATE_APPOINTMENT_COMMAND_HANDLER: 'create.appointment.command.handler',
  GET_APPOINTMENTS_BY_INSURED_QUERY_HANDLER: 'get.appointments.by.insured.query.handler',
  APPOINTMENT_SERVICE: 'appointment.service',
  APPOINTMENT_COMPLETION_SERVICE: 'appointment.completion.service',
  COMPLETION_VALIDATOR: 'completion.validator',
  COMPLETION_METRICS_SERVICE: 'completion.metrics.service',
  COMPLETION_EVENT_PUBLISHER: 'completion.event.publisher',
  COUNTRY_COMPLETION_RULES_SERVICE: 'country.completion.rules.service',
  PERU_COMPLETION_RULES: 'peru.completion.rules',
  CHILE_COMPLETION_RULES: 'chile.completion.rules',
  // Tokens para procesadores y servicios de país
  PERU_APPOINTMENT_PROCESSOR: 'peru.appointment.processor',
  CHILE_APPOINTMENT_PROCESSOR: 'chile.appointment.processor',
  PERU_APPOINTMENT_SERVICE: 'peru.appointment.service',
  CHILE_APPOINTMENT_SERVICE: 'chile.appointment.service',
  
  // Configuraciones específicas por país
  PERU_DB_CONFIG: 'peru.db.config',
  CHILE_DB_CONFIG: 'chile.db.config'
};

// Configuraciones de entorno
const awsConfig = {
  isOffline: process.env.IS_OFFLINE === 'true',
  region: process.env.REGION || 'us-east-2',
  snsEndpoint: process.env.SNS_ENDPOINT,
  eventBridgeEndpoint: process.env.EVENT_BRIDGE_ENDPOINT,
  dynamoDbEndpoint: process.env.DYNAMODB_ENDPOINT,
  peruTopicArn: process.env.PERU_TOPIC_ARN,
  chileTopicArn: process.env.CHILE_TOPIC_ARN,
  appointmentsTable: process.env.APPOINTMENTS_TABLE,
  eventBusName: process.env.EVENT_BUS_NAME || 'appointment-event-bus'
};

// Configuraciones de bases de datos por país
const peruDbConfig = {
  host: process.env.PE_DB_HOST || '',
  port: process.env.PE_DB_PORT || '',
  user: process.env.PE_DB_USER || '',
  password: process.env.PE_DB_PASSWORD || '',
  database: process.env.PE_DB_NAME || ''
};

const chileDbConfig = {
  host: process.env.CL_DB_HOST || '',
  port: process.env.CL_DB_PORT || '',
  user: process.env.CL_DB_USER || '',
  password: process.env.CL_DB_PASSWORD || '',
  database: process.env.CL_DB_NAME || ''
};

// ===== PASO 1: REGISTRAR CONFIGURACIONES =====
Container.set(TOKENS.CONFIG, awsConfig);
Container.set(TOKENS.PERU_DB_CONFIG, peruDbConfig);
Container.set(TOKENS.CHILE_DB_CONFIG, chileDbConfig);

Container.set<IIdGenerator>(TOKENS.ID_GENERATOR, new UuidGenerator());

// ===== PASO 2: REGISTRAR SERVICIOS DE INFRAESTRUCTURA BASE =====
Container.set(TOKENS.APPOINTMENT_REPOSITORY, new DynamoDbAppointmentRepository(awsConfig));
Container.set(TOKENS.NOTIFICATION_SERVICE, new SNSNotificationAdapter(awsConfig));
Container.set(TOKENS.EVENT_BUS_SERVICE, new EventBridgeService({
  ...awsConfig,
  defaultEventBusName: awsConfig.eventBusName
}));

// ===== PASO 3: REGISTRAR PROCESADORES ESPECÍFICOS POR PAÍS =====
const peruProcessor = new PeruAppointmentProcessor(
  Container.get(TOKENS.EVENT_BUS_SERVICE),
  Container.get(TOKENS.PERU_DB_CONFIG)
);
Container.set<ICountryAppointmentProcessor>(TOKENS.PERU_APPOINTMENT_PROCESSOR, peruProcessor);

// Registrar el procesador de Chile
const chileProcessor = new ChileAppointmentProcessor(
  Container.get(TOKENS.EVENT_BUS_SERVICE),
  Container.get(TOKENS.CHILE_DB_CONFIG)
);
Container.set<ICountryAppointmentProcessor>(TOKENS.CHILE_APPOINTMENT_PROCESSOR, chileProcessor);

// ===== PASO 4: REGISTRAR SERVICIOS DE APLICACIÓN POR PAÍS =====
console.log('Paso 4: Registrando servicios de aplicación por país...');

const peruAppointmentService = new PeruAppointmentService(
  Container.get<ICountryAppointmentProcessor>(TOKENS.PERU_APPOINTMENT_PROCESSOR)
);
Container.set<ICountryAppointmentService>(TOKENS.PERU_APPOINTMENT_SERVICE, peruAppointmentService);

const chileAppointmentService = new ChileAppointmentService(
  Container.get<ICountryAppointmentProcessor>(TOKENS.CHILE_APPOINTMENT_PROCESSOR)
);
Container.set<ICountryAppointmentService>(TOKENS.CHILE_APPOINTMENT_SERVICE, chileAppointmentService);

// ===== PASO 4.5: REGISTRAR SERVICIO DE COMPLETACIÓN =====
const peruCompletionRules = new PeruCompletionRules();
Container.set<IPeruCompletionRules>(TOKENS.PERU_COMPLETION_RULES, peruCompletionRules);

const chileCompletionRules = new ChileCompletionRules();
Container.set<IChileCompletionRules>(TOKENS.CHILE_COMPLETION_RULES, chileCompletionRules);

// 2. Registrar validador
const completionValidator = new CompletionValidator();
Container.set<ICompletionValidator>(TOKENS.COMPLETION_VALIDATOR, completionValidator);

// 3. Registrar servicio de métricas
const completionMetricsService = new CompletionMetricsService();
Container.set<ICompletionMetricsService>(TOKENS.COMPLETION_METRICS_SERVICE, completionMetricsService);

// 4. Registrar publicador de eventos
const completionEventPublisher = new CompletionEventPublisher(
    Container.get<IEventBusService>(TOKENS.EVENT_BUS_SERVICE)
);
Container.set<ICompletionEventPublisher>(TOKENS.COMPLETION_EVENT_PUBLISHER, completionEventPublisher);

// 5. Registrar servicio de reglas por país
const countryCompletionRulesService = new CountryCompletionRulesService(
    Container.get<IPeruCompletionRules>(TOKENS.PERU_COMPLETION_RULES),
    Container.get<IChileCompletionRules>(TOKENS.CHILE_COMPLETION_RULES)
);
Container.set<ICountryCompletionRulesService>(TOKENS.COUNTRY_COMPLETION_RULES_SERVICE, countryCompletionRulesService);

// 6. Actualizar el registro de AppointmentCompletionService con las nuevas dependencias
const appointmentCompletionService = new AppointmentCompletionService(
    Container.get<IAppointmentRepository>(TOKENS.APPOINTMENT_REPOSITORY),
    Container.get<ICompletionValidator>(TOKENS.COMPLETION_VALIDATOR),
    Container.get<ICompletionMetricsService>(TOKENS.COMPLETION_METRICS_SERVICE),
    Container.get<ICompletionEventPublisher>(TOKENS.COMPLETION_EVENT_PUBLISHER),
    Container.get<ICountryCompletionRulesService>(TOKENS.COUNTRY_COMPLETION_RULES_SERVICE)
);
Container.set<IAppointmentCompletionService>(TOKENS.APPOINTMENT_COMPLETION_SERVICE, appointmentCompletionService);
/*
const appointmentCompletionService = new AppointmentCompletionService(
  Container.get(TOKENS.APPOINTMENT_REPOSITORY),
  Container.get(TOKENS.EVENT_BUS_SERVICE)
);
*/
Container.set<IAppointmentCompletionService>(
  TOKENS.APPOINTMENT_COMPLETION_SERVICE,
  appointmentCompletionService
);

// ===== PASO 5: REGISTRAR EL SERVICIO PRINCIPAL =====
Container.set(
  TOKENS.APPOINTMENT_SERVICE, 
  new AppointmentService(
    Container.get(TOKENS.APPOINTMENT_REPOSITORY),
    Container.get(TOKENS.NOTIFICATION_SERVICE),
    Container.get(TOKENS.EVENT_BUS_SERVICE),
    Container.get(TOKENS.ID_GENERATOR)
  )
);

// ===== PASO 6: REGISTRAR HANDLERS CQRS =====
Container.set(
  TOKENS.CREATE_APPOINTMENT_COMMAND_HANDLER, 
  new CreateAppointmentCommandHandler(
    Container.get(TOKENS.APPOINTMENT_REPOSITORY),
    Container.get(TOKENS.NOTIFICATION_SERVICE),
    Container.get(TOKENS.EVENT_BUS_SERVICE),
    Container.get(TOKENS.ID_GENERATOR)
  )
);

Container.set(
  TOKENS.GET_APPOINTMENTS_BY_INSURED_QUERY_HANDLER, 
  new GetAppointmentsByInsuredQueryHandler(
    Container.get(TOKENS.APPOINTMENT_REPOSITORY)
  )
);

// ===== VERIFICAR REGISTROS =====

console.log('=== CONTENEDOR IoC INICIALIZADO CORRECTAMENTE ===');
export default Container;