import { compare, genSalt, hash } from 'bcrypt';
import { appEnv } from './env.helper';
export async function Hashpassword(plainText: string): Promise<any> {
  return new Promise(function (resolve, reject) {
    genSalt(10, function (error, salt) {
      if (error) {
        reject(error);
      } else {
        hash(plainText, salt, function (error, hash) {
          if (error) {
            reject(error);
          } else {
            resolve(hash);
          }
        });
      }
    });
  });
}

export async function Comparepassword(plainText, hash): Promise<any> {
  return new Promise(function (resolve, reject) {
    compare(plainText, hash, function (error, result) {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

export function GetVerificationCode() {
  if (appEnv('ENVIRONMENT') === 'development') {
    return 123456;
  }
  return Math.floor(100_000 + Math.random() * 900_000);
}

export interface PaginationRequestParams {
  limit?: number;
  page?: number;
}

export interface PaginationDBParams {
  limit: number;
  offset: number;
}

/**
 * Casts PaginationRequestParams to PaginationDBParams
 * @param {PaginationRequestParams} params
 * @returns {PaginationDBParams}
 */
export function GetPaginationOptions(params: PaginationRequestParams) {
  let options: PaginationDBParams = {
    limit: appEnv('PAGE_LIMIT', 20),
    offset: 0,
  };

  let limit = params.limit;
  let page = params.page || 1;

  if (limit) {
    options.limit = parseInt(limit.toString());
  }

  if (page) {
    options.offset = options.limit * Math.max(page - 1, 0);
  }
  return options;
}

export function GetOrderByClause(column, direction) {
  if (column && direction) {
    return `Order By ${column} ${direction}`;
  }

  return '';
}

export function isBoolean(val) {
  return 'boolean' === typeof val;
}

/**
 * @param object should be JSON compatible, otherwise use structuredClone()
 */
export function DeepClone(object) {
  return JSON.parse(JSON.stringify(object));
}

export function GenerateShortCode(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
