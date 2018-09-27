import { NativeModules } from 'react-native';
import { initialiseNativeModuleEventEmitter } from './events';
import INTERNALS from './internals';

const NATIVE_MODULES = {};

/**
 * Prepends all arguments in prependArgs to all native method calls
 * @param NativeModule
 * @param argToPrepend
 */
const nativeWithArgs = (NativeModule, argToPrepend) => {
  const native = {};
  const methods = Object.keys(NativeModule);

  for (let i = 0, len = methods.length; i < len; i++) {
    const method = methods[i];
    native[method] = (...args) => NativeModule[method](...[...argToPrepend, ...args]);
  }

  return native;
};

const nativeModuleKey = module => `${module._serviceUrl || module.app.name}:${module.namespace}`;

export const getNativeModule = module => NATIVE_MODULES[nativeModuleKey(module)];

export const initialiseNativeModule = (module, config, serviceUrl) => {
  const { moduleName, multiApp, hasShards, namespace } = config;
  const nativeModule = NativeModules[moduleName];
  const key = nativeModuleKey(module);

  if (!nativeModule && namespace !== 'utils') {
    throw new Error(INTERNALS.STRINGS.ERROR_MISSING_MODULE(namespace, moduleName));
  }

  // used by the modules that extend ModuleBase
  // to access their native module counterpart
  const argToPrepend = [];
  if (multiApp) {
    argToPrepend.push(module.app.name);
  }
  if (hasShards) {
    argToPrepend.push(serviceUrl);
  }

  if (argToPrepend.length) {
    NATIVE_MODULES[key] = nativeWithArgs(nativeModule, argToPrepend);
  } else {
    NATIVE_MODULES[key] = nativeModule;
  }

  initialiseNativeModuleEventEmitter(module, config);

  return NATIVE_MODULES[key];
};