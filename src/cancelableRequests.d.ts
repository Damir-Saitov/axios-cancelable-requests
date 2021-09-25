import {
  AxiosRequestConfig,
  Canceler,
  AxiosInstance,
} from 'axios';

import { errorNotCancel } from './decorators';


export declare const REMOVED = 'REMOVED';
export declare const CANCELED = 'CANCELED';

export interface Options {
  changeRemoveOnCancel: boolean;
}

/**
 * Хранилище "отменялок" запросов axios
 */
export declare type CancelableRequestsStore = {
  [componentUid: string]: {
    [requestUid: string]: {
      [datetime: string]: Canceler | 'REMOVED' | 'CANCELED'
    },
  },
};

export interface AxiosRequestConfigWithCancel extends AxiosRequestConfig {
  forCancel?: {
    componentUid: string,
    requestUid: string,
    datetimeLabel: string,
    canceled: () => boolean,
    cancelerCallbackRef?: (canceler: Canceler) => void,
  },
}

export interface AxiosInstanceWithCancel extends AxiosInstance {
  errorNotCancel: typeof errorNotCancel,
  isCancel(value: any): boolean,
}

export function createInterceptorsForCanceling(axiosInstance: AxiosInstance) : AxiosInstanceWithCancel;

/**
 * Функция для инициализации отменяемых запросов компонента
 */
export function registerComponent(componentUid: string): string;

/**
 * Функция для удаления хранилища отменяемых запросов компонента.
 * default cancelRequests=false
 */
export function unregisterComponent(
  componentUid: string,
  cancelRequests?: boolean,
): string;

/**
 * Отменяет запрос компонента
 */
export function cancelRequest(
  componentUid: string,
  requestUid: string,
): void;

/**
 * Отменяет все запросы компонента
 */
export function cancelAllComponentRequests(componentUid: string): void;
