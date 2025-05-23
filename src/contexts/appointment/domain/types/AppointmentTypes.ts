/**
 * Datos de una cita médica
 */
export interface AppointmentData {
    id: string;
    insuredId: string;
    scheduleId: string | number;
    countryISO: string;
    status: string;
    createdAt: string;
    updatedAt?: string;
}

/**
 * Datos de confirmación de cita
 */
export interface AppointmentConfirmationData {
    appointmentId: string;
    status: string;
    completedAt: string;
}

/**
 * Mensaje SNS recibido desde SQS
 */
export interface SNSMessageBody {
    Type: string;
    MessageId: string;
    TopicArn: string;
    Subject?: string;
    Message: string;
    Timestamp: string;
    SignatureVersion: string;
    Signature: string;
    SigningCertURL: string;
    UnsubscribeURL: string;
    MessageAttributes?: Record<string, {
        Type: string;
        Value: string;
    }>;
}