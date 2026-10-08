import {test} from 'node:test';import assert from 'node:assert/strict';
import {WAYPOINTS,waypointBounds,nearestWaypoint} from '../src/rush/waypoints';
test('key locations project to their streets, each with a unique id and colour',()=>{
 const at=Object.fromEntries(WAYPOINTS.map(w=>[w.id,w]));
 assert.deepEqual(Object.keys(at).sort(),['ada','next','venn']);
 // Ada on Front by CityPlace, Venn on Richmond west of Spadina, NEXT on Bloor at Church: west/north of Queen East.
 assert.ok(Math.hypot(at.ada.x+4102,at.ada.z-692)<5);assert.ok(Math.hypot(at.venn.x+4460,at.venn.z-27)<5);assert.ok(Math.hypot(at.next.x+2432,at.next.z+2055)<5);
 assert.equal(new Set(WAYPOINTS.map(w=>w.color)).size,WAYPOINTS.length);
 const b=waypointBounds();for(const w of WAYPOINTS)assert.ok(w.x>b.left&&w.x<b.right&&w.z>b.top&&w.z<b.bottom);
 assert.equal(nearestWaypoint([-4100,690]).w.id,'ada');
});
