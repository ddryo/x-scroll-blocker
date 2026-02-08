/**
 * サイト設定レジストリ
 *
 * 登録された SiteConfig を管理し、ホスト名からサイトを検出する。
 * 新しいサイトを追加する場合は siteConfigs 配列にインポートした設定を追加するだけでよい（NFR-007）。
 */

import type { SiteConfig } from "./types";
import { xConfig } from "./x";

/** 登録済みサイト設定の一覧 */
const siteConfigs: readonly SiteConfig[] = [xConfig];

/**
 * ホスト名から該当する SiteConfig を返す
 *
 * @param hostname - 判定するホスト名（例: "x.com", "www.youtube.com"）
 * @returns 該当する SiteConfig、該当なしの場合は null
 */
export function getCurrentSiteConfig(hostname: string): SiteConfig | null {
  for (const config of siteConfigs) {
    if (config.hostPattern.test(hostname)) {
      return config;
    }
  }
  return null;
}

/**
 * 登録済みの全サイト設定を取得する
 *
 * @returns サイト設定の読み取り専用配列
 */
export function getAllSiteConfigs(): readonly SiteConfig[] {
  return siteConfigs;
}
