// src/contexts/shared/infrastructure/services/UuidGenerator.ts
import { v4 as uuidv4 } from 'uuid';
import { IIdGenerator } from '../../domain/services/IIdGenerator';

/**
 * Implementación del generador de IDs usando UUID v4
 */
export class UuidGenerator implements IIdGenerator {
    /**
     * Genera un UUID v4
     * @returns Un string con formato UUID v4
     */
    generate(): string {
        return uuidv4();
    }
}