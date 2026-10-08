import * as T from 'three';
import raw from './data/waypoints.json';
import {project} from '../geography';
import {groundHeight} from '../terrain';
import type {Point} from '../game';

// Key locations: named places with a beam you can see across the city, a marker on
// both maps and an arrival banner. Add one by adding a line to data/waypoints.json;
// latitude/longitude are the source of truth, projected into the game's metres here.
export type Waypoint={id:string;name:string;address:string;color:string;x:number;z:number};
export const WAYPOINTS:Waypoint[]=raw.map(w=>{const [x,z]=project(w.lon,w.lat);return {id:w.id,name:w.name,address:w.address,color:w.color,x,z};});
/** You have "arrived" within this many metres of a waypoint. */
export const ARRIVE=40;

function label(text:string,sub:string,color:string){
 const c=document.createElement('canvas');c.width=512;c.height=160;const g=c.getContext('2d')!;
 g.fillStyle='rgba(33,67,77,.88)';g.beginPath();g.roundRect(8,8,496,144,40);g.fill();
 g.fillStyle=color;g.beginPath();g.arc(76,80,26,0,Math.PI*2);g.fill();
 g.fillStyle='#fff1d8';g.font='700 58px DM Sans, sans-serif';g.textBaseline='alphabetic';g.fillText(text,124,90,370);
 g.fillStyle='#cfe3d6';g.font='400 30px DM Sans, sans-serif';g.fillText(sub,126,128,370);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
}
/** A coloured beam and a floating name for each waypoint, visible over the rooftops from anywhere. */
export function buildWaypointBeacons(){
 const group=new T.Group();group.name='Rush waypoints';
 for(const w of WAYPOINTS){
  const g=new T.Group();g.position.set(w.x,groundHeight(w.x,w.z),w.z);g.userData.waypoint=w.id;
  const beam=new T.Mesh(new T.CylinderGeometry(2.2,2.2,240,24,1,true),new T.MeshBasicMaterial({color:w.color,transparent:true,opacity:.3,blending:T.AdditiveBlending,depthWrite:false,fog:false,side:T.DoubleSide}));beam.position.y=120;
  const ring=new T.Mesh(new T.RingGeometry(ARRIVE*.6,ARRIVE*.68,64),new T.MeshBasicMaterial({color:w.color,transparent:true,opacity:.75,depthWrite:false,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.12;
  const sign=new T.Sprite(new T.SpriteMaterial({map:label(w.name,w.address,w.color),depthWrite:false,fog:false,transparent:true}));sign.scale.set(48,15,1);sign.position.y=70;
  g.add(beam,ring,sign);group.add(g);
 }
 return group;
}
/** The smallest rectangle around every waypoint, padded so markers sit inside the big map. */
export function waypointBounds(pad=180){
 const xs=WAYPOINTS.map(w=>w.x),zs=WAYPOINTS.map(w=>w.z);
 return {left:Math.min(...xs)-pad,right:Math.max(...xs)+pad,top:Math.min(...zs)-pad,bottom:Math.max(...zs)+pad};
}
export const nearestWaypoint=(p:Point)=>WAYPOINTS.map(w=>({w,d:Math.hypot(w.x-p[0],w.z-p[1])})).sort((a,b)=>a.d-b.d)[0];
