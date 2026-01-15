import { schemas } from "./src/lib/forms/schema.js";

// Export the form schema for use in consumers' src/content/config.ts
export const formCollectionSchema = schemas.form;
export const fieldSchema = schemas.field;
export const emailSchema = schemas.email;
export const securitySchema = schemas.security;

export default formCollectionSchema;
