/**
 * src/docs/swagger.ts
 *
 * OpenAPI 3.0 specification for the entire API.
 *
 * All schemas and path definitions are maintained here — no JSDoc scanning.
 * This gives complete control over the spec and makes it easier to review.
 *
 * Endpoints:
 *   GET  /api/docs      → Swagger UI
 *   GET  /api/docs.json → Raw OpenAPI JSON
 */

import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { type Application } from 'express';
import { env } from '../config/env';

// ─── Reusable Schema Components ───────────────────────────────────────────────

const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description:
        'Enter the JWT access token obtained from /auth/login or /auth/register.\n\nFormat: `Bearer <token>`',
    },
  },
  schemas: {
    // ── Responses ─────────────────────────────────────────────────────────

    SuccessResponse: {
      type: 'object',
      required: ['success', 'message'],
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Success' },
        data: { type: 'object' },
      },
    },

    ErrorResponse: {
      type: 'object',
      required: ['success', 'message', 'error'],
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Something went wrong' },
        error: {
          type: 'object',
          required: ['code'],
          properties: {
            code: { type: 'string', example: 'SOME_ERROR_CODE' },
          },
        },
      },
    },

    ValidationErrorResponse: {
      type: 'object',
      required: ['success', 'message', 'errors'],
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Validation failed' },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            required: ['field', 'message'],
            properties: {
              field: { type: 'string', example: 'email' },
              message: { type: 'string', example: 'Invalid email address' },
            },
          },
        },
      },
    },

    // ── Domain Models ─────────────────────────────────────────────────────

    Profile: {
      type: 'object',
      description: 'Full user profile — returned ONLY to the profile owner.',
      required: [
        'id',
        'email',
        'name',
        'role',
        'locale',
        'isVerified',
        'isPrivate',
        'createdAt',
        'updatedAt',
      ],
      properties: {
        id: {
          type: 'string',
          format: 'uuid',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        name: { type: 'string', example: 'Emir' },
        username: { type: 'string', nullable: true, example: 'emir_dev' },
        bio: { type: 'string', nullable: true, example: 'Full-stack engineer & 3D enthusiast' },
        avatarUrl: { type: 'string', nullable: true, example: 'https://example.com/avatar.jpg' },
        websiteUrl: { type: 'string', nullable: true, example: 'https://emir.dev' },
        location: { type: 'string', nullable: true, example: 'Istanbul, TR' },
        role: {
          type: 'string',
          enum: ['user', 'admin', 'moderator'],
          example: 'user',
        },
        locale: {
          type: 'string',
          enum: ['en', 'tr'],
          example: 'tr',
          description: 'User preferred language',
        },
        isVerified: {
          type: 'boolean',
          example: true,
          description: 'Verified badge (blue tick) status',
        },
        verifiedAt: {
          type: 'string',
          format: 'date-time',
          nullable: true,
          example: '2024-01-01T00:00:00.000Z',
        },
        isPrivate: {
          type: 'boolean',
          example: false,
          description: 'Whether the profile is hidden from non-owners',
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-01-01T00:00:00.000Z',
        },
      },
    },

    PublicProfileView: {
      type: 'object',
      description: 'Public profile view — returned to non-owners for public profiles (isPrivate = false). Excludes private email and locale fields.',
      required: [
        'id',
        'name',
        'role',
        'isVerified',
        'isPrivate',
        'createdAt',
        'updatedAt',
      ],
      properties: {
        id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
        name: { type: 'string', example: 'Emir' },
        username: { type: 'string', nullable: true, example: 'emir_dev' },
        bio: { type: 'string', nullable: true, example: 'Full-stack engineer & 3D enthusiast' },
        avatarUrl: { type: 'string', nullable: true, example: 'https://example.com/avatar.jpg' },
        websiteUrl: { type: 'string', nullable: true, example: 'https://emir.dev' },
        location: { type: 'string', nullable: true, example: 'Istanbul, TR' },
        role: {
          type: 'string',
          enum: ['user', 'admin', 'moderator'],
          example: 'user',
        },
        isVerified: { type: 'boolean', example: true },
        verifiedAt: { type: 'string', format: 'date-time', nullable: true, example: '2024-01-01T00:00:00.000Z' },
        isPrivate: { type: 'boolean', example: false },
        createdAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
      },
    },

    PrivateProfileView: {
      type: 'object',
      description: 'Limited private profile view — returned to non-owners when a profile is private (isPrivate = true).',
      required: ['id', 'isVerified', 'isPrivate'],
      properties: {
        id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
        username: { type: 'string', nullable: true, example: 'emir_dev' },
        avatarUrl: { type: 'string', nullable: true, example: 'https://example.com/avatar.jpg' },
        bio: { type: 'string', nullable: true, example: 'Full-stack engineer & 3D enthusiast' },
        isVerified: { type: 'boolean', example: true },
        isPrivate: { type: 'boolean', example: true },
      },
    },

    Friendship: {
      type: 'object',
      required: ['id', 'requesterId', 'addresseeId', 'status', 'createdAt', 'updatedAt'],
      properties: {
        id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
        requesterId: { type: 'string', format: 'uuid', example: '11111111-e29b-41d4-a716-446655440000' },
        addresseeId: { type: 'string', format: 'uuid', example: '22222222-e29b-41d4-a716-446655440000' },
        status: { type: 'string', enum: ['pending', 'accepted', 'blocked'], example: 'pending' },
        createdAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
      },
    },

    FriendRequestItem: {
      type: 'object',
      required: ['id', 'status', 'createdAt', 'user'],
      properties: {
        id: { type: 'string', format: 'uuid', example: '550e8400-e29b-41d4-a716-446655440000' },
        status: { type: 'string', enum: ['pending', 'accepted', 'blocked'], example: 'pending' },
        createdAt: { type: 'string', format: 'date-time', example: '2024-01-01T00:00:00.000Z' },
        user: { $ref: '#/components/schemas/PublicProfileView' },
      },
    },

    FriendRelationStatusResponse: {
      type: 'object',
      required: ['relation'],
      properties: {
        relation: {
          type: 'string',
          enum: ['none', 'self', 'pending_sent', 'pending_received', 'accepted', 'blocked'],
          example: 'accepted',
        },
        requestId: { type: 'string', format: 'uuid', nullable: true, example: '550e8400-e29b-41d4-a716-446655440000' },
      },
    },

    AuthTokens: {
      type: 'object',
      required: ['accessToken', 'refreshToken', 'expiresAt', 'tokenType'],
      properties: {
        accessToken: {
          type: 'string',
          description: 'JWT access token. Short-lived (1h by default).',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        refreshToken: {
          type: 'string',
          description: 'Refresh token. Long-lived.',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        expiresAt: {
          type: 'integer',
          description: 'Unix timestamp (seconds) when the access token expires.',
          example: 1704067200,
        },
        tokenType: { type: 'string', example: 'bearer' },
      },
    },

    AuthResult: {
      type: 'object',
      required: ['user', 'tokens'],
      properties: {
        user: { $ref: '#/components/schemas/Profile' },
        tokens: { $ref: '#/components/schemas/AuthTokens' },
      },
    },

    // ── Request Bodies ────────────────────────────────────────────────────

    RegisterRequest: {
      type: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'user@example.com',
        },
        password: {
          type: 'string',
          format: 'password',
          minLength: 8,
          example: 'StrongPassword123!',
          description:
            'Must be 8–72 characters and contain uppercase, lowercase, number, and special character.',
        },
        name: {
          type: 'string',
          minLength: 2,
          maxLength: 100,
          example: 'Emir',
        },
        locale: {
          type: 'string',
          enum: ['en', 'tr'],
          default: 'en',
          example: 'tr',
          description: 'Preferred language for API responses and error messages.',
        },
      },
    },

    LoginRequest: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', format: 'password', example: 'StrongPassword123!' },
        locale: {
          type: 'string',
          enum: ['en', 'tr'],
          default: 'en',
          example: 'tr',
          description: 'Preferred language. Updates the stored locale on successful login.',
        },
      },
    },

    RefreshTokenRequest: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },

    UpdateProfileRequest: {
      type: 'object',
      description: 'All fields are optional. Only provided fields will be updated. role, isVerified, and verifiedAt cannot be updated here.',
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 100, example: 'Emir Mutlu' },
        username: { type: 'string', minLength: 1, maxLength: 30, pattern: '^[a-z0-9_]+$', example: 'emir_dev' },
        bio: { type: 'string', maxLength: 500, example: 'Full-stack engineer & 3D enthusiast' },
        avatarUrl: { type: 'string', format: 'uri', example: 'https://example.com/avatar.jpg' },
        websiteUrl: { type: 'string', format: 'uri', example: 'https://emir.dev' },
        location: { type: 'string', maxLength: 100, example: 'Istanbul, TR' },
        isPrivate: { type: 'boolean', example: false, description: 'Set to true to hide full profile details from non-owners' },
        locale: { type: 'string', enum: ['en', 'tr'], example: 'tr' },
      },
    },
  },
};

// ─── Path Definitions ─────────────────────────────────────────────────────────

const paths = {
  '/api/v1/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a new user account',
      description:
        'Creates a new user in Supabase Auth and a corresponding profile record. Returns tokens on success.',
      operationId: 'authRegister',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } },
        },
      },
      responses: {
        201: {
          description: 'Account created successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    properties: {
                      data: { $ref: '#/components/schemas/AuthResult' },
                      message: { example: 'Account created successfully' },
                    },
                  },
                ],
              },
            },
          },
        },
        409: {
          description: 'Email already in use',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'An account with this email already exists',
                error: { code: 'EMAIL_IN_USE' },
              },
            },
          },
        },
        422: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Login with email and password',
      operationId: 'authLogin',
      requestBody: {
        required: true,
        content: {
          'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } },
        },
      },
      responses: {
        200: {
          description: 'Logged in successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    properties: {
                      data: { $ref: '#/components/schemas/AuthResult' },
                      message: { example: 'Logged in successfully' },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: 'Invalid credentials',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Invalid email or password',
                error: { code: 'INVALID_CREDENTIALS' },
              },
            },
          },
        },
        422: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'Logout (invalidate session)',
      description: 'Invalidates the current access token. Requires a valid Bearer token.',
      operationId: 'authLogout',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Logged out successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
              example: { success: true, message: 'Logged out successfully', data: null },
            },
          },
        },
        401: {
          description: 'Missing or invalid access token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/auth/me': {
    get: {
      tags: ['Authentication'],
      summary: 'Get current authenticated user',
      description: "Returns the authenticated user's profile. Requires a valid Bearer token.",
      operationId: 'authMe',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'User profile retrieved',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    properties: {
                      data: { $ref: '#/components/schemas/Profile' },
                      message: { example: 'User profile retrieved' },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/auth/refresh': {
    post: {
      tags: ['Authentication'],
      summary: 'Refresh access token',
      description:
        'Exchanges a valid refresh token for a new access token + refresh token pair.',
      operationId: 'authRefresh',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Token refreshed successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    properties: {
                      data: { $ref: '#/components/schemas/AuthTokens' },
                      message: { example: 'Token refreshed successfully' },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: 'Invalid or expired refresh token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        422: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/profiles/me': {
    get: {
      tags: ['Profiles'],
      summary: 'Get current user profile',
      description: 'Returns the full profile of the authenticated user. User ID does not appear in the URL.',
      operationId: 'getOwnProfile',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'User profile retrieved successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    properties: {
                      data: { $ref: '#/components/schemas/Profile' },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
    patch: {
      tags: ['Profiles'],
      summary: 'Update current user profile',
      description: 'Updates editable fields of the authenticated user profile. Role, isVerified, and verifiedAt cannot be modified.',
      operationId: 'updateOwnProfile',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Profile updated successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    properties: {
                      data: { $ref: '#/components/schemas/Profile' },
                      message: { example: 'Profile updated successfully' },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        409: {
          description: 'Username already in use',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        422: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
            },
          },
        },
      },
    },
    put: {
      tags: ['Profiles'],
      summary: 'Update current user profile (PUT alias)',
      description: 'Updates editable fields of the authenticated user profile.',
      operationId: 'putOwnProfile',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
          },
        },
      },
      responses: {
        200: {
          description: 'Profile updated successfully',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    properties: {
                      data: { $ref: '#/components/schemas/Profile' },
                      message: { example: 'Profile updated successfully' },
                    },
                  },
                ],
              },
            },
          },
        },
        401: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        409: {
          description: 'Username already in use',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
        422: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationErrorResponse' },
            },
          },
        },
      },
    },
    delete: {
      tags: ['Profiles'],
      summary: 'Delete current user account',
      description: 'Soft-deletes the authenticated user profile and invalidates the authentication session.',
      operationId: 'deleteOwnAccount',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Account deleted successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
        401: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/profiles/username/{username}': {
    get: {
      tags: ['Profiles'],
      summary: 'Get profile by username',
      description: 'Public endpoint to view a profile by handle. Returns limited fields if the profile is marked as private and requested by a non-owner.',
      operationId: 'getProfileByUsername',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'username',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          example: 'emir_dev',
        },
      ],
      responses: {
        200: {
          description: 'Profile retrieved (full or limited private view)',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    properties: {
                      data: {
                        oneOf: [
                          { $ref: '#/components/schemas/Profile' },
                          { $ref: '#/components/schemas/PublicProfileView' },
                          { $ref: '#/components/schemas/PrivateProfileView' },
                        ],
                        discriminator: {
                          propertyName: 'isPrivate',
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        404: {
          description: 'Profile not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/profiles/{userId}': {
    get: {
      tags: ['Profiles'],
      summary: 'Get profile by ID',
      description: 'Public endpoint to view a profile by UUID. Returns limited fields if the profile is private and requested by a non-owner.',
      operationId: 'getProfileById',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
      ],
      responses: {
        200: {
          description: 'Profile retrieved (full or limited private view)',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    properties: {
                      data: {
                        oneOf: [
                          { $ref: '#/components/schemas/Profile' },
                          { $ref: '#/components/schemas/PublicProfileView' },
                          { $ref: '#/components/schemas/PrivateProfileView' },
                        ],
                        discriminator: {
                          propertyName: 'isPrivate',
                        },
                      },
                    },
                  },
                ],
              },
            },
          },
        },
        404: {
          description: 'Profile not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
            },
          },
        },
      },
    },
  },

  '/api/v1/friends/request/{targetUserId}': {
    post: {
      tags: ['Friends'],
      summary: 'Send friend request',
      description: 'Sends a pending friend request to target user.',
      operationId: 'sendFriendRequest',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'targetUserId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        201: {
          description: 'Friend request sent',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Friendship' } } },
        },
        400: { description: 'Cannot add self' },
        409: { description: 'Already friends or request pending' },
      },
    },
  },

  '/api/v1/friends/accept/{requestId}': {
    post: {
      tags: ['Friends'],
      summary: 'Accept friend request',
      description: 'Accepts an incoming friend request.',
      operationId: 'acceptFriendRequest',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'requestId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        200: {
          description: 'Friend request accepted',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Friendship' } } },
        },
      },
    },
  },

  '/api/v1/friends/reject/{requestId}': {
    delete: {
      tags: ['Friends'],
      summary: 'Reject or cancel friend request',
      operationId: 'rejectFriendRequest',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'requestId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: { 200: { description: 'Request rejected/cancelled' } },
    },
  },

  '/api/v1/friends/unfriend/{targetUserId}': {
    delete: {
      tags: ['Friends'],
      summary: 'Remove friend',
      operationId: 'unfriendUser',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'targetUserId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: { 200: { description: 'Unfriended successfully' } },
    },
  },

  '/api/v1/friends/status/{targetUserId}': {
    get: {
      tags: ['Friends'],
      summary: 'Get relationship status',
      description: 'Returns relationship state between authenticated user and target user.',
      operationId: 'getFriendshipStatus',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'targetUserId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        200: {
          description: 'Relationship status returned',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/FriendRelationStatusResponse' } } },
        },
      },
    },
  },

  '/api/v1/friends/requests': {
    get: {
      tags: ['Friends'],
      summary: 'Get incoming friend requests',
      operationId: 'getIncomingFriendRequests',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'List of incoming requests' } },
    },
  },

  '/api/v1/friends/sent-requests': {
    get: {
      tags: ['Friends'],
      summary: 'Get sent friend requests',
      operationId: 'getSentFriendRequests',
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: 'List of sent requests' } },
    },
  },

  '/api/v1/friends/list/{userId}': {
    get: {
      tags: ['Friends'],
      summary: 'Get user friends list',
      operationId: 'getUserFriendsList',
      parameters: [
        { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: { 200: { description: 'List of accepted friends' } },
    },
  },

  '/api/health': {
    get: {
      tags: ['System'],
      summary: 'Health check',
      description: 'Returns the current health status of the API.',
      operationId: 'healthCheck',
      responses: {
        200: {
          description: 'API is running',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'API is running' },
                  timestamp: { type: 'string', format: 'date-time' },
                  version: { type: 'string', example: 'v1' },
                },
              },
            },
          },
        },
      },
    },
  },
};

// ─── OpenAPI Document ─────────────────────────────────────────────────────────

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: '3D Blog Backend API',
    version: '1.0.0',
    description: `
## Overview

REST API for the 3D Blog & Content Platform. Implements **Authentication** and **Profiles** modules.

## Authentication

Use the **Authorize** button (🔒) to enter your Bearer JWT token.

1. Call \`POST /api/v1/auth/register\` or \`POST /api/v1/auth/login\`
2. Copy the \`accessToken\` from the response
3. Click **Authorize** and enter: \`<your-token>\`
4. Protected endpoints are now accessible

## API Versioning

All endpoints are under \`/api/v1\`. Future versions will be available under \`/api/v2\`.
    `,
    contact: {
      name: 'API Support',
      email: 'support@example.com',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url:
        env.nodeEnv === 'production'
          ? 'https://3d-panel-backend-gilt.vercel.app'
          : `http://localhost:${String(env.port)}`,
      description: env.nodeEnv === 'production' ? 'Production' : 'Local Development',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User registration, login, logout, token management',
    },
    {
      name: 'Profiles',
      description: 'User profile management, username handles, privacy controls',
    },
    {
      name: 'Friends',
      description: 'Facebook-style friend requests, accept/reject, relationships, and friends lists',
    },
    { name: 'System', description: 'API health and status endpoints' },
  ],
  components,
  paths,
};

const swaggerOptions: swaggerJsdoc.Options = {
  swaggerDefinition,
  apis: [], // All paths defined inline above
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

/**
 * Registers Swagger UI and JSON spec routes on the Express app.
 *
 * Routes:
 *   GET /api/docs      → Swagger UI
 *   GET /api/docs.json → Raw OpenAPI JSON
 */
export function setupSwagger(app: Application): void {
  // Serve raw OpenAPI JSON
  app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Serve Swagger UI with CDN assets to fix Vercel Serverless static file bundling
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: '3D Blog API — Docs',
      customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css',
      customJs: [
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.min.js',
      ],
      customCss: `
        .swagger-ui .topbar { background-color: #1a1a2e; }
        .swagger-ui .topbar-wrapper img { content: url(''); }
        .swagger-ui .topbar-wrapper::after {
          content: '3D Blog API';
          color: white;
          font-size: 1.2rem;
          font-weight: 600;
        }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true,
      },
    }),
  );

  console.log(`[Swagger] Docs available at /api/docs`);
}
