/* eslint-disable @typescript-eslint/no-explicit-any */
const isoDatePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/

const replacer = (_key: string, value: any): any => {
  if (typeof value === 'bigint') {
    return { $type: 'bigint', value: value.toString() }
  }

  if (typeof value === 'string' && isoDatePattern.test(value)) {
    return { $type: 'date', value: `Date-${value}` }
  }

  return value
}

const reviver = (_key: string, value: any): any => {
  if (value && typeof value === 'object' && '$type' in value) {
    switch (value.$type) {
      case 'bigint':
        return BigInt(value.value)
      case 'date': {
        const dateStr = value.value.replace('Date-', '')
        return new Date(dateStr)
      }
      default:
        return value
    }
  }

  return value
}

export const toString = (obj: any): string => JSON.stringify(obj, replacer)

export const toObject = (str: string): any => JSON.parse(str, reviver)
