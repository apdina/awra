/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adminAuth from "../adminAuth.js";
import type * as adminLockout from "../adminLockout.js";
import type * as adminSecretSetup from "../adminSecretSetup.js";
import type * as adminSecretUpdate from "../adminSecretUpdate.js";
import type * as auditLog from "../auditLog.js";
import type * as auth from "../auth.js";
import type * as avatar from "../avatar.js";
import type * as chat from "../chat.js";
import type * as chatModeration from "../chatModeration.js";
import type * as chatRooms from "../chatRooms.js";
import type * as chat_rooms_config from "../chat_rooms_config.js";
import type * as cleanup from "../cleanup.js";
import type * as coins from "../coins.js";
import type * as crons from "../crons.js";
import type * as debugTime from "../debugTime.js";
import type * as draws from "../draws.js";
import type * as loginAttempts from "../loginAttempts.js";
import type * as moderators from "../moderators.js";
import type * as native_auth from "../native_auth.js";
import type * as passwordReset from "../passwordReset.js";
import type * as passwordResetRateLimit from "../passwordResetRateLimit.js";
import type * as roomHelpers from "../roomHelpers.js";
import type * as scheduledDrawUpdates from "../scheduledDrawUpdates.js";
import type * as security from "../security.js";
import type * as systemConfig from "../systemConfig.js";
import type * as timezoneConfig from "../timezoneConfig.js";
import type * as unifiedTickets from "../unifiedTickets.js";
import type * as userManagement from "../userManagement.js";
import type * as validators from "../validators.js";
import type * as videoAds from "../videoAds.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  adminAuth: typeof adminAuth;
  adminLockout: typeof adminLockout;
  adminSecretSetup: typeof adminSecretSetup;
  adminSecretUpdate: typeof adminSecretUpdate;
  auditLog: typeof auditLog;
  auth: typeof auth;
  avatar: typeof avatar;
  chat: typeof chat;
  chatModeration: typeof chatModeration;
  chatRooms: typeof chatRooms;
  chat_rooms_config: typeof chat_rooms_config;
  cleanup: typeof cleanup;
  coins: typeof coins;
  crons: typeof crons;
  debugTime: typeof debugTime;
  draws: typeof draws;
  loginAttempts: typeof loginAttempts;
  moderators: typeof moderators;
  native_auth: typeof native_auth;
  passwordReset: typeof passwordReset;
  passwordResetRateLimit: typeof passwordResetRateLimit;
  roomHelpers: typeof roomHelpers;
  scheduledDrawUpdates: typeof scheduledDrawUpdates;
  security: typeof security;
  systemConfig: typeof systemConfig;
  timezoneConfig: typeof timezoneConfig;
  unifiedTickets: typeof unifiedTickets;
  userManagement: typeof userManagement;
  validators: typeof validators;
  videoAds: typeof videoAds;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
