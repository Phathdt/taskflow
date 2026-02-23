import { Injectable, NestMiddleware } from '@nestjs/common'

import { NextFunction, Request, Response } from 'express'

@Injectable()
export class BasicAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      res.setHeader('WWW-Authenticate', 'Basic')
      return res.status(401).send('Authentication required')
    }

    const auth = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':')
    const username = auth[0]
    const password = auth[1]

    if (username === 'admin' && password === '@Caliber2024') {
      return next()
    } else {
      res.setHeader('WWW-Authenticate', 'Basic')
      return res.status(401).send('Invalid credentials')
    }
  }
}
