/**
 * Bcrypt Type Declarations
 */

declare module 'bcrypt' {
  export function hash(data: string | Buffer, saltOrRounds: string | number): Promise<string>;
  export function compare(data: string, encrypted: string): Promise<boolean>;
  export function genSalt(rounds?: number): Promise<string>;
  export const DEFAULT_ROUNDS: number;
}
