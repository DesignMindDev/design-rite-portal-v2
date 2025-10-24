/**
 * Rate Limit Configuration for Portal V2 API Endpoints
 *
 * Centralized configuration for all rate limiting rules
 */

import { RateLimitConfig } from './rate-limit'

/**
 * Rate limit configurations for different endpoint categories
 */
export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // Admin endpoints - Very strict
  'admin.render': {
    interval: 10 * 60 * 1000, // 10 minutes
    maxRequests: 10,
    message: 'Too many Render API requests. Please wait 10 minutes before trying again.'
  },

  'admin.users': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Too many user management requests. Please slow down.'
  },

  'admin.operations': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many admin operations. Please wait before trying again.'
  },

  // Demo dashboard - Moderate
  'demo.dashboard': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 30,
    message: 'Too many dashboard requests. Please slow down.'
  },

  // Workspace endpoints - Standard
  'workspace.labor': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 60,
    message: 'Too many labor calculation requests. Please wait a moment.'
  },

  'workspace.documents': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Too many document requests. Please slow down.'
  },

  // Authentication endpoints - Strict
  'auth.login': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many login attempts. Please wait before trying again.'
  },

  'auth.signup': {
    interval: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    message: 'Too many signup attempts. Please wait an hour before trying again.'
  },

  'auth.password.reset': {
    interval: 60 * 60 * 1000, // 1 hour
    maxRequests: 3,
    message: 'Too many password reset requests. Please check your email or wait an hour.'
  },

  'auth.callback': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many authentication callbacks. Please wait before trying again.'
  },

  // Payment endpoints - Very strict
  'stripe.checkout': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many checkout attempts. Please wait before trying again.'
  },

  'stripe.portal': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many customer portal requests. Please wait a moment.'
  },

  // File uploads - Strict
  'upload.image': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many file uploads. Please wait before uploading more files.'
  },

  'upload.document': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 5,
    message: 'Too many document uploads. Please wait before uploading more documents.'
  },

  // AI endpoints - Expensive operations
  'ai.chat': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 20,
    message: 'Too many AI requests. Please wait before sending more messages.'
  },

  'ai.analysis': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Too many AI analysis requests. Please wait before analyzing more documents.'
  },

  // General API - Default rate limit
  'api.default': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'API rate limit exceeded. Please slow down your requests.'
  },

  // Health check - Very lenient
  'health.check': {
    interval: 60 * 1000, // 1 minute
    maxRequests: 1000,
    message: 'Too many health check requests.'
  }
}

/**
 * Get rate limit configuration for a specific endpoint
 */
export function getRateLimitConfig(endpoint: string): RateLimitConfig {
  return rateLimitConfigs[endpoint] || rateLimitConfigs['api.default']
}

/**
 * Rate limit groups for easy application to multiple endpoints
 */
export const rateLimitGroups = {
  admin: [
    'admin.render',
    'admin.users',
    'admin.operations'
  ],
  workspace: [
    'workspace.labor',
    'workspace.documents'
  ],
  auth: [
    'auth.login',
    'auth.signup',
    'auth.password.reset',
    'auth.callback'
  ],
  payment: [
    'stripe.checkout',
    'stripe.portal'
  ],
  upload: [
    'upload.image',
    'upload.document'
  ],
  ai: [
    'ai.chat',
    'ai.analysis'
  ]
}

/**
 * IP-based rate limiting for DDoS protection
 * More aggressive limits for unauthenticated requests
 */
export const ipRateLimits: RateLimitConfig = {
  interval: 60 * 1000, // 1 minute
  maxRequests: 200, // Total requests per IP per minute
  message: 'Too many requests from this IP address. Please slow down.'
}

/**
 * Global rate limit for the entire API
 * Applied at the middleware level
 */
export const globalRateLimit: RateLimitConfig = {
  interval: 60 * 1000, // 1 minute
  maxRequests: 500, // Total API requests per minute
  message: 'Global API rate limit exceeded. Please reduce your request rate.'
}