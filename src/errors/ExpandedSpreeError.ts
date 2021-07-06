import { AxiosResponse } from 'axios'
import { Errors, FieldErrors } from '../interfaces/errors/Errors'
import BasicSpreeError from './BasicSpreeError'

export default class ExpandedSpreeError extends BasicSpreeError {
  public errors: Errors

  constructor(serverResponse: AxiosResponse, errorsSummary: string, errors: { [fieldPath: string]: FieldErrors }) {
    super(serverResponse, errorsSummary)
    Object.setPrototypeOf(this, ExpandedSpreeError.prototype)
    this.name = 'ExpandedSpreeError'
    this.errors = Object.keys(errors).reduce((acc, fieldPath) => {
      const keys = fieldPath.split('.')
      let key = keys.shift()
      let node = acc

      while (key) {
        if (!node[key]) {
          if (keys.length === 0) {
            node[key] = errors[fieldPath]
          } else {
            node[key] = {}
          }
        }

        node = node[key]
        key = keys.shift()
      }

      return acc
    }, {})
  }

  public getErrors(path: string[]): Errors | FieldErrors | null {
    return path.reduce((node, pathKey) => node?.[pathKey], this.errors) ?? null
  }
}
