import raw from './data/surfaces.json';
import type {Point} from './game';
export type MappedSurface={id:number;kind:string;subtype?:string;p:Point[];holes:Point[][]};
export const SURFACES=raw as unknown as {meta:Record<string,unknown>;surfaces:MappedSurface[];green:MappedSurface[];curbs:Point[][];supplementalPaths:MappedSurface[]};
