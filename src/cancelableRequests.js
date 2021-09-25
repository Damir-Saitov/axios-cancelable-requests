const { default: axios } = require('axios');

const { errorNotCancel } = require('./decorators');


const CancelToken = axios.CancelToken;

/**
 * Хранилище Canceler'ов запросов axios
 * 
 * @type {import('./cancelableRequests').CancelableRequestsStore}
 */
const cancelableRequestsStore = {};
module.exports.cancelableRequestsStore = cancelableRequestsStore;

const REMOVED = new String('REMOVED');
const CANCELED = new String('CANCELED');

/** @type {Options} */
const DEFAULT_OPTIONS = {
  changeRemoveOnCancel: true,
};

/** @type {Options} */
let currentOptions = DEFAULT_OPTIONS;

/**
 * Добавляет AxiosInstance функцию isCancel,
 * декоратор errorNotCancel,
 * примеси по созданию и удалению Canceler'ов
 * 
 * @param {import('axios').AxiosInstance} axiosInstance
 * @param {Options} options
 * @returns {import('./cancelableRequests').AxiosInstanceWithCancel}
 */
function createInterceptorsForCanceling(axiosInstance, options) {
  if (options) {
    currentOptions = options;
  }

  axiosInstance.isCancel = axios.isCancel;
  axiosInstance.errorNotCancel = errorNotCancel;
  axiosInstance.interceptors.request.use(requestCancelInterseption);
  axiosInstance.interceptors.response.use(
    removeCancelerFromResponseInterseption,
    removeCancelerFromErrorInterseption,
  );
  return axiosInstance;
}
module.exports.createInterceptorsForCanceling = createInterceptorsForCanceling;

/**
 * Взятие из config'а идентификатора компонента и запроса для отмены.
 * Если у запроса нет идентификатора, то берётся url.
 * 
 * @param {import('./cancelableRequests').AxiosRequestConfigWithCancel} config - конфиг запроса axios
 * @returns {[
 *   componentUid: string,
 *   requestUid: string,
 * ]} уникальные идентификаторы компонента и запроса (если у запроса нет, то берётся url) 
 */
function getUidForCancel(config) {
  if (!config.forCancel.componentUid) {
    throw new Error('"forCancel.componentUid" required')
  }
  return [
    config.forCancel.componentUid,
    config.forCancel.requestUid || config.url,
  ];
}

/**
 * Примесь перед запросом для создания Canceler'а запроса
 * 
 * @async
 * @param {import('./cancelableRequests').AxiosRequestConfigWithCancel} config
 * @returns {import('./cancelableRequests').AxiosRequestConfigWithCancel}
 */
function requestCancelInterseption(config) {
  return new Promise((resolve, reject) => {
    if (config.forCancel) {
      let getUidForCancelResult;
      try {
        getUidForCancelResult = getUidForCancel(config);
      } catch (error) {
        console.warn(error);
        resolve(config);
      }
      const componentUid = getUidForCancelResult[0],
        requestUid = getUidForCancelResult[1];
  
      const cancelers = cancelableRequestsStore[componentUid][requestUid];
      if (cancelers) {
        cancelRequest(componentUid, requestUid);
      } else {
        cancelableRequestsStore[componentUid][requestUid] = {};
      }
  
      config.cancelToken = new CancelToken((canceler) => {
        /** Чтобы успели произойти разные действия, типа коллбека finally */
        setTimeout(() => {
          const datetimeLabel = String(new Date());
          cancelableRequestsStore[componentUid][requestUid][datetimeLabel] = canceler;
          config.forCancel.datetimeLabel = datetimeLabel;
          config.forCancel.canceled =
            () => !(cancelableRequestsStore[componentUid][requestUid][datetimeLabel] === CANCELED);
          
          if (config.forCancel.cancelerCallbackRef) {
            const cancelerCallbackRefType = typeof config.forCancel.cancelerCallbackRef;
            if (cancelerCallbackRefType === 'function') {
              config.forCancel.cancelerCallbackRef(canceler);
            } else {
              console.warn(`Invalid type "config.forCancel.cancelerCallbackRef": ${cancelerCallbackRefType}`);
            }
          }
        
          resolve(config);
        });
      });
    } else {
      resolve(config);
    }
  });
}

