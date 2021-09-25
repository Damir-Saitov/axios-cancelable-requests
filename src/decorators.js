const { default: axios } = require('axios');


/**
 * Проверяет, был ли отменён запрос по объекту с config
 * 
 * @param {any} something
 * @returns {boolean}
 */
function checkCancellation(something) {
  return something &&
    'config' in something &&
    'forCancel' in something.config &&
    'canceled' in something.config.forCancel &&
    typeof something.config.forCancel.canceled === 'function' && 
    something.config.forCancel.canceled();
}
module.exports.checkCancellation = checkCancellation;

/**
 * Декоратор, вызывающий обработчик ошибки, если ошибка не результат отмены
 * 
 * @param {(error: Error, ...args: any[]) => void} errorCallback
 * @returns {(error: Error, ...args: any[]) => void}
 */
function errorNotCancel(errorCallback) {
  return (error) => {
    !axios.isCancel(error) && !checkCancellation(error) && errorCallback(error);
  }
}
module.exports.errorNotCancel = errorNotCancel;

/**
 * Декоратор, вызывающий обработчик then, если запрос не был отменён
 * 
 * @param {(response: import('axios').AxiosResponse, ...args: any[]) => void} thenCallback
 * @returns {(response: import('axios').AxiosResponse, ...args: any[]) => void}
 */
function responseNotCanceled(thenCallback) {
  return (response) => {
    !checkCancellation(response) && thenCallback(response);
  }
}
module.exports.responseNotCanceled = responseNotCanceled;

/**
 * Создаёт декоратор, который проводит внутрь функции функцию, проверяющую состояние
 * 
 * @param {string} componentUid
 * @param {string} requestUid
 * @param {string} datetimeLabel
 * @returns {}
 */
 module.exports.createCanceler = function createCanceler(componentUid, requestUid, datetimeLabel) {
  // return [
  //   canceler,
  //   IsCanceledStateGetter,
  // ];
}
