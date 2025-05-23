/**
 * Value Object que representa las estadísticas de completación
 */
export class CompletionStats {
    constructor(
        public readonly totalCompleted: number,
        public readonly completedToday: number,
        public readonly averageCompletionTime: number,
        public readonly lastCompletionAt: string
    ) {
        this.validate();
    }
    
    /**
     * Valida los datos de las estadísticas
     */
    private validate(): void {
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
    private isValidDate(dateString: string): boolean {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }
    
    /**
     * Crea una instancia vacía (sin completaciones)
     */
    static createEmpty(): CompletionStats {
        return new CompletionStats(0, 0, 0, '');
    }
    
    /**
     * Crea una instancia desde un objeto plano
     */
    static fromObject(data: {
        totalCompleted: number;
        completedToday: number;
        averageCompletionTime: number;
        lastCompletionAt: string;
    }): CompletionStats {
        return new CompletionStats(
            data.totalCompleted,
            data.completedToday,
            data.averageCompletionTime,
            data.lastCompletionAt
        );
    }
    
    /**
     * Obtiene el tiempo promedio en minutos
     */
    getAverageTimeInMinutes(): number {
        return Math.round(this.averageCompletionTime / 60000);
    }
    
    /**
     * Obtiene el tiempo promedio en formato legible
     */
    getAverageTimeFormatted(): string {
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
    hasCompletions(): boolean {
        return this.totalCompleted > 0;
    }
    
    /**
     * Obtiene el porcentaje de completaciones de hoy respecto al total
     */
    getTodayPercentage(): number {
        if (this.totalCompleted === 0) return 0;
        return Math.round((this.completedToday / this.totalCompleted) * 100);
    }
    
    /**
     * Convierte a objeto plano para serialización
     */
    toJSON(): {
        totalCompleted: number;
        completedToday: number;
        averageCompletionTime: number;
        averageCompletionTimeFormatted: string;
        lastCompletionAt: string;
        todayPercentage: number;
    } {
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