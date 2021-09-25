const {
  makeRequest,
  makeErrorRequest,
  MAKE_REQUEST_ADDRESS,
  componentUid,
  http,
} = require('./request');
const { cancelableRequestsStore } = require('../cancelableRequests');
const { responseNotCanceled } = require('../decorators');

const testFunctions = [
  test1,
  test2,
  test3,
  test4,
  test5,
];

let log = console.log;
/**
 * @param {boolean?} noLog
 */
module.exports.default = async function testAll(noLog) {
  if (noLog) {
    log = () => {};
  }

  console.log('Tests started');
  for (let i = 0; i < testFunctions.length; i++) {
    try {
      await testFunctions[i]();
    } catch (error) {
      console.error(`Test ${i} failed:`, error);
    }
    log();
  }
  console.log('Tests ended');

  if (noLog) {
    log = console.log;
  }
}

/**
 * Тест работоспособности запроса
 */
function test1() {
  log('test1: success request');
  return makeRequest()
  .then((response) => {
    log('response');
  })
  .catch((error) => {
    log('error');
  })
  .finally(() => {
    log('finally');
  });
}
module.exports.test1 = test1;

/**
 * Тест работоспособности ошибочного запроса
 */
function test2() {
  log('test2: error request');
  return makeErrorRequest()
  .then((response) => {
    log('response');
  })
  .catch((error) => {
    log('error');
  })
  .finally(() => {
    log('finally');
  });
}
module.exports.test2 = test2;

/**
 * Проверка на наличие cancel'a
 */
function test3() {
  log('test3: Canceleration availability');
  
  console.log("component canceler's store before request:", cancelableRequestsStore[componentUid]);
  setTimeout(() => {
    const cancelerStore = cancelableRequestsStore[componentUid];
    log("component canceler's store after request:", cancelerStore);
    if (!cancelerStore) {
      console.error('noCanceler');
      // throw new Error('No canceler');
    }
  }, 10);

  return makeRequest()
  .then((response) => {
    log('response');
  })
  .catch((error) => {
    log('error');
  })
  .finally(() => {
    log('finally');
  });
}
module.exports.test3 = test3;


/**
 * Отмена запроса
 */
function test4() {
  log('test4: cancel');
  
  const testFailed = new Error('request not canceled');

  const request = makeRequest({
    forCancel: {
      cancelerCallbackRef(canceler) {
        // Подобранная задержка
        setTimeout(canceler, 10);
      },
    },
  })
  .then((response) => {
    log('response');
    throw testFailed;
  })
  .catch((error) => {
    if (error && error.config && error.config.forCancel && error.config.forCancel.canceled) {
      log('error', 'canceled', error.config.forCancel.canceled());
      if (!isCancel) {
        throw testFailed;
      }
    } else {
      const isCancel = http.isCancel(error);
      log('error', 'isCancel', isCancel);
      if (!isCancel) {
        throw testFailed;
      }
    }
  })
  .finally(() => {
    log('finally');
  });

  return request;
}
module.exports.test4 = test4;

/**
 * Поздняя отмена
 */
function test5() {
  log('test5: late cancellation');
  
  const testFailed = new Error('request not canceled');

  let canceler;
  const request = makeRequest({
    forCancel: {
      cancelerCallbackRef(_canceler) {
        canceler = _canceler;
      },
    },
  })
  .then((response) => {
    log('response canceling');
    canceler();
    return response;
  })
  .then(responseNotCanceled((response) => {
    log('response');
    throw testFailed;
  }))
  .catch((error) => {
    log('error', error);
    throw testFailed;
  })
  .finally(() => {
    log('finally');
  });

  return request;
}
module.exports.test5 = test5;

/**
 * Обёртка отмены при множественных вызовах
 */
function test6() {
  log('test6: cancellation wrap');
  
  // const testFailed = new Error('request not canceled');

  const request = makeRequest({
    forCancel: {
      cancelerCallbackRef(canceler) {
        // Подобранная задержка
        setTimeout(canceler, 10);
      },
    },
  })
  .then((response) => {
    log('response');
    throw testFailed;
  })
  .catch((error) => {
    const isCancel = http.isCancel(error);
    log('error', 'isCancel', isCancel);
    if (!isCancel) {
      throw testFailed;
    }
  })
  .finally(() => {
    log('finally');
  });

  return request;
}
module.exports.test6 = test6;
