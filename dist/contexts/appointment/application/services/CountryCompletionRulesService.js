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
exports.CountryCompletionRulesService = void 0;
/**
 * Servicio que aplica reglas de completación específicas por país
 */
class CountryCompletionRulesService {
    constructor(peruRules, chileRules) {
        this.peruRules = peruRules;
        this.chileRules = chileRules;
    }
    /**
     * Aplica las reglas de completación según el país
     */
    applyCompletionRules(appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Aplicando reglas de completación para ${appointment.countryISO}`);
            switch (appointment.countryISO) {
                case 'PE':
                    yield this.peruRules.apply(appointment);
                    break;
                case 'CL':
                    yield this.chileRules.apply(appointment);
                    break;
                default:
                    console.warn(`País no reconocido: ${appointment.countryISO}`);
            }
        });
    }
}
exports.CountryCompletionRulesService = CountryCompletionRulesService;
