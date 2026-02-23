export type ErrorResponse = {
  response?: {
    data?: {
      message: string
    }
  }
}

export type AxiosError = {
  message: string
  response?: {
    data?: {
      message: string
    }
  }
}
