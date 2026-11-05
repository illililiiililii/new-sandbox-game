/* Original procedural score + effects. Nothing is streamed or downloaded. */
export class AudioSystem {
  constructor(settings){this.settings=settings;this.ctx=null;this.muted=false;this.intensity=0;this.active=false;this.step=0;this.next=0;this.last={};}
  async init(){if(this.ctx){if(this.ctx.state==='suspended')await this.ctx.resume();return;}try{const Ctx=window.AudioContext||window.webkitAudioContext;this.ctx=new Ctx();this.master=this.ctx.createGain();this.music=this.ctx.createGain();this.fx=this.ctx.createGain();const comp=this.ctx.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=5;comp.attack.value=.005;comp.release.value=.2;this.music.connect(this.master);this.fx.connect(this.master);this.master.connect(comp);comp.connect(this.ctx.destination);this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate*2,this.ctx.sampleRate);const data=this.noise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;this.apply();this.next=this.ctx.currentTime+.1;this.clock=setInterval(()=>this.schedule(),50);}catch(e){console.warn('Audio unavailable',e.message);}}
  apply(){if(!this.ctx)return;const t=this.ctx.currentTime;this.master.gain.setTargetAtTime(this.muted?0:this.settings.volume/100*.65,t,.025);this.music.gain.setTargetAtTime(this.settings.music/100*.45,t,.1);this.fx.gain.value=.8;}
  tone(frequency,duration=.2,volume=.1,type='sine',destination=this.fx,time=this.ctx?.currentTime,slide){if(!this.ctx||!destination)return;const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type=type;osc.frequency.setValueAtTime(Math.max(20,frequency),time);if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(20,slide),time+duration);gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),time+.008);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);osc.connect(gain);gain.connect(destination);osc.start(time);osc.stop(time+duration+.02);}
  hiss(duration=.1,volume=.1,cutoff=1500,time=this.ctx?.currentTime){if(!this.ctx)return;const src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),g=this.ctx.createGain();src.buffer=this.noise;filter.type='highpass';filter.frequency.value=cutoff;g.gain.setValueAtTime(volume,time);g.gain.exponentialRampToValueAtTime(.0001,time+duration);src.connect(filter);filter.connect(g);g.connect(this.fx);src.start(time,Math.random());src.stop(time+duration);}
  play(name){if(!this.ctx||this.muted)return;const t=this.ctx.currentTime;const limits={shot:.065,kill:.045,arc:.09,hurt:.2,combo:.15};if(t-(this.last[name]||-100)<(limits[name]||0))return;this.last[name]=t;
    if(name==='shot'){this.tone(610,.055,.035,'triangle',this.fx,t,220);this.hiss(.03,.016,4500);}
    if(name==='kill'){this.tone(110+Math.random()*70,.13,.07,'triangle',this.fx,t,35);this.hiss(.09,.035,900);}
    if(name==='dash'){this.hiss(.22,.12,2200);this.tone(150,.18,.07,'sine',this.fx,t,700);}
    if(name==='pulse'){this.tone(190,.65,.25,'sine',this.fx,t,30);this.tone(520,.4,.1,'triangle',this.fx,t,80);this.hiss(.3,.18,300);}
    if(name==='arc'){this.tone(1200,.07,.045,'sawtooth',this.fx,t,200);}
    if(name==='hurt'){this.tone(115,.25,.2,'sawtooth',this.fx,t,45);this.hiss(.15,.12,500);}
    if(name==='block'){this.tone(1100,.2,.1,'sine',this.fx,t,2200);}
    if(name==='combo'){[440,660,880].forEach((f,i)=>this.tone(f,.2,.09,'triangle',this.fx,t+i*.045));}
    if(name==='level'||name==='heal'){[330,440,660,880].forEach((f,i)=>this.tone(f,.4,.1,'sine',this.fx,t+i*.08));}
    if(name==='boss'){[55,58.27,82.4].forEach(f=>this.tone(f,2,.13,'sawtooth',this.fx,t));}
    if(name==='victory'){[261.6,329.6,392,523.2,659.2,784].forEach((f,i)=>this.tone(f,1.2,.12,'triangle',this.fx,t+i*.12));}
    if(name==='down'){this.tone(440,.9,.14,'sawtooth',this.fx,t,35);this.hiss(.5,.15,400);}
    if(name==='click'){this.tone(880,.06,.045,'sine',this.fx,t,1300);}
  }
  schedule(){if(!this.ctx)return;const bpm=this.active?118:92,beat=60/bpm/4;while(this.next<this.ctx.currentTime+.12){this.beat(this.step++,this.next);this.next+=beat;}if(this.next<this.ctx.currentTime)this.next=this.ctx.currentTime+.05;}
  beat(step,t){const i=step%32;const notes=[55,55,65.406,49];const root=notes[Math.floor(step/32)%4],arp=[0,7,12,19,12,7,3,10];const f=root*4*Math.pow(2,arp[i%8]/12);this.tone(f,.3,this.active?.035:.025,'triangle',this.music,t);if(i%4===0)this.tone(root,i%8===0?.4:.2,this.active?.09:.04,'triangle',this.music,t);
    if(this.active){if(i%8===0||this.intensity>.6&&i===22){this.tone(120,.18,.2,'sine',this.music,t,35);}if(i%8===4){this.tone(150,.13,.06,'triangle',this.music,t,65);const src=this.ctx.createBufferSource(),g=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();src.buffer=this.noise;filter.type='highpass';filter.frequency.value=1700;g.gain.setValueAtTime(.07,t);g.gain.exponentialRampToValueAtTime(.0001,t+.1);src.connect(filter);filter.connect(g);g.connect(this.music);src.start(t,.2);src.stop(t+.1);}if(i%2===0){const src=this.ctx.createBufferSource(),g=this.ctx.createGain(),filter=this.ctx.createBiquadFilter();src.buffer=this.noise;filter.type='highpass';filter.frequency.value=7500;g.gain.setValueAtTime(.025,t);g.gain.exponentialRampToValueAtTime(.0001,t+.035);src.connect(filter);filter.connect(g);g.connect(this.music);src.start(t,.8);src.stop(t+.04);}}
    if(i===0){for(const ratio of [1,Math.pow(2,3/12),1.5])this.tone(root*2*ratio,2.5,.018,'sine',this.music,t);}
  }
}
