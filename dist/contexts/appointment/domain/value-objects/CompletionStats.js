"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionStats = void 0;
/**
 * Value Object que representa las estadísticas de completación
 */
class CompletionStats {
    constructor(totalCompleted, completedToday, averageCompletionTime, lastCompletionAt) {
        this.totalCompleted = totalCompleted;
        this.completedToday = completedToday;
        this.averageCompletionTime = averageCompletionTime;
        this.lastCompletionAt = lastCompletionAt;
        this.validate();
    }
    /**
     * Valida los datos de las estadísticas
     */
    validate() {
        if (this.totalCompleted < 0) {
            throw new Error('El total completado no puede ser negativo');
        }
        if (this.completedToday < 0) {
            throw new Error('Las completadas hoy no pueden ser negativas');
        }
        if (this.completedToday > this.totalCompleted) {
            throw new Error('Las completadas hoy no pueden exceder el total');
        }
        if (this.averageCompletionTime < 0) {
            throw new Error('El tiempo promedio no puede ser negativo');
        }
        if (this.lastCompletionAt && !this.isValidDate(this.lastCompletionAt)) {
            throw new Error('Formato de fecha inválido para lastCompletionAt');
        }
    }
    /**
     * Valida formato de fecha ISO
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }
    /**
     * Crea una instancia vacía (sin completaciones)
     */
    static createEmpty() {
        return new CompletionStats(0, 0, 0, '');
    }
    /**
     * Crea una instancia desde un objeto plano
     */
    static fromObject(data) {
        return new CompletionStats(data.totalCompleted, data.completedToday, data.averageCompletionTime, data.lastCompletionAt);
    }
    /**
     * Obtiene el tiempo promedio en minutos
     */
    getAverageTimeInMinutes() {
        return Math.round(this.averageCompletionTime / 60000);
    }
    /**
     * Obtiene el tiempo promedio en formato legible
     */
    getAverageTimeFormatted() {
        const minutes = this.getAverageTimeInMinutes();
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`;
        }
        return `${minutes}m`;
    }
    /**
     * Verifica si hay completaciones
     */
    hasCompletions() {
        return this.totalCompleted > 0;
    }
    /**
     * Obtiene el porcentaje de completaciones de hoy respecto al total
     */
    getTodayPercentage() {
        if (this.totalCompleted === 0)
            return 0;
        return Math.round((this.completedToday / this.totalCompleted) * 100);
    }
    /**
     * Convierte a objeto plano para serialización
     */
    toJSON() {
        return {
            totalCompleted: this.totalCompleted,
            completedToday: this.completedToday,
            averageCompletionTime: this.averageCompletionTime,
            averageCompletionTimeFormatted: this.getAverageTimeFormatted(),
            lastCompletionAt: this.lastCompletionAt,
            todayPercentage: this.getTodayPercentage()
        };
    }
}
exports.CompletionStats = CompletionStats;
