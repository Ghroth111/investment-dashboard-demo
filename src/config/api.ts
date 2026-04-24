import { Platform } from 'react-native';

function inferLocalBackendHost() {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }

  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

// const remoteApiBaseUrl = `http://${inferLocalBackendHost()}:4000/api`;
const remoteApiBaseUrl = 'http://47.101.191.50:4010/api';

// 环境切换只改这里：
// 1. 本地开发时，使用 localApiBaseUrl
// 2. 联调/手机演示/同事共用环境时，使用 remoteApiBaseUrl
//
// 当前默认：公网环境
export const backendApiBaseUrl = remoteApiBaseUrl;
// export const backendApiBaseUrl = localApiBaseUrl;

export const marketApiBaseUrl = backendApiBaseUrl;
