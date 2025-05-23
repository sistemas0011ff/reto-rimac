"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TOKENS = void 0;
require("reflect-metadata");
const typedi_1 = require("typedi");
const AppointmentService_1 = require("../../contexts/appointment/application/services/AppointmentService");
const DynamoDbAppointmentRepository_1 = require("../../contexts/appointment/infraestructure/repositories/DynamoDbAppointmentRepository");
const SNSNotificationAdapter_1 = require("../../contexts/appointment/infraestructure/adapters/notifications/SNSNotificationAdapter");
const EventBridgeService_1 = require("../../contexts/appointment/infraestructure/services/EventBridgeService");
const CreateAppointmentCommandHandler_1 = require("../../contexts/appointment/application/commands/CreateAppointmentCommandHandler");
const GetAppointmentsByInsuredQueryHandler_1 = require("../../contexts/appointment/application/queries/GetAppointmentsByInsuredQueryHandler");
const PeruAppointmentService_1 = require("../../contexts/appointment/application/services/PeruAppointmentService");
const ChileAppointmentService_1 = require("../../contexts/appointment/application/services/ChileAppointmentService");
const AppointmentCompletionService_1 = require("../../contexts/appointment/application/services/AppointmentCompletionService");
const PeruAppointmentProcessor_1 = require("../../contexts/appointment/infraestructure/processors/PeruAppointmentProcessor");
const ChileAppointmentProcessor_1 = require("../../contexts/appointment/infraestructure/processors/ChileAppointmentProcessor");
const UuidGenerator_1 = require("../../contexts/appointment/infraestructure/services/UuidGenerator");
const PeruCompletionRules_1 = require("../../contexts/appointment/infraestructure/services/country/PeruCompletionRules");
const ChileCompletionRules_1 = require("../../contexts/appointment/infraestructure/services/country/ChileCompletionRules");
const CompletionValidator_1 = require("../../contexts/appointment/domain/services/CompletionValidator");
const CompletionMetricsService_1 = require("../../contexts/appointment/domain/services/CompletionMetricsService");
const CompletionEventPublisher_1 = require("../../contexts/appointment/infraestructure/services/CompletionEventPublisher");
const CountryCompletionRulesService_1 = require("../../contexts/appointment/application/services/CountryCompletionRulesService");
exports.TOKENS = {
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
typedi_1.Container.set(exports.TOKENS.CONFIG, awsConfig);
typedi_1.Container.set(exports.TOKENS.PERU_DB_CONFIG, peruDbConfig);
typedi_1.Container.set(exports.TOKENS.CHILE_DB_CONFIG, chileDbConfig);
typedi_1.Container.set(exports.TOKENS.ID_GENERATOR, new UuidGenerator_1.UuidGenerator());
// ===== PASO 2: REGISTRAR SERVICIOS DE INFRAESTRUCTURA BASE =====
typedi_1.Container.set(exports.TOKENS.APPOINTMENT_REPOSITORY, new DynamoDbAppointmentRepository_1.DynamoDbAppointmentRepository(awsConfig));
typedi_1.Container.set(exports.TOKENS.NOTIFICATION_SERVICE, new SNSNotificationAdapter_1.SNSNotificationAdapter(awsConfig));
typedi_1.Container.set(exports.TOKENS.EVENT_BUS_SERVICE, new EventBridgeService_1.EventBridgeService(Object.assign(Object.assign({}, awsConfig), { defaultEventBusName: awsConfig.eventBusName })));
// ===== PASO 3: REGISTRAR PROCESADORES ESPECÍFICOS POR PAÍS =====
const peruProcessor = new PeruAppointmentProcessor_1.PeruAppointmentProcessor(typedi_1.Container.get(exports.TOKENS.EVENT_BUS_SERVICE), typedi_1.Container.get(exports.TOKENS.PERU_DB_CONFIG));
typedi_1.Container.set(exports.TOKENS.PERU_APPOINTMENT_PROCESSOR, peruProcessor);
// Registrar el procesador de Chile
const chileProcessor = new ChileAppointmentProcessor_1.ChileAppointmentProcessor(typedi_1.Container.get(exports.TOKENS.EVENT_BUS_SERVICE), typedi_1.Container.get(exports.TOKENS.CHILE_DB_CONFIG));
typedi_1.Container.set(exports.TOKENS.CHILE_APPOINTMENT_PROCESSOR, chileProcessor);
// ===== PASO 4: REGISTRAR SERVICIOS DE APLICACIÓN POR PAÍS =====
console.log('Paso 4: Registrando servicios de aplicación por país...');
const peruAppointmentService = new PeruAppointmentService_1.PeruAppointmentService(typedi_1.Container.get(exports.TOKENS.PERU_APPOINTMENT_PROCESSOR));
typedi_1.Container.set(exports.TOKENS.PERU_APPOINTMENT_SERVICE, peruAppointmentService);
const chileAppointmentService = new ChileAppointmentService_1.ChileAppointmentService(typedi_1.Container.get(exports.TOKENS.CHILE_APPOINTMENT_PROCESSOR));
typedi_1.Container.set(exports.TOKENS.CHILE_APPOINTMENT_SERVICE, chileAppointmentService);
// ===== PASO 4.5: REGISTRAR SERVICIO DE COMPLETACIÓN =====
const peruCompletionRules = new PeruCompletionRules_1.PeruCompletionRules();
typedi_1.Container.set(exports.TOKENS.PERU_COMPLETION_RULES, peruCompletionRules);
const chileCompletionRules = new ChileCompletionRules_1.ChileCompletionRules();
typedi_1.Container.set(exports.TOKENS.CHILE_COMPLETION_RULES, chileCompletionRules);
// 2. Registrar validador
const completionValidator = new CompletionValidator_1.CompletionValidator();
typedi_1.Container.set(exports.TOKENS.COMPLETION_VALIDATOR, completionValidator);
// 3. Registrar servicio de métricas
const completionMetricsService = new CompletionMetricsService_1.CompletionMetricsService();
typedi_1.Container.set(exports.TOKENS.COMPLETION_METRICS_SERVICE, completionMetricsService);
// 4. Registrar publicador de eventos
const completionEventPublisher = new CompletionEventPublisher_1.CompletionEventPublisher(typedi_1.Container.get(exports.TOKENS.EVENT_BUS_SERVICE));
typedi_1.Container.set(exports.TOKENS.COMPLETION_EVENT_PUBLISHER, completionEventPublisher);
// 5. Registrar servicio de reglas por país
const countryCompletionRulesService = new CountryCompletionRulesService_1.CountryCompletionRulesService(typedi_1.Container.get(exports.TOKENS.PERU_COMPLETION_RULES), typedi_1.Container.get(exports.TOKENS.CHILE_COMPLETION_RULES));
typedi_1.Container.set(exports.TOKENS.COUNTRY_COMPLETION_RULES_SERVICE, countryCompletionRulesService);
// 6. Actualizar el registro de AppointmentCompletionService con las nuevas dependencias
const appointmentCompletionService = new AppointmentCompletionService_1.AppointmentCompletionService(typedi_1.Container.get(exports.TOKENS.APPOINTMENT_REPOSITORY), typedi_1.Container.get(exports.TOKENS.COMPLETION_VALIDATOR), typedi_1.Container.get(exports.TOKENS.COMPLETION_METRICS_SERVICE), typedi_1.Container.get(exports.TOKENS.COMPLETION_EVENT_PUBLISHER), typedi_1.Container.get(exports.TOKENS.COUNTRY_COMPLETION_RULES_SERVICE));
typedi_1.Container.set(exports.TOKENS.APPOINTMENT_COMPLETION_SERVICE, appointmentCompletionService);
/*
const appointmentCompletionService = new AppointmentCompletionService(
  Container.get(TOKENS.APPOINTMENT_REPOSITORY),
  Container.get(TOKENS.EVENT_BUS_SERVICE)
);
*/
typedi_1.Container.set(exports.TOKENS.APPOINTMENT_COMPLETION_SERVICE, appointmentCompletionService);
// ===== PASO 5: REGISTRAR EL SERVICIO PRINCIPAL =====
typedi_1.Container.set(exports.TOKENS.APPOINTMENT_SERVICE, new AppointmentService_1.AppointmentService(typedi_1.Container.get(exports.TOKENS.APPOINTMENT_REPOSITORY), typedi_1.Container.get(exports.TOKENS.NOTIFICATION_SERVICE), typedi_1.Container.get(exports.TOKENS.EVENT_BUS_SERVICE), typedi_1.Container.get(exports.TOKENS.ID_GENERATOR)));
// ===== PASO 6: REGISTRAR HANDLERS CQRS =====
typedi_1.Container.set(exports.TOKENS.CREATE_APPOINTMENT_COMMAND_HANDLER, new CreateAppointmentCommandHandler_1.CreateAppointmentCommandHandler(typedi_1.Container.get(exports.TOKENS.APPOINTMENT_REPOSITORY), typedi_1.Container.get(exports.TOKENS.NOTIFICATION_SERVICE), typedi_1.Container.get(exports.TOKENS.EVENT_BUS_SERVICE), typedi_1.Container.get(exports.TOKENS.ID_GENERATOR)));
typedi_1.Container.set(exports.TOKENS.GET_APPOINTMENTS_BY_INSURED_QUERY_HANDLER, new GetAppointmentsByInsuredQueryHandler_1.GetAppointmentsByInsuredQueryHandler(typedi_1.Container.get(exports.TOKENS.APPOINTMENT_REPOSITORY)));
// ===== VERIFICAR REGISTROS =====
console.log('=== CONTENEDOR IoC INICIALIZADO CORRECTAMENTE ===');
exports.default = typedi_1.Container;
