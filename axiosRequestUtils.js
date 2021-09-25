// Пихать это в forCancel, если влияет на глобальное состояние

export function onRequestStartInterseption(config) {
  if (config.onRequestStart) {
    const configOnRequestStartType = typeof config.onRequestStart;
    if (configOnRequestStartType === 'function') {
      configOnRequestStartType();
    } else {
      console.error(`Invalid type "onRequestStart", expected function, got ${configOnRequestStartType}`);
    }
  }
  return Promise.resolve(config);
}

export function onRequestEndResponseInterseption(response) {
  if (response.config.onRequestEnd) {
    const configOnRequestEndType = typeof response.config.onRequestEnd;
    if (configOnRequestEndType === 'function') {
      configOnRequestEndType();
    } else {
      console.error(`Invalid type "onRequestEnd", expected function, got ${configOnRequestEndType}`);
    }
  }
  return response;
}

export function onRequestEndErrorInterseption(error) {
  return Promise.reject(error);
}
