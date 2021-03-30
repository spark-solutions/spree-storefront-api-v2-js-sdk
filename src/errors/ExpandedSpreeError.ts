import { AxiosResponse } from 'axios'
import get from 'lodash/get'
import BasicSpreeError from './BasicSpreeError'

export default class ExpandedSpreeError extends BasicSpreeError {
  public errors: any

  constructor(serverResponse: AxiosResponse, errorsSummary: string, errors: { [fieldPath: string]: string[] }) {
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

  public getErrors(path: string[]): string[] | null {
    return get(this.errors, path, null)
  }
}
