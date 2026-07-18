import packageInfo from "../package.json";

/** 应用版本号（单一来源：package.json），用于界面落款展示。 */
export const appVersion: string = packageInfo.version;
