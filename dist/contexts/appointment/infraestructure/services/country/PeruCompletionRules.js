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
exports.PeruCompletionRules = void 0;
class PeruCompletionRules {
    apply(appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Aplicando reglas de completación para Perú');
            // Notificar a MINSA
            yield this.notifyMINSA(appointment);
            // Actualizar estadísticas de EsSalud
            yield this.updateEsSaludStats(appointment);
        });
    }
    notifyMINSA(appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Notificando a MINSA:', appointment.id);
        });
    }
    updateEsSaludStats(appointment) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('Actualizando estadísticas de EsSalud');
        });
    }
}
exports.PeruCompletionRules = PeruCompletionRules;
