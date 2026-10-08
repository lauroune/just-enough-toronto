import type {ChunkModule} from './types';

/**
 * The base layer for a chunk with data but no design yet: the full street kit (asphalt, curbs,
 * sidewalks, paint, streetcar track), parks, mapped trees, and every building as textured
 * massing with painted windows. It reuses Queen East's materials, so the whole map is
 * drivable and city-like before a chunk designer gets to it.
 */
export const baseChunk:ChunkModule={
 meta:{title:'Base streets',character:'The street network with plain textured massing and mapped trees, before this chunk is designed.'},
 build(ctx){
  const {kit,data}=ctx;
  kit.streets(ctx);kit.parks(ctx);
  for(const b of data.buildings)kit.building(ctx,b,{skipDetail:true});
  kit.dressStreets(ctx,{fillTrees:false,lightSpacing:48});
 },
};
