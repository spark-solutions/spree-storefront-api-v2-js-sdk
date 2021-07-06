import Axios, { AxiosError, AxiosInstance, AxiosRequestConfig, Method } from 'axios'
import { stringify } from 'qs'
import {
  BasicSpreeError,
  ExpandedSpreeError,
  MisconfigurationError,
  NoResponseError,
  SpreeError,
  SpreeSDKError
} from './errors'
import * as result from './helpers/result'
import { ErrorClass } from './interfaces/errors/ErrorClass'
import { JsonApiResponse } from './interfaces/JsonApi'
import { ResultResponse } from './interfaces/ResultResponse'
import { IToken } from './interfaces/Token'

export default class Http {
  public host: string
  public axios: AxiosInstance

  constructor(host?: string) {
    this.host = host || process.env.SPREE_HOST || 'http://localhost:3000/'

    this.axios = Axios.create({
      baseURL: this.host,
      headers: {
        'Content-Type': 'application/json'
      },
      paramsSerializer: (params) => {
        return stringify(params, { arrayFormat: 'brackets' })
      }
    })
  }

  protected async spreeResponse<ResponseType = JsonApiResponse>(
    method: Method,
    url: string,
    tokens: IToken = {},
    params: any = {}
  ): Promise<ResultResponse<ResponseType>> {
    try {
      const headers = this.spreeOrderHeaders(tokens)

      const axiosConfig: AxiosRequestConfig = {
        url,
        params,
        method,
        headers
      }

      const response = await this.axios(axiosConfig)

      return result.makeSuccess(response.data)
    } catch (error) {
      return result.makeFail(this.processError(error))
    }
  }

  /**
   * The HTTP error code returned by Spree is not indicative of its response shape.
   * This function determines the information provided by Spree and uses everything available.
   */
  protected classifySpreeError(error: AxiosError): ErrorClass {
    const { error: errorSummary, errors } = error.response.data

    if (typeof errorSummary === 'string') {
      if (typeof errors === 'object') {
        return ErrorClass.FULL
      }
      return ErrorClass.BASIC
    }
    return ErrorClass.LIMITED
  }

  protected processError(error: AxiosError): SpreeSDKError {
    if (error.response) {
      // Error from Spree outside HTTP 2xx codes
      return this.processSpreeError(error)
    } else if (error.request) {
      // No response received from Spree
      return new NoResponseError()
    } else {
      // Incorrect request setup
      return new MisconfigurationError(error.message)
    }
  }

  protected processSpreeError(error: AxiosError): SpreeError {
    const { error: errorSummary, errors } = error.response.data
    const errorClass = this.classifySpreeError(error)

    if (errorClass === ErrorClass.FULL) {
      return new ExpandedSpreeError(error.response, errorSummary, errors)
    } else if (errorClass === ErrorClass.BASIC) {
      return new BasicSpreeError(error.response, errorSummary)
    } else {
      return new SpreeError(error.response)
    }
  }

  protected spreeOrderHeaders(tokens: IToken): { [headerName: string]: string } {
    const header = {}

    if (tokens.orderToken) {
      header['X-Spree-Order-Token'] = tokens.orderToken
    }

    if (tokens.bearerToken) {
      header['Authorization'] = `Bearer ${tokens.bearerToken}`
    }

    return header
  }
}
