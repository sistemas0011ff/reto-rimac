import { IPeruCompletionRules } from "../../../../../contexts/appointment/domain/services/country/IPeruCompletionRules";
import { AppointmentEntity } from "../../../../../contexts/appointment/domain/entities/AppointmentEntity";

export class PeruCompletionRules implements IPeruCompletionRules {
    async apply(appointment: AppointmentEntity): Promise<void> {
        console.log('Aplicando reglas de completación para Perú');
        
        // Notificar a MINSA
        await this.notifyMINSA(appointment);
        
        // Actualizar estadísticas de EsSalud
        await this.updateEsSaludStats(appointment);
    }
    
    private async notifyMINSA(appointment: AppointmentEntity): Promise<void> { 
        console.log('Notificando a MINSA:', appointment.id);
    }
    
    private async updateEsSaludStats(appointment: AppointmentEntity): Promise<void> { 
        console.log('Actualizando estadísticas de EsSalud');
    }
}