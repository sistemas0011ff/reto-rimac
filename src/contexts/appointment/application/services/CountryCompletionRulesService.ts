import { AppointmentEntity } from '../../domain/entities/AppointmentEntity';
import { IPeruCompletionRules } from '../../domain/services/country/IPeruCompletionRules';
import { IChileCompletionRules } from '../../domain/services/country/IChileCompletionRules';
import { ICountryCompletionRulesService } from '../interfaces/ICountryCompletionRulesService';

/**
 * Servicio que aplica reglas de completación específicas por país
 */
export class CountryCompletionRulesService implements ICountryCompletionRulesService {
    constructor(
        private readonly peruRules: IPeruCompletionRules,
        private readonly chileRules: IChileCompletionRules
    ) {}
    
    /**
     * Aplica las reglas de completación según el país
     */
    async applyCompletionRules(appointment: AppointmentEntity): Promise<void> {
        console.log(`Aplicando reglas de completación para ${appointment.countryISO}`);
        
        switch (appointment.countryISO) {
            case 'PE':
                await this.peruRules.apply(appointment);
                break;
            case 'CL':
                await this.chileRules.apply(appointment);
                break;
            default:
                console.warn(`País no reconocido: ${appointment.countryISO}`);
        }
    }
}