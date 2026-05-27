/**
 * Logger centralizado.
 * En producción solo loguea errores; en dev loguea todo.
 * Usar siempre en vez de console.log directo.
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /** Mensaje informativo — solo en dev */
  info: (context: string, ...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.info(`[${context}]`, ...args);
    }
  },

  /** Warning — dev y producción */
  warn: (context: string, ...args: unknown[]): void => {
    console.warn(`[${context}]`, ...args);
  },

  /** Error — siempre loguea */
  error: (context: string, ...args: unknown[]): void => {
    console.error(`[${context}]`, ...args);
  },
};
