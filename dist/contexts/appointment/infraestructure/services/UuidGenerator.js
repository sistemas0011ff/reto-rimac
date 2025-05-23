"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UuidGenerator = void 0;
// src/contexts/shared/infrastructure/services/UuidGenerator.ts
const uuid_1 = require("uuid");
/**
 * Implementación del generador de IDs usando UUID v4
 */
class UuidGenerator {
    /**
     * Genera un UUID v4
     * @returns Un string con formato UUID v4
     */
    generate() {
        return (0, uuid_1.v4)();
    }
}
exports.UuidGenerator = UuidGenerator;
