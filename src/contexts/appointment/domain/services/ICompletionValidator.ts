import { AppointmentEntity } from "../entities/AppointmentEntity";
import { AppointmentCompletionData } from "../types/AppointmentCompletionTypes";

export interface ICompletionValidator {
    validateConfirmationData(confirmationData: AppointmentCompletionData): void;
    validateAppointmentStatus(appointment: AppointmentEntity): void;
}