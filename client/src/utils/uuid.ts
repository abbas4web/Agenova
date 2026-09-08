/**
 * Re-exports uuid v4 for consistent usage across the client.
 * If uuid needs to be swapped for crypto.randomUUID() later,
 * change it here only.
 */
export { v4 as generateId } from 'uuid';
