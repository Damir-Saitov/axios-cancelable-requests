const { default: axios } = require('axios');

const { createInterceptorsForCanceling, registerComponent } = require('../cancelableRequests');


const http = createInterceptorsForCanceling(axios.create());
module.exports.http = http;
const componentUid = registerComponent('TEST');
module.exports.componentUid = componentUid;

const MAKE_REQUEST_ADDRESS = 'https://jsonplaceholder.typicode.com/posts';
module.exports.MAKE_REQUEST_ADDRESS = MAKE_REQUEST_ADDRESS;

/**
 * @param {import('../cancelableRequests').AxiosRequestConfigWithCancel} additionalConfig
 * @returns {Promise<import('axios').AxiosResponse>}
 */
function makeRequest(additionalConfig) {
  const config = additionalConfig || { forCancel: {} };
  if (!('forCancel' in config)) {
    config.forCancel = {};
  }
  config.forCancel.componentUid = componentUid;
  
  return http.get(MAKE_REQUEST_ADDRESS, config);
}
module.exports.makeRequest = makeRequest;

/**
 * @param {import('../cancelableRequests').AxiosRequestConfigWithCancel} additionalConfig
 * @returns {Promise<import('axios').AxiosResponse>}
 */
function makeErrorRequest(additionalConfig) {
  const config = additionalConfig || { forCancel: {} };
  config.forCancel.componentUid = componentUid;

  return new Promise(async (resolve, reject) => {
    await http.get(MAKE_REQUEST_ADDRESS, config);
    reject();
  });
}
module.exports.makeErrorRequest = makeErrorRequest;
