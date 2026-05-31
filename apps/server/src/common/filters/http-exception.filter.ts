import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common'
import type { Request, Response } from 'express'
import { Catch, HttpException, HttpStatus } from '@nestjs/common'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error'

    response.status(status).json({
      statusCode: status,
      path: request.url,
      error: message,
      timestamp: new Date().toISOString(),
    })
  }
}