/**
 * Удаляет Canceler из хранилища по данным конфига
 * 
 * @param {(import('axios').AxiosError | import('axios').AxiosResponse | Error)} objectWithConfig
 */
function removeCanceler(objectWithConfig) {
  if ('config' in objectWithConfig && 'forCancel' in objectWithConfig.config) {
    const getUidForCancelResult = getUidForCancel(objectWithConfig.config);
    const componentUid = getUidForCancelResult[0],
      requestUid = getUidForCancelResult[1];
    cancelableRequestsStore[componentUid][requestUid]
      [objectWithConfig.config.forCancel.datetimeLabel] = REMOVED;
  }
}

/**
 * Примесь удаления Canceler по данным конфига из ответа
 * 
 * @param {import('axios').AxiosResponse} response
 * @returns {import('axios').AxiosResponse}
 */
function removeCancelerFromResponseInterseption(response) {
  removeCanceler(response);
  return response;
}
/**
 * Примесь удаления Canceler по данным конфига из ошибки
 * 
 * @async
 * @param {import('axios').AxiosError} error
 * @returns {import('axios').AxiosError}
 */
function removeCancelerFromErrorInterseption(error) {
  removeCanceler(error);
  return Promise.reject(error);
}

/**
 * Функция для инициализации отменяемых запросов компонента
 * 
 * @param {string} componentUid - уникальный идентификатор компонента
 * 
 * @returns {string}
 */
function registerComponent(componentUid) {
  cancelableRequestsStore[componentUid] = {};
  return componentUid;
}
module.exports.registerComponent = registerComponent;

/**
 * Функция для удаления хранилища отменяемых запросов компонента
 * 
 * @param {string} componentUid - уникальный идентификатор компонента
 * @param {boolean?} [cancelRequests=false] - отменить все запросы
 * 
 * @returns {string}
 */
function unregisterComponent(componentUid, cancelRequests) {
  if (cancelRequests) {
    cancelAllComponentRequests(componentUid)
  }
  delete cancelableRequestsStore[componentUid];
}
module.exports.unregisterComponent = unregisterComponent;

/**
 * Отменяет запрос компонента
 * 
 * @param {string} componentUid - уникальный идентификатор компонента
 * @param {string} requestUid - уникальный идентификатор запроса
 */
function cancelRequest(componentUid, requestUid) {
  const cancelers = cancelableRequestsStore[componentUid][requestUid];
  if (cancelers) {
    for (const datetimeLabel in cancelers) {
      if (cancelers[datetimeLabel] === CANCELED) {
        continue;
      } else if (cancelers[datetimeLabel] === REMOVED) {

        if (currentOptions.changeRemoveOnCancel) {
          cancelers[datetimeLabel] = CANCELED;
        }
        continue;
      }

      try {
        cancelers[datetimeLabel]();
      } catch(error) {
        // Если отменялка была, но что-то пошло не так
        console.log('Error while cancelling request with ' +
          `componentUid="${componentUid}" and requestUid="${requestUid}": ${error}`);
      } finally {
        cancelers[datetimeLabel] = CANCELED;
      }
    }
  }
}
module.exports.cancelRequest = cancelRequest;

/**
 * Отменяет все запросы компонента
 * 
 * @param {string} componentUid - уникальный идентификатор компонента
 */
function cancelAllComponentRequests(componentUid) {
  for (const requestUid in cancelableRequestsStore[componentUid]) {
    cancelRequest(componentUid, requestUid);
  }
}
module.exports.cancelAllComponentRequests = cancelAllComponentRequests;

/**
 * Удаляет все записи с CANCELED и REMOVED
 */
function clearCancelableRequestsStore() {

}
