import roads from './data/downtown-roads.json';
import type {Point} from '../game';
/** Downtown's OpenStreetMap street grid (ODbL), without the DOM-dependent district builder. */
export type DowntownRoad={n:string;k:string;w:number;p:Point[]};
export const DOWNTOWN_ROADS=roads as unknown as DowntownRoad[];
