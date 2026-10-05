export class StreetSound {
  private context?:AudioContext;private master?:GainNode;private motor?:OscillatorNode;private motorGain?:GainNode;private muted=true;private last=-1;
  get isMuted(){return this.muted;}
  async enable(){
    try{if(!this.context){const ctx=this.context=new AudioContext(),master=this.master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
      const motor=this.motor=ctx.createOscillator();motor.type='triangle';motor.frequency.value=80;const motorGain=this.motorGain=ctx.createGain();motorGain.gain.value=0;motor.connect(motorGain).connect(master);motor.start();
      const buffer=ctx.createBuffer(1,ctx.sampleRate*8,ctx.sampleRate),data=buffer.getChannelData(0);let seed=777,sample=0;for(let i=0;i<data.length;i++){seed=(seed*1664525+1013904223)>>>0;sample=.98*sample+.02*(seed/4294967296*2-1);data[i]=sample;}
      const wind=ctx.createBufferSource();wind.buffer=buffer;wind.loop=true;const gain=ctx.createGain();gain.gain.value=.16;wind.connect(gain).connect(master);wind.start();
    }await this.context.resume();this.muted=false;this.master!.gain.setTargetAtTime(.35,this.context.currentTime,.15);}catch{this.muted=true;}
  }
  async visibility(hidden:boolean){if(!this.context)return;if(hidden)await this.context.suspend();else if(!this.muted)await this.context.resume();}
  diagnostics(){return {muted:this.muted,state:this.context?.state??"uninitialized",motorGain:this.motorGain?.gain.value??0,masterGain:this.master?.gain.value??0};}
  mute(){this.muted=true;if(this.context)this.master?.gain.setTargetAtTime(0,this.context.currentTime,.1);}
  update(speed:number){if(!this.context||!this.motor||!this.motorGain||Math.abs(speed-this.last)<.1)return;this.last=speed;const t=this.context.currentTime;this.motor.frequency.setTargetAtTime(65+speed*13,t,.12);this.motorGain.gain.setTargetAtTime(speed>.1?.009+speed*.0015:0,t,.15);}
  chime(kind:'tap'|'send'|'stop'|'success'|'bell'){
    if(!this.context||this.muted)return;const notes=kind==='success'?[392,494,587,784]:kind==='stop'?[330,262]:kind==='send'?[262,392]:kind==='bell'?[880,1174]:[520];const ctx=this.context;
    notes.forEach((f,i)=>{const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type='sine';oscillator.frequency.value=f;const time=ctx.currentTime+i*.12;gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(kind==='bell'?.025:.09,time+.01);gain.gain.exponentialRampToValueAtTime(.001,time+.55);oscillator.connect(gain).connect(this.master!);oscillator.start(time);oscillator.stop(time+.6);oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};});
  }
}
