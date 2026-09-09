/**
 * 关卡型小游戏主玩法会话。
 *
 * 覆盖 Loading → Home → Play → Retry / Next / Home 的一级流程。
 * 仅适用于 Puzzle / Minigame / 休闲关卡产品。
 * 不适用于 MMO、MUD、ARPG、开放世界或持久角色会话；那些继续用 Application Layer / Feature Runtime。
 */
export interface CasualLevelSession {
  bootReady(): boolean;
  startLevel(level: number): boolean;
  reset(level: number): boolean;
  retry(): boolean;
  nextLevel(): boolean;
  showHome(): boolean;
}
