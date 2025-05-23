/**
 * Interfaz para la generación de identificadores únicos
 */
export interface IIdGenerator {
    /**
     * Genera un identificador único
     * @returns Un string con el ID generado
     */
    generate(): string;
}