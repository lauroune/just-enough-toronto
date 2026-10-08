import type * as T from 'three';
import type {Point} from '../game';
import type {Bounds} from './grid';
import type * as Kit from './kit';

/** One building as fetched: City-measured height where available, OSM tags where mapped. */
export type ChunkBuilding={
 id:string;p:Point[];holes:Point[][];h:number;
 heightSource:'city'|'osm-height'|'osm-levels'|'default';
 kind?:string;levels?:number;colour?:string;material?:string;roofShape?:string;
 name?:string;shop?:string;street?:string;number?:string;heritage?:boolean;
};
export type ChunkRoad={n:string;k:string;w:number;p:Point[];bridge?:boolean;oneway?:boolean};
/** src/chunks/areas/<id>/data.json, written by scripts/chunks/fetch-chunk.ts. */
export type ChunkData={
 id:string;bounds:Bounds;fetched:string;sources:string[];
 buildings:ChunkBuilding[];roads:ChunkRoad[];rails:{k:string;p:Point[]}[];trees:Point[];
 parks:{k:string;n:string;p:Point[]}[];places:{name:string;kind:string;at:Point}[];
};
/**
 * Where a chunk puts things. All three are per-200 m groups positioned in world metres:
 *  - tile: always drawn to the fog line (massing, roofs, ground, streets);
 *  - detail: drawn near the player (sills, mullions, signs, trees, furniture);
 *  - far: drawn only beyond detail range (cheap facade planes standing in for detail).
 */
export type ChunkLayers={tile(x:number,z:number):T.Group;detail(x:number,z:number):T.Group;far(x:number,z:number):T.Group};
export type ChunkContext={
 data:ChunkData;layers:ChunkLayers;kit:typeof Kit;
 /** Seeded per chunk: the same chunk always builds the same way. */
 rand:()=>number;
 /** Add a solid footprint (walls only, like the rest of the city). Kit building helpers call this for you. */
 solid(p:Point[],h:number):void;
};
/** src/chunks/areas/<id>/index.ts default-exports this. */
export type ChunkModule={
 meta:{title:string;character:string;heroes?:string[]};
 build(ctx:ChunkContext):void;
};
