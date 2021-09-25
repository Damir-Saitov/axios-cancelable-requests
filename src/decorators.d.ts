import {
  AxiosError,
  AxiosResponse,
} from 'axios';

declare type SomeRequestError = AxiosError | Error | undefined;

/**
 * Декоратор, вызывающий обработчик ошибки, если ошибка не результат отмены
 */
export function errorNotCancel(
  errorCallback: (
    error: SomeRequestError,
    ...args: any[],
  ) => void,
): (
  error: SomeRequestError,
  ...args: any[],
) => void;

/**
 * Проверяет, был ли отменён запрос по объекту с config
 */
export function checkCancellation(something: any): boolean;

/**
 * Декоратор, вызывающий обработчик then, если запрос не был отменён
 */
export function responseNotCanceled(
  thenCallback: (
    response: AxiosResponse,
    ...args: any[]
  ) => void,
): (
  response: AxiosResponse,
  ...args: any[]
) => void;
