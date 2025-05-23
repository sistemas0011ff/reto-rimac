import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  // Habilita la limpieza automática de llamadas, instancias y resultados de mocks antes de cada prueba
  clearMocks: true,

  // Indica que se debe recopilar información de cobertura de pruebas
  collectCoverage: true,

  // Directorio donde Jest debe guardar los archivos de cobertura
  coverageDirectory: "coverage",

  // Proveedor de cobertura utilizado
  coverageProvider: "v8",

  // Configuración para TypeScript
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Configuración de módulos y extensiones
  moduleFileExtensions: ['js', 'json', 'jsx', 'ts', 'tsx', 'node'],

  // Patrones para ignorar al recopilar cobertura
  coveragePathIgnorePatterns: ['\\\\node_modules\\\\'],

  // Rutas de los módulos que Jest debe utilizar para buscar archivos
  moduleDirectories: ['node_modules'],

  // Patrones globales para detectar archivos de prueba
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],

  // Patrones para ignorar al buscar archivos de prueba
  testPathIgnorePatterns: ['\\\\node_modules\\\\'],

  // Configuraciones adicionales
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  // Habilita información detallada durante la ejecución
  verbose: true,
};

export default config;
