export const DAILY_MESSAGE_LIMIT = 30;
export const DAILY_COST_LIMIT_CENTS = 500; // $5.00
export const MESSAGE_WARNING_THRESHOLD = 0.8; // 80%
export const COST_WARNING_THRESHOLD = 0.8; // 80%
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const COOKIE_NAME = "shareclaude_auth";
export const COOKIE_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds
export const INTAKE_COMPLETE_MARKER = "[INTAKE_COMPLETE]";

// Claude pricing (Haiku 4.5) per million tokens
export const INPUT_COST_PER_MILLION = 80; // $0.80 in cents
export const OUTPUT_COST_PER_MILLION = 400; // $4.00 in cents
