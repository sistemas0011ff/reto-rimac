import { AppointmentEntity } from "../entities/AppointmentEntity";
import { AppointmentCompletionData } from "../types/AppointmentCompletionTypes";

export interface ICompletionEventPublisher {
    publishFinalCompletionEvent(
        appointment: AppointmentEntity, 
        confirmationData: AppointmentCompletionData
    ): Promise<void>;
    
    publishCompletionErrorEvent(
        appointmentId: string,
        error: Error
    ): Promise<void>;
}