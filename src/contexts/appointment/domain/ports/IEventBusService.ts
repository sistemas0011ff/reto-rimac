import { EventType } from '../events/EventTypes';
import { DomainEvent } from '../events/DomainEvent';
import { 
    AppointmentCreatedEventData,
    AppointmentCompletedEventData,
    AppointmentCancelledEventData
} from '../events/AppointmentEvents';
import { CustomEventConfig, CustomEventData } from '../types/CustomEventTypes';

/**
 * Puerto secundario para el servicio de bus de eventos
 * Permite a los componentes del dominio publicar eventos sin conocer
 * los detalles de implementación específicos
 */
export interface IEventBusService {
    /**
     * Publica un evento en el bus de eventos
     * 
     * @param event Evento a publicar
     * @returns Promesa que se resuelve con el ID del evento publicado
     */
    publish<T>(event: DomainEvent<T>): Promise<string>;
    
    /**
     * Publica un evento en un bus específico
     * 
     * @param busName Nombre del bus de eventos específico
     * @param event Evento a publicar
     * @returns Promesa que se resuelve con el ID del evento publicado
     */
    publishToBus<T>(busName: string, event: DomainEvent<T>): Promise<string>;
    
    /**
     * Crea un evento de creación de cita
     * 
     * @param data Datos de la cita creada
     * @param source Origen del evento
     * @returns Evento de creación de cita
     */
    createAppointmentCreatedEvent(
        data: AppointmentCreatedEventData, 
        source?: string
    ): DomainEvent<AppointmentCreatedEventData>;
    
    /**
     * Crea un evento de cita completada
     * 
     * @param data Datos de la cita completada
     * @param source Origen del evento
     * @returns Evento de cita completada
     */
    createAppointmentCompletedEvent(
        data: AppointmentCompletedEventData,
        source?: string
    ): DomainEvent<AppointmentCompletedEventData>;
    
    /**
     * Crea un evento de cita cancelada
     * 
     * @param data Datos de la cita cancelada
     * @param source Origen del evento
     * @returns Evento de cita cancelada
     */
    createAppointmentCancelledEvent(
        data: AppointmentCancelledEventData,
        source?: string
    ): DomainEvent<AppointmentCancelledEventData>;
    
    /**
     * Crea un evento genérico del dominio
     * 
     * @param type Tipo de evento
     * @param data Datos asociados al evento
     * @param source Origen del evento
     * @returns Evento del dominio
     */
    createEvent<T>(type: EventType, data: T, source?: string): DomainEvent<T>;
    
    /**
     * Crea un evento personalizado con tipos específicos
     * 
     * @param eventConfig Configuración del evento personalizado tipado
     * @returns Evento personalizado tipado
     */
    createCustomEvent<T extends CustomEventData>(
        eventConfig: CustomEventConfig<T>
    ): DomainEvent<T>;
}