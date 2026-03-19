// Framework-agnostic exceptions for use in both NestJS and Temporal Worker
// These replace NestJS HttpExceptions in service/repository layers

export class AppNotFoundException extends Error {
  constructor(message = 'Resource not found') {
    super(message)
    this.name = 'AppNotFoundException'
  }
}

export class AppForbiddenException extends Error {
  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'AppForbiddenException'
  }
}

export class AppUnauthorizedException extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'AppUnauthorizedException'
  }
}

export class AppConflictException extends Error {
  constructor(message = 'Conflict') {
    super(message)
    this.name = 'AppConflictException'
  }
}
