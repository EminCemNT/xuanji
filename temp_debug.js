
// ============================================================
// 星际风筝传说 v6.0 — 性能大修：绝对坐标渲染去save/restore + FPS系统修复
// 基于 Raiden 雷电 × 独立游戏果汁设计
// ============================================================
const GAME_VERSION = 'v6.10';
// v6.10: 终极NaN防御 — dt/坐标/计时器全面防NaN+看门狗取消story豁免
// v6.9: 彻底根治卡死 — 武器升级不暂停游戏+15秒超时兜底+看门狗重构
// v6.8: story帧驱动重写+武器升级去重
// v6.5.2: 彻底修复Boss阶段卡死 - try-catch保护 + 清理残留setTimeout + 阶段转换时清理过量粒子
// + P1: Boss阶段化系统 — 血量75%/50%/25%时自动变相（攻击模式+颜色+护盾）
// + P2: 武器升级选择界面 — 收集武器道具时弹出3选1 Roguelite界面
// + Boss每个阶段有独特的弹幕模式和视觉效果
// + 武器升级可选：升级当前武器/切换武器类型/获得特殊能力
// 性能优化：Boss阶段转换时添加无敌帧，避免玩家被秒杀
const BUILD_DATE = '2026-07-01';
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');
canvas.style.imageRendering = 'auto';
let W, H;
let lastTime=0, dt=0;
let gameRunning=false;
let frameCount=0;
// FPS自适应降级 — v6.0: 8帧采样+缓和衰减+新局重置
let _fpsSamples=[], _adaptMaxEB=200, _adaptMaxP=300;

// 持久化数据
const SAVE = {
  get(k,d){ try{const v=localStorage.getItem('kite_'+k);return v?JSON.parse(v):d;}catch(e){return d;} },
  set(k,v){ try{localStorage.setItem('kite_'+k,JSON.stringify(v));}catch(e){} }
};
let totalCoins = SAVE.get('coins',0);
let recordHeight = SAVE.get('record',0);
let totalKills = SAVE.get('kills',0);
let gamesPlayed = SAVE.get('games',0);
let currentSkin = SAVE.get('skin',0);
let currentDifficulty = SAVE.get('difficulty','normal');
let achievements = SAVE.get('achievements',[]);
let hasPlayedTutorial = SAVE.get('tutorial',false);

// 难度配置
const DIFFICULTIES = {
  easy: {
    name:'简单', desc:'休闲飞行', color:'#0f0',
    spawnMin:.6, spawnMax:1.4, speedMult:.75, bossHP:30, bossInterval:650,
    bulletSpeedMult:.7, startBombs:5, enemyProbs:[.6,.25,.15],
    spawnCount:1, shootRateMult:1.5, hp:5
  },
  normal: {
    name:'普通', desc:'星际巡航', color:'#0cf',
    spawnMin:.18, spawnMax:.55, speedMult:1.0, bossHP:55, bossInterval:500,
    bulletSpeedMult:1.0, startBombs:3, enemyProbs:[.35,.35,.3],
    spawnCount:1, shootRateMult:1.0, hp:3
  },
  hard: {
    name:'困难', desc:'枪林弹雨', color:'#f80',
    spawnMin:.08, spawnMax:.35, speedMult:1.3, bossHP:85, bossInterval:400,
    bulletSpeedMult:1.5, startBombs:2, enemyProbs:[.15,.35,.5],
    spawnCount:2, shootRateMult:.65, hp:2
  },
  hell: {
    name:'地狱', desc:'弹幕炼狱', color:'#f44',
    spawnMin:.03, spawnMax:.2, speedMult:1.6, bossHP:130, bossInterval:300,
    bulletSpeedMult:2.0, startBombs:1, enemyProbs:[.05,.3,.65],
    spawnCount:3, shootRateMult:.35, hp:1
  }
};
let diffCfg = DIFFICULTIES[currentDifficulty];

// ==================== 关卡分区系统 ====================
const ZONES = [
  { from:0, to:500, name:'低轨道', theme:'corporate',
    enemyBody:['#3a0a0a','#4a1010','#5a0505'], enemyStroke:['#f44','#f55','#f22'],
    enemyCore:['#f66','#f44','#f00'], bgHint:'#0d0d3a',
    bossNamePool:['996终极Boss','甲方之王','需求之神','Deadline Lord','PUA大师·改'],
    bossTitlePool:['职场暴君','需求黑洞','无限改稿者','KPI执刑人'],
    desc:'职场废土 — 996巡逻队出没'
  },
  { from:500, to:1500, name:'平流层', theme:'military',
    enemyBody:['#3a1a05','#4a2005','#5a2a05'], enemyStroke:['#f84','#f80','#f60'],
    enemyCore:['#fa6','#f84','#f60'], bgHint:'#0a1a3a',
    bossNamePool:['碎星级战列舰','猎杀者MK-X','星际将军','泰坦级要塞','重装机甲·改'],
    bossTitlePool:['军团统帅','碎星者','无尽炮火','钢铁洪流'],
    desc:'军事禁区 — 星际舰队巡逻中'
  },
  { from:1500, to:3000, name:'太空边缘', theme:'alien',
    enemyBody:['#1a0a3a','#2a0a4a','#0a1a4a'], enemyStroke:['#90f','#80f','#a0f'],
    enemyCore:['#c0f','#90f','#a0f'], bgHint:'#1a0a3a',
    bossNamePool:['虚空母舰','异星吞噬者','维度裂缝','暗影议会','心灵控制者'],
    bossTitlePool:['异星霸主','维度漫步者','虚空召唤者','暗影之王'],
    desc:'未知领域 — 外星文明遗迹'
  },
  { from:3000, to:6000, name:'深空', theme:'cosmic',
    enemyBody:['#2a0530','#3a0a40','#1a0520'], enemyStroke:['#f0f','#d0f','#c0f'],
    enemyCore:['#f8f','#f0f','#d0f'], bgHint:'#0a0a2a',
    bossNamePool:['超新星残骸','黑洞核心','宇宙奇点','暗物质聚合体','时空扭曲者'],
    bossTitlePool:['星海主宰','黑洞之王','宇宙终结者','熵增化身'],
    desc:'深空禁区 — 宇宙法则失效'
  },
  { from:6000, to:Infinity, name:'虚空', theme:'void',
    enemyBody:['#1a1a2a','#2a2a3a','#0a0a1a'], enemyStroke:['#fff','#ccc','#aaa'],
    enemyCore:['#fff','#eee','#ddd'], bgHint:'#000010',
    bossNamePool:['终焉之眼','虚空化身','存在否定者','万物归零','绝对虚无'],
    bossTitlePool:['虚空之神','存在抹除者','终结者·零','万物终焉'],
    desc:'虚空尽头 — 超越理解的领域'
  }
];

function getZone(heightM){
  for(let i=ZONES.length-1;i>=0;i--){
    if(heightM>=ZONES[i].from) return ZONES[i];
  }
  return ZONES[0];
}

// ==================== Boss类型 & 弹幕系统 ====================
const BOSS_PATTERNS = {
  corporate: { // 扇形弹幕 + 条状弹幕
    desc:'扇形弹幕',
    // 4个阶段的patterns：[阶段0=100%-75%, 阶段1=75%-50%, 阶段2=50%-25%, 阶段3=25%-0%]
    phasePatterns:[
      [ // 阶段0：基础扇形
        function(e,bsm){
          for(let i=-3;i<=3;i++) enemyBullets.push({x:e.x,y:e.y+20,vx:Math.sin(i*.3)*180*bsm,vy:200*bsm,life:4,alive:true,bulletType:'normal'});
        },
        function(e,bsm){
          for(let i=-1;i<=1;i++) enemyBullets.push({x:e.x+i*20,y:e.y+10,vx:0,vy:240*bsm,life:3.5,alive:true,bulletType:'fast'});
        }
      ],
      [ // 阶段1：加速+追踪
        function(e,bsm){
          for(let i=-4;i<=4;i++) enemyBullets.push({x:e.x,y:e.y+20,vx:Math.sin(i*.25)*220*bsm,vy:220*bsm,life:4,alive:true,bulletType:'normal'});
        },
        function(e,bsm){
          const dx=player.x-e.x,dy=player.y-e.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
          for(let i=0;i<2;i++) enemyBullets.push({x:e.x,y:e.y+15,vx:dx/dist*260*bsm,vy:dy/dist*260*bsm,life:4,alive:true,bulletType:'homing'});
        }
      ],
      [ // 阶段2：散射+爆炸
        function(e,bsm){
          for(let i=-2;i<=2;i++) enemyBullets.push({x:e.x+i*16,y:e.y+10,vx:i*80*bsm,vy:260*bsm,life:3.5,alive:true,bulletType:'explosive'});
        },
        function(e,bsm){
          for(let i=0;i<6;i++){
            const a=i*Math.PI/3;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*200*bsm,vy:Math.sin(a)*200*bsm,life:3,alive:true,bulletType:'wave'});
          }
        }
      ],
      [ // 阶段3：狂暴模式
        function(e,bsm){
          for(let i=-5;i<=5;i++) enemyBullets.push({x:e.x,y:e.y+20,vx:Math.sin(i*.2)*240*bsm,vy:240*bsm,life:3.5,alive:true,bulletType:'fast'});
        },
        function(e,bsm){
          const dx=player.x-e.x,dy=player.y-e.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
          for(let i=0;i<3;i++) enemyBullets.push({x:e.x,y:e.y+15,vx:dx/dist*300*bsm+Math.sin(i)*60,vy:dy/dist*300*bsm+Math.cos(i)*60,life:4,alive:true,bulletType:'homing'});
        }
      ]
    ]
  },
  military: { // 旋转炮台 + 散弹
    desc:'旋转炮台',
    phasePatterns:[
      [ // 阶段0：基础旋转
        function(e,bsm){
          for(let i=0;i<8;i++){
            const a=i*Math.PI*2/8+frameCount*.06;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*150*bsm,vy:Math.sin(a)*100*bsm+140*bsm,life:4,alive:true,bulletType:'normal'});
          }
        },
        function(e,bsm){
          for(let i=-2;i<=2;i+=2){
            for(let j=-1;j<=1;j+=2){
              enemyBullets.push({x:e.x,y:e.y+10,vx:j*100*bsm,vy:(200+i*20)*bsm,life:4,alive:true,bulletType:'normal'});
            }
          }
        }
      ],
      [ // 阶段1：加速旋转+快速弹
        function(e,bsm){
          for(let i=0;i<10;i++){
            const a=i*Math.PI*2/10+frameCount*.08;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*170*bsm,vy:Math.sin(a)*100*bsm+150*bsm,life:4,alive:true,bulletType:'fast'});
          }
        },
        function(e,bsm){
          for(let i=0;i<6;i++){
            const a=i*Math.PI*2/6+frameCount*.04;
            const spd=140+Math.sin(frameCount*.1)*40;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*spd*bsm,vy:Math.sin(a)*spd*bsm,life:3.5,alive:true,bulletType:'normal'});
          }
        }
      ],
      [ // 阶段2：饱和攻击
        function(e,bsm){
          for(let i=-3;i<=3;i+=1){
            enemyBullets.push({x:e.x,y:e.y+10,vx:i*90*bsm,vy:220*bsm,life:3.5,alive:true,bulletType:'normal'});
          }
        },
        function(e,bsm){
          for(let i=0;i<8;i++){
            const a=i*Math.PI*2/8;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*160*bsm,vy:Math.sin(a)*160*bsm,life:3,alive:true,bulletType:'fast'});
          }
        }
      ],
      [ // 阶段3：狂暴扫射
        function(e,bsm){
          for(let i=0;i<12;i++){
            const a=i*Math.PI*2/12+frameCount*.1;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*190*bsm,vy:Math.sin(a)*120*bsm+160*bsm,life:3.5,alive:true,bulletType:'fast'});
          }
        },
        function(e,bsm){
          for(let i=-4;i<=4;i+=1){
            enemyBullets.push({x:e.x,y:e.y+15,vx:i*70*bsm,vy:240*bsm,life:3,alive:true,bulletType:'homing'});
          }
        }
      ]
    ]
  },
  alien: { // 波浪弹 + 分裂弹
    desc:'分裂弹幕',
    phasePatterns:[
      [ // 阶段0：基础波浪
        function(e,bsm){
          for(let i=0;i<8;i++){
            const a=i*Math.PI*2/8+Math.sin(frameCount*.05)*.3;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*160*bsm,vy:Math.sin(a)*160*bsm,life:3.5,alive:true,bulletType:'wave'});
          }
        },
        function(e,bsm){
          for(let i=-1;i<=1;i++){
            const b={x:e.x,y:e.y+10,vx:i*50*bsm,vy:150*bsm,life:1.5,alive:true,willSplit:true,bulletType:'explosive'};
            enemyBullets.push(b);
          }
        }
      ],
      [ // 阶段1：加速波浪+追踪
        function(e,bsm){
          for(let i=0;i<10;i++){
            const a=i*Math.PI*2/10+Math.sin(frameCount*.05)*.5;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*180*bsm,vy:Math.sin(a)*180*bsm,life:3.5,alive:true,bulletType:'wave'});
          }
        },
        function(e,bsm){
          const dx=player.x-e.x,dy=player.y-e.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
          enemyBullets.push({x:e.x,y:e.y,vx:dx/dist*240*bsm,vy:dy/dist*240*bsm,life:4,alive:true,bulletType:'homing'});
        }
      ],
      [ // 阶段2：分裂弹海
        function(e,bsm){
          for(let i=-2;i<=2;i++){
            const b={x:e.x,y:e.y+10,vx:i*60*bsm,vy:160*bsm,life:1.5,alive:true,willSplit:true,bulletType:'explosive'};
            enemyBullets.push(b);
          }
        },
        function(e,bsm){
          for(let i=0;i<8;i++){
            const a=i*Math.PI/4+frameCount*.06;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*170*bsm,vy:Math.abs(Math.sin(a))*190*bsm+50*bsm,life:4,alive:true,bulletType:'wave'});
          }
        }
      ],
      [ // 阶段3：异星狂暴
        function(e,bsm){
          for(let i=0;i<12;i++){
            const a=i*Math.PI*2/12+Math.sin(frameCount*.08)*.7;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*200*bsm,vy:Math.sin(a)*200*bsm,life:3,alive:true,bulletType:'wave'});
          }
        },
        function(e,bsm){
          for(let i=-2;i<=2;i+=1){
            const b={x:e.x,y:e.y+10,vx:i*70*bsm,vy:180*bsm,life:1.2,alive:true,willSplit:true,bulletType:'explosive'};
            enemyBullets.push(b);
          }
        }
      ]
    ]
  },
  cosmic: { // 黑洞吸引 + 旋转弹幕
    desc:'引力弹幕',
    phasePatterns:[
      [ // 阶段0：基础向心
        function(e,bsm){
          for(let i=0;i<10;i++){
            const a=i*Math.PI*2/10;
            enemyBullets.push({x:e.x+Math.cos(a)*100,y:e.y+Math.sin(a)*60,vx:-Math.cos(a)*180*bsm,vy:-Math.sin(a)*180*bsm,life:3,alive:true,bulletType:'orb'});
          }
        },
        function(e,bsm){
          for(let i=0;i<8;i++){
            const a=i*Math.PI*2/8+frameCount*.04;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*130*bsm,vy:Math.sin(a)*130*bsm,life:3.5,alive:true,bulletType:'normal'});
          }
        }
      ],
      [ // 阶段1：双环+追踪
        function(e,bsm){
          for(let i=0;i<16;i++){
            const a=i*Math.PI*2/16+frameCount*.06;
            const r=i%2===0?80:140;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*r*bsm,vy:Math.sin(a)*r*bsm,life:3.5,alive:true,bulletType:i%2?'normal':'fast'});
          }
        },
        function(e,bsm){
          const dx=player.x-e.x,dy=player.y-e.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
          enemyBullets.push({x:e.x,y:e.y,vx:dx/dist*280*bsm,vy:dy/dist*280*bsm,life:4,alive:true,bulletType:'homing'});
        }
      ],
      [ // 阶段2：黑洞+散射
        function(e,bsm){
          for(let i=0;i<12;i++){
            const a=i*Math.PI*2/12;
            enemyBullets.push({x:e.x+Math.cos(a)*120,y:e.y+Math.sin(a)*80,vx:-Math.cos(a)*200*bsm,vy:-Math.sin(a)*200*bsm,life:3,alive:true,bulletType:'orb'});
          }
        },
        function(e,bsm){
          for(let i=-2;i<=2;i+=1){
            enemyBullets.push({x:e.x,y:e.y+15,vx:i*110*bsm,vy:200*bsm,life:3.5,alive:true,bulletType:'normal'});
          }
        }
      ],
      [ // 阶段3：宇宙崩塌
        function(e,bsm){
          for(let i=0;i<20;i++){
            const a=i*Math.PI*2/20+frameCount*.08;
            const r=i%2===0?100:160;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*r*bsm,vy:Math.sin(a)*r*bsm,life:3,alive:true,bulletType:i%2?'fast':'orb'});
          }
        },
        function(e,bsm){
          const dx=player.x-e.x,dy=player.y-e.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
          for(let i=0;i<3;i++){
            const a=(i-1)*.3;
            const cx=dx/dist*Math.cos(a)-dy/dist*Math.sin(a);
            const cy=dx/dist*Math.sin(a)+dy/dist*Math.cos(a);
            enemyBullets.push({x:e.x,y:e.y,vx:cx*280*bsm,vy:cy*280*bsm,life:4,alive:true,bulletType:'homing'});
          }
        }
      ]
    ]
  },
  void: { // 全屏弹幕 + 激光
    desc:'终焉弹幕',
    phasePatterns:[
      [ // 阶段0：基础全屏
        function(e,bsm){
          for(let i=0;i<10;i++){
            const a=i*Math.PI*2/10+frameCount*.03;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*180*bsm,vy:Math.sin(a)*180*bsm,life:4,alive:true,bulletType:'wave'});
          }
        },
        function(e,bsm){
          for(let i=0;i<8;i++){
            const a=i*Math.PI*2/8;
            const spd=160+Math.sin(frameCount*.1+i)*50;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*spd*bsm,vy:Math.sin(a)*spd*bsm,life:3.5,alive:true,bulletType:'orb'});
          }
        }
      ],
      [ // 阶段1：激光+波浪
        function(e,bsm){
          for(let i=0;i<14;i++){
            const a=i*Math.PI*2/14+frameCount*.03;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*200*bsm,vy:Math.sin(a)*200*bsm,life:4,alive:true,bulletType:'wave'});
          }
        },
        function(e,bsm){
          for(let i=0;i<3;i++){
            const dx=player.x-e.x,dy=player.y-e.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
            const offA=(i-1)*.25;
            const cosA=Math.cos(offA),sinA=Math.sin(offA);
            const rdx=dx/dist*cosA-dy/dist*sinA;
            const rdy=dx/dist*sinA+dy/dist*cosA;
            enemyBullets.push({x:e.x,y:e.y,vx:rdx*220*bsm,vy:rdy*220*bsm,life:5,alive:true,bulletType:'laser'});
          }
        }
      ],
      [ // 阶段2：虚空裂隙
        function(e,bsm){
          for(let i=0;i<12;i++){
            const a=i*Math.PI*2/12;
            const spd=180+Math.sin(frameCount*.1+i)*60;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*spd*bsm,vy:Math.sin(a)*spd*bsm,life:3.5,alive:true,bulletType:'orb'});
          }
        },
        function(e,bsm){
          for(let i=0;i<2;i++){
            const sx=W*.2+Math.random()*W*.6;
            const sy=H*.1+Math.random()*H*.2;
            for(let j=0;j<4;j++){
              const a=j*Math.PI/2;
              enemyBullets.push({x:sx,y:sy,vx:Math.cos(a)*120,vy:Math.sin(a)*80+60,life:3,alive:true,bulletType:'wave'});
            }
          }
        }
      ],
      [ // 阶段3：终焉审判
        function(e,bsm){
          for(let i=0;i<16;i++){
            const a=i*Math.PI*2/16+frameCount*.05;
            enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*220*bsm,vy:Math.sin(a)*220*bsm,life:3.5,alive:true,bulletType:'wave'});
          }
        },
        function(e,bsm){
          for(let i=0;i<5;i++){
            const dx=player.x-e.x,dy=player.y-e.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
            const offA=(i-2)*.3;
            const cosA=Math.cos(offA),sinA=Math.sin(offA);
            const rdx=dx/dist*cosA-dy/dist*sinA;
            const rdy=dx/dist*sinA+dy/dist*cosA;
            enemyBullets.push({x:e.x,y:e.y,vx:rdx*300*bsm,vy:rdy*300*bsm,life:4,alive:true,bulletType:'laser'});
          }
        }
      ]
    ]
  }
};

// ==================== 敌人子弹类型系统 ====================
const ENEMY_BULLET_TYPES = {
  normal: {color:'#f44',icon:'●',size:5,glow:'rgba(255,50,50,0.6)',inner:'rgba(255,255,255,0.8)'},
  homing: {color:'#f84',icon:'◆',size:5,glow:'rgba(255,136,68,0.6)',inner:'rgba(255,255,255,0.8)'},
  wave:   {color:'#4fc',icon:'~',size:4,glow:'rgba(68,255,204,0.6)',inner:'rgba(255,255,255,0.8)'},
  explosive:{color:'#f80',icon:'◉',size:7,glow:'rgba(255,136,0,0.7)',inner:'rgba(255,255,200,0.9)',willExplode:true},
  fast:   {color:'#fff',icon:'⚡',size:3,glow:'rgba(255,255,255,0.8)',inner:'rgba(255,255,255,1)'},
  orb:    {color:'#a4f',icon:'◎',size:9,glow:'rgba(170,68,255,0.5)',inner:'rgba(255,255,255,0.6)'},
  laser:  {color:'#f22',icon:'▬',size:2,glow:'rgba(255,34,34,0.9)',inner:'#fff',isBeam:true}
};

// ==================== Boss技能系统 ====================
const BOSS_SKILLS = {
  corporate: [
    {name:'需求风暴', weight:3, cooldown:4.5, fn(e){ // 一圈弹幕8发(原16)
      for(let i=0;i<8;i++){
        const a=i*Math.PI*2/8;
        enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*80,vy:Math.sin(a)*80,life:4,alive:true,bulletType:'orb',isSkill:true});
      }
    }},
    {name:'会议召集', weight:2, cooldown:6, fn(e){ // 召唤2个中型敌兵(原3)
      for(let i=0;i<2;i++){
        const m=createEnemy('medium');
        m.x=e.x+(Math.random()-.5)*120; m.y=e.y-30+Math.random()*30;
        m.name='会议代表';
        enemies.push(m);
      }
    }},
    {name:'改稿风暴', weight:3, cooldown:5, fn(e){ // 波浪弹幕群 2层×6发(原3×8)
      for(let layer=0;layer<2;layer++){
        for(let i=0;i<6;i++){
          const a=i*Math.PI*2/6;
          enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*(100+layer*40),vy:Math.sin(a)*(80+layer*30)+60,life:3.5,alive:true,bulletType:'wave'});
        }
      }
    }}
  ],
  military: [
    {name:'饱和打击', weight:3, cooldown:5, fn(e){ // 从屏幕边缘 4×2发(原6×3)
      for(let i=0;i<4;i++){
        const side=i%2===0?0:W;
        for(let j=0;j<2;j++){
          enemyBullets.push({x:side,y:Math.random()*H*.4,vx:side===0?250:-250,vy:Math.random()*60-30,life:2.5,alive:true,bulletType:'fast'});
        }
      }
    }},
    {name:'轨道炮', weight:2, cooldown:7, fn(e){ // 2发高速追踪弹(原3) — v6.5.2: 用延迟队列代替setTimeout
      for(let i=0;i<2;i++){
        // 用帧计数器延迟，避免setTimeout在iframe中不可靠
        const delayFrames=15*(i+1); // 第1发15帧后，第2发30帧后
        const targetX=player.x,targetY=player.y,srcX=e.x,srcY=e.y;
        if(!_delayedBullets) _delayedBullets=[];
        _delayedBullets.push({frame:frameCount+delayFrames,x:srcX,y:srcY,tx:targetX,ty:targetY,speed:500,life:1.8,type:'laser',isSkill:true});
      }
    }},
    {name:'火力覆盖', weight:4, cooldown:3.5, fn(e){ // 左右交替扫射 8发(原12)
      for(let i=0;i<8;i++){
        const a=-0.4+i*0.11;
        enemyBullets.push({x:e.x,y:e.y+10,vx:Math.sin(a)*240,vy:180+Math.cos(a)*60,life:2.5,alive:true,bulletType:'normal'});
      }
    }}
  ],
  alien: [
    {name:'分裂繁殖', weight:3, cooldown:6, fn(e){ // 放出2个分裂弹(原3)
      for(let i=-1;i<=1;i+=2){
        enemyBullets.push({x:e.x+i*25,y:e.y+10,vx:i*70,vy:140,life:1,alive:true,willSplit:true,bulletType:'explosive'});
      }
    }},
    {name:'心灵震爆', weight:2, cooldown:7, fn(e){ // 全屏子弹短暂减速+变色
      for(let i=enemyBullets.length-1;i>=0;i--){
        const b=enemyBullets[i];
        if(!b.isSkill&&Math.random()<.25){b.vx*=.35;b.vy*=.35;b.life+=.8;b.bulletType='wave';}
      }
    }},
    {name:'波形共振', weight:3, cooldown:5, fn(e){ // 2层波形弹幕(原3) — v6.5.2: 用延迟队列代替setTimeout
      const srcX=e.x,srcY=e.y;
      for(let layer=0;layer<2;layer++){
        const delayFrames=11*(layer+1); // 第1层11帧，第2层22帧
        if(!_delayedWaves) _delayedWaves=[];
        _delayedWaves.push({frame:frameCount+delayFrames,x:srcX,y:srcY,layer:layer,count:6});
      }
    }}
  ],
  cosmic: [
    {name:'引力奇点', weight:3, cooldown:5, fn(e){ // 引力弹 10发+每2帧引力(原16发)
      const gx=W*.2+Math.random()*W*.6, gy=H*.1+Math.random()*H*.3;
      for(let i=0;i<10;i++){
        const a=i*Math.PI*2/10;
        enemyBullets.push({x:e.x+Math.cos(a)*50,y:e.y+Math.sin(a)*50,vx:Math.cos(a)*60,vy:Math.sin(a)*60,life:2.5,alive:true,bulletType:'orb',gravityTarget:{x:gx,y:gy,strength:240}});
      }
    }},
    {name:'黑洞吞噬', weight:2, cooldown:8, fn(e){ // 吸收玩家子弹
      for(let i=playerBullets.length-1;i>=0;i--){
        const b=playerBullets[i];
        const dx=e.x-b.x,dy=e.y-b.y,dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<200){
          b.vx+=(dx/dist)*800*dt;b.vy+=(dy/dist)*800*dt;
          if(dist<30){playerBullets.splice(i,1);spawnParticles(b.x,b.y,3,'#90f',20,.2,1);}
        }
      }
    }},
    {name:'时空扭曲', weight:2, cooldown:6, fn(e){ // 混淆+8发弹(原12)
      player.confused=2.5;
      for(let i=0;i<8;i++){
        const a=i*Math.PI*2/8;
        enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*140,vy:Math.sin(a)*140,life:2.5,alive:true,bulletType:'fast'});
      }
    }}
  ],
  void: [
    {name:'虚无屏障', weight:2, cooldown:8, fn(e){ // Boss短暂无敌
      e.invulnerable=2.5;
      spawnParticles(e.x,e.y,20,'#a4f',100,.5,3);
    }},
    {name:'虚空裂隙', weight:4, cooldown:4.5, fn(e){ // 2个裂隙各5发(原3×6)
      for(let i=0;i<2;i++){
        const sx=W*.1+Math.random()*W*.8, sy=H*.05+Math.random()*H*.25;
        for(let j=0;j<5;j++){
          const a=j*Math.PI*2.5;
          enemyBullets.push({x:sx,y:sy,vx:Math.cos(a)*100,vy:Math.sin(a)*60+80,life:3,alive:true,bulletType:'wave'});
        }
      }
    }},
    {name:'终焉审判', weight:3, cooldown:6, fn(e){ // 全方向弹幕 12+3发(原20+5)
      for(let i=0;i<12;i++){
        const a=i*Math.PI*2/12;
        enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(a)*180,vy:Math.sin(a)*180,life:3.5,alive:true,bulletType:'normal'});
      }
      const dx=player.x-e.x,dy=player.y-e.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
      for(let i=0;i<3;i++){
        const a=(i-1)*.25;
        const cx=dx/dist*Math.cos(a)-dy/dist*Math.sin(a);
        const cy=dx/dist*Math.sin(a)+dy/dist*Math.cos(a);
        enemyBullets.push({x:e.x,y:e.y,vx:cx*300,vy:cy*300,life:2.5,alive:true,bulletType:'homing'});
      }
    }}
  ]
};

// ==================== 动态难度递进 ====================
function getDynamicScale(){
  // 随高度增加难度系数: 基础1x, 每1500米+0.6x, 上限6x
  return Math.min(6, 1 + heightM / 1500);
}

function getDynamicSpawnMin(){
  return Math.max(0.02, diffCfg.spawnMin / getDynamicScale());
}
function getDynamicSpawnMax(){
  return Math.max(0.03, diffCfg.spawnMax / getDynamicScale());
}
function getDynamicBulletSpeed(){
  return diffCfg.bulletSpeedMult * Math.min(5, 1 + heightM * 0.0006); // 每1000米+60%，上限5x
}
function getDynamicEnemyHP(baseHP){
  return Math.floor(baseHP * Math.min(12, 1 + heightM * 0.0008)); // 每1000米+80%，上限12x
}
function getDynamicBossHP(){
  return Math.floor(diffCfg.bossHP * Math.min(8, 1 + heightM * 0.0006)); // 每1000米+60%，上限8x
}
function getDynamicSpawnCount(){
  const base=diffCfg.spawnCount;
  const extra=Math.floor(heightM/800); // 每800米+1怪
  return base + extra;
}

// ==================== 武器类型系统 ====================
let weaponType = 'spread'; // spread | laser | refract | homing
const WEAPON_TYPES = {
  spread: {
    name:'散射炮', icon:'🔷', color:'#0cf', desc:'多发扇形弹幕',
    levels:[
      {count:1,spread:0,speed:900,life:2.5},
      {count:3,spread:0.12,speed:900,life:2.5},
      {count:7,spread:0.12,speed:950,life:2.5}
    ]
  },
  laser: {
    name:'激光炮', icon:'💠', color:'#f44', desc:'射出穿透光柱',
    levels:[
      {width:6,length:140,speed:1600,dmg:10,life:.32},
      {width:10,length:220,speed:2000,dmg:18,life:.34},
      {width:14,length:320,speed:2400,dmg:30,life:.36}
    ]
  },
  refract: {
    name:'折射弹', icon:'💚', color:'#0f0', desc:'边界反弹弹幕',
    levels:[
      {count:1,bounces:1,speed:500,life:3},
      {count:2,bounces:2,speed:550,life:3},
      {count:3,bounces:2,speed:600,life:3}
    ]
  },
  homing: {
    name:'追踪弹', icon:'💛', color:'#ff0', desc:'自动追踪目标',
    levels:[
      {count:1,speed:350,turnRate:6,life:3},
      {count:2,speed:400,turnRate:7,life:3},
      {count:3,speed:450,turnRate:8,life:3.5}
    ]
  }
};

// 皮肤系统
const SKINS = [
  {name:'经典纸鸢', icon:'🪁', unlock:'default', bonus:'', color:'#f44', desc:'基础战机风筝'},
  {name:'凤凰翼', icon:'🔥', unlock:'boss', bonus:'得分+10%', color:'#f80', desc:'击败Boss解锁'},
  {name:'暗物质', icon:'🌑', unlock:'height2000', bonus:'太空得分翻倍', color:'#90f', desc:'飞到2000m解锁'},
  {name:'金色传说', icon:'👑', unlock:'coins1000', bonus:'金币+50%', color:'#FD0', desc:'攒1000金币解锁'},
];

function isSkinUnlocked(i){
  if(SKINS[i].unlock==='default') return true;
  if(SKINS[i].unlock==='boss' && totalKills>=1) return true;
  if(SKINS[i].unlock==='height2000' && recordHeight>=2000) return true;
  if(SKINS[i].unlock==='coins1000' && totalCoins>=1000) return true;
  if(SKINS[i].unlock==='all') return achievements.length>=8;
  return false;
}

// 成就系统（15个）
const ACHIEVEMENTS = [
  // 进度类
  {id:'first_flight',name:'首次飞行',desc:'完成第一局游戏',icon:'✈️',check:(s)=>s.games>=1},
  {id:'ace_pilot',name:'王牌飞行员',desc:'累计击杀100个敌人',icon:'🎯',check:(s)=>s.kills>=100},
  {id:'sky_high',name:'冲破云霄',desc:'飞到500m高度',icon:'🌤️',check:(s)=>s.height>=500},
  {id:'stratosphere',name:'平流层',desc:'飞到1500m高度',icon:'🌍',check:(s)=>s.height>=1500},
  {id:'star_walker',name:'星际漫步',desc:'飞到3000m高度',icon:'🚀',check:(s)=>s.height>=3000},
  {id:'void_explorer',name:'虚空探索者',desc:'飞到6000m高度',icon:'🌌',check:(s)=>s.height>=6000},
  // 战斗类
  {id:'boss_slayer',name:'机甲猎人',desc:'击败5个Boss',icon:'⚔️',check:(s)=>s.bossKills>=5},
  {id:'combo_king',name:'连击之王',desc:'打出20连击',icon:'🔥',check:(s)=>s.maxCombo>=20},
  {id:'combo_god',name:'连击之神',desc:'打出50连击',icon:'💫',check:(s)=>s.maxCombo>=50},
  {id:'fever_lord',name:'Fever之王',desc:'一局激活3次Fever',icon:'🌡️',check:(s)=>s.feverCount>=3},
  // 收集类
  {id:'rich_kite',name:'风筝富翁',desc:'累计获得500金币',icon:'💰',check:(s)=>s.coins>=500},
  {id:'weapon_master',name:'武器大师',desc:'使用进化武器飞500m',icon:'⚡',check:(s)=>s.weapon3Distance>=500},
  {id:'drone_commander',name:'无人机司令',desc:'同时拥有3架无人机',icon:'🤖',check:(s)=>s.maxDrones>=3},
  // 生存类
  {id:'survivor',name:'飞行幸存者',desc:'一局存活3分钟',icon:'⏱️',check:(s)=>s.survivalTime>=180},
  {id:'collector',name:'收藏家',desc:'一局收集30个道具',icon:'🎁',check:(s)=>s.itemsCollected>=30},
];

// 每日任务
function getDailyMissions(){
  const today = new Date().toISOString().split('T')[0];
  const saved = SAVE.get('daily',{});
  if(saved.date!==today){
    const templates = [
      {desc:'击杀50个敌人', need:50, type:'kills'},
      {desc:'飞到800m', need:800, type:'height'},
      {desc:'打出10连击', need:10, type:'combo'},
      {desc:'收集20个金币', need:20, type:'coin'},
      {desc:'击杀1个Boss', need:1, type:'boss'},
      {desc:'使用3次炸弹', need:3, type:'bomb'},
      {desc:'收集5个能量胶囊', need:5, type:'weapon'},
      {desc:'得5000分', need:5000, type:'score'},
    ];
    const chosen = [];
    const idx = new Set();
    while(chosen.length<3){
      const i = Math.floor(Math.random()*templates.length);
      if(!idx.has(i)){idx.add(i);chosen.push({...templates[i], progress:0, done:false});}
    }
    return {date:today, missions:chosen};
  }
  return saved;
}

// ==================== 粒子系统 ====================
class Particle {
  constructor(x,y,vx,vy,life,color,size=2){
    this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.life=life;this.maxLife=life;
    this.color=color;this.size=size;this.rot=Math.random()*Math.PI*2;
  }
  update(dt){
    this.x+=this.vx*dt;this.y+=this.vy*dt;
    this.life-=dt;this.vx*=.98;this.vy*=.98;
  }
  get alpha(){return Math.max(0,this.life/this.maxLife);}
  get alive(){return this.life>0;}
}

function spawnParticles(x,y,count,color,spread=100,life=0.6,size=2){
  // 粒子数量保护：超过自适应上限时减量
  if(particles.length>_adaptMaxP) return;
  if(particles.length>_adaptMaxP*.7) count=Math.ceil(count/2);
  for(let i=0;i<count;i++){
    const ang=Math.random()*Math.PI*2;
    const spd=Math.random()*spread*2+spread;
    if(particles.length<_adaptMaxP) particles.push(new Particle(x,y,Math.cos(ang)*spd,Math.sin(ang)*spd,life+Math.random()*.3,color,size+Math.random()*2));
  }
}

// ==================== 得分飘字 ====================
let scorePopups=[];
let bossKillAnnounce={active:false,timer:0,text:''};
let bossIntroAnnounce={active:false,timer:0,text:'',bossName:''};

// ==================== 剧情系统 ====================
const STORY_DATA={
  start:[
    {speaker:'任务指挥中心',text:'风筝飞行员，欢迎回来！',delay:0},
    {speaker:'任务指挥中心',text:'今天是2950年，星际垃圾回收部门需要你',delay:2.5},
    {speaker:'任务指挥中心',text:'驾驶风筝飞行器，穿越这片失控的空间站残骸',delay:5},
    {speaker:'风筝飞行员',text:'为什么又是我？我在摸鱼啊……',delay:8},
    {speaker:'任务指挥中心',text:'因为只有你会用风筝在太空飞。出发！',delay:11}
  ],
  height100:{speaker:'任务指挥中心',text:'已进入轨道100米，注意躲避太空垃圾！'},
  height500:{speaker:'任务指挥中心',text:'500米了！检测到敌方侦察单位，保持警惕！'},
  height1000:{speaker:'风筝飞行员',text:'这些敌人好眼熟……好像我996那年的项目经理？'},
  height1500:{speaker:'任务指挥中心',text:'进入平流层，大气干扰增强，弹幕密度上升'},
  height2000:{speaker:'任务指挥中心',text:'2000米！解锁暗物质模式，敌人开始认真了'},
  height3000:{speaker:'风筝飞行员',text:'我怀疑这片空间是甲方用需求文档堆出来的……'},
  height4000:{speaker:'任务指挥中心',text:'4000米！Boss即将出现，检查你的武器系统！'},
  height5000:{speaker:'任务指挥中心',text:'5000米……这里不该有人来的。Boss进入了狂暴模式。'},
  bossPre:[
    {speaker:'任务指挥中心',text:'警告！Boss单位接近！',delay:0},
    {speaker:'Boss',text:'又一个不知死活的风筝飞行员……',delay:2.5},
    {speaker:'Boss',text:'这片星空，将由我来回收！',delay:5}
  ],
  // 各区域专属Boss出场台词（按zone.theme索引）
  bossPreByTheme:{
    corporate:[
      {delay:0, lines:[
        {speaker:'任务指挥中心',text:'注意！职场暴君接近！拒绝无限改稿！'},
        {speaker:'需求黑洞',text:'你的需求文档在哪里！？',delay:2.5},
        {speaker:'需求黑洞',text:'方案推翻重做——所有人！加班！',delay:5}
      ]},
      {delay:0, lines:[
        {speaker:'KPI执刑人',text:'飞行员绩效：D级，立刻淘汰！',delay:0},
        {speaker:'风筝飞行员',text:'老子是外包，不打绩效！',delay:2.5},
        {speaker:'KPI执刑人',text:'外包也不行！出发，年终奖清零！',delay:5}
      ]},
      {delay:0, lines:[
        {speaker:'无限改稿者',text:'这个字体不对！背景色不对！全部重来！',delay:0},
        {speaker:'风筝飞行员',text:'……这他妈是飞行游戏啊！',delay:2.5},
        {speaker:'无限改稿者',text:'飞机也要改！再小一点！再大一点！',delay:5}
      ]}
    ],
    military:[
      {delay:0, lines:[
        {speaker:'任务指挥中心',text:'军团统帅出现！密集弹幕即将覆盖！',delay:0},
        {speaker:'军团统帅',text:'听令！拦截目标，火力全开！',delay:2.5},
        {speaker:'军团统帅',text:'你一个风筝……能飞多远？',delay:5}
      ]},
      {delay:0, lines:[
        {speaker:'碎星者',text:'收到你的坐标了，飞行员。',delay:0},
        {speaker:'风筝飞行员',text:'你怎么……！',delay:2.5},
        {speaker:'碎星者',text:'轨道炮，充能完毕。',delay:5}
      ]}
    ],
    alien:[
      {delay:0, lines:[
        {speaker:'异星霸主',text:'ΩΩΩ……碳基生命探测到……',delay:0},
        {speaker:'异星霸主',text:'样本价值：零。消除处理。',delay:2.5},
        {speaker:'风筝飞行员',text:'我样本价值零？！你才零！',delay:5}
      ]},
      {delay:0, lines:[
        {speaker:'维度漫步者',text:'这个维度……不欢迎你。',delay:0},
        {speaker:'维度漫步者',text:'空间撕裂，开始。',delay:2.5},
        {speaker:'任务指挥中心',text:'！！！空间异常！全速脱离！',delay:5}
      ]}
    ],
    cosmic:[
      {delay:0, lines:[
        {speaker:'任务指挥中心',text:'深空警报！星海主宰降临！',delay:0},
        {speaker:'星海主宰',text:'渺小的星尘……你们也称之为"生命"？',delay:2.5},
        {speaker:'星海主宰',text:'银河系，今天终结。',delay:5}
      ]},
      {delay:0, lines:[
        {speaker:'黑洞之王',text:'引力场，激活。',delay:0},
        {speaker:'风筝飞行员',text:'什么？！飞不动了！',delay:2.5},
        {speaker:'黑洞之王',text:'有趣……拉进来，慢慢压缩。',delay:5}
      ]}
    ],
    void:[
      {delay:0, lines:[
        {speaker:'虚空之神',text:'…………',delay:0},
        {speaker:'任务指挥中心',text:'没有信号……什么都没有……',delay:2.5},
        {speaker:'虚空之神',text:'你不应该来到这里。现在，消失。',delay:5}
      ]},
      {delay:0, lines:[
        {speaker:'终结者·零',text:'我是第一个到达这里的意识。',delay:0},
        {speaker:'终结者·零',text:'你是最后一个。',delay:2.5},
        {speaker:'风筝飞行员',text:'……那就让你见识见识，倒数第一有多强！',delay:5}
      ]}
    ]
  },
  // 各区域Boss击败台词
  bossKillByTheme:{
    corporate:[
      [{speaker:'任务指挥中心',text:'需求黑洞摧毁！本季度需求已冻结！',delay:0},{speaker:'风筝飞行员',text:'下班！老子要下班！',delay:2.5}],
      [{speaker:'风筝飞行员',text:'KPI执刑官……你的KPI是多少？',delay:0},{speaker:'任务指挥中心',text:'零。他已被你清零了。',delay:2.5}]
    ],
    military:[
      [{speaker:'任务指挥中心',text:'军团统帅陨落！星际防线已突破！',delay:0},{speaker:'风筝飞行员',text:'没想到风筝能干掉军舰……',delay:2.5}],
    ],
    alien:[
      [{speaker:'任务指挥中心',text:'外星Boss已消灭！收集异星碎片！',delay:0},{speaker:'风筝飞行员',text:'它们……没有血，流的是光子？',delay:2.5}],
    ],
    cosmic:[
      [{speaker:'任务指挥中心',text:'星海主宰击毁！宇宙平静了片刻……',delay:0},{speaker:'风筝飞行员',text:'……银河系还在吗？',delay:2.5},{speaker:'任务指挥中心',text:'在。你救了银河系。',delay:5}],
    ],
    void:[
      [{speaker:'虚空之神',text:'……不……可能……',delay:0},{speaker:'风筝飞行员',text:'可能的。风筝什么都能做到。',delay:2.5}],
    ]
  },
  bossKill:[
    {speaker:'任务指挥中心',text:'Boss已被击毁！干得漂亮！',delay:0},
    {speaker:'风筝飞行员',text:'终于……它掉的东西能卖钱吗？',delay:2.5},
    {speaker:'任务指挥中心',text:'能！你刚才打出了价值2000金币的碎片！',delay:5}
  ],
  gameOver:[
    {speaker:'任务指挥中心',text:'风筝信号丢失……',delay:0},
    {speaker:'任务指挥中心',text:'……又一位勇敢的飞行员陨落了',delay:2},
    {speaker:'风筝飞行员',text:'下次……我要转行做PM……',delay:4.5}
  ],
  gameOverGood:[
    {speaker:'任务指挥中心',text:'任务完成！风筝安全返航！',delay:0},
    {speaker:'任务指挥中心',text:'你的表现将记入星际风筝传说史册！',delay:2.5},
    {speaker:'风筝飞行员',text:'那我能报销摸鱼时间吗？',delay:5}
  ]
};
let storyQueue=[];       // 当前待播放的剧情队列
let storyTimer=0;        // 剧情计时器
let storyActive=false;   // 是否有剧情正在播放
let storyTyping=false;   // 是否正在打字
let storyCharIndex=0;    // 当前打字位置
let storyFullText='';    // 完整文本
let storyTriggered=new Set(); // 已触发的剧情

// v6.8: story系统完全重写 — 帧驱动，不用setTimeout，不阻塞游戏
// 旧版用纯setTimeout堆叠，暂停期间仍触发，是卡死的根本原因之一
let _storyPending=[];   // 待播放队列 [{speaker,text,duration,waitFrames}]
let _storyCurrent=null; // 当前正在播放的story条目
let _storyFrameTimer=0; // 帧计时器（替代setTimeout）

function showStory(speaker,text,duration=3){
  // v6.8: 不再直接显示，改为加入帧队列
  _storyPending.push({speaker,text,duration,waitFrames:0});
}

function queueStory(storyArray,callback){
  // v6.8: 按delay换算成帧数入队（不用setTimeout）
  let cumFrames=0;
  storyArray.forEach((item,i)=>{
    cumFrames+=Math.round((item.delay||0)*60);
    _storyPending.push({
      speaker:item.speaker,
      text:item.text,
      duration:3,
      waitFrames:cumFrames,
      isLast:(i===storyArray.length-1),
      callback:callback
    });
  });
}

// 每帧调用：推进story播放（在update()末尾调用）
function updateStorySystem(){
  if(!gameRunning) return; // 游戏暂停时story系统暂停
  const box=document.getElementById('story-box');
  if(!box) return;
  const spEl=box.querySelector('.story-speaker');
  const txEl=box.querySelector('.story-text');

  // 有当前正在播放的story → 倒计时
  if(_storyCurrent){
    // v6.10: 防御NaN — dt变成NaN时_timer也会变成NaN，永远关不掉
    if(!isFinite(dt)) dt=0.016;
    _storyCurrent._timer-=dt;
    if(_storyCurrent._timer<=0 || !isFinite(_storyCurrent._timer)){
      box.classList.remove('show');
      storyActive=false;
      if(_storyCurrent.isLast&&_storyCurrent.callback) try{_storyCurrent.callback();}catch(e){}
      _storyCurrent=null;
    }
    return;
  }

  // 没有正在播放的 → 检查队列
  if(_storyPending.length===0){ storyActive=false; return; }

  // 处理等待帧
  _storyFrameTimer++;
  const next=_storyPending[0];
  if(_storyFrameTimer<next.waitFrames) return; // 还没到时间

  // 播放下一条
  _storyPending.shift();
  _storyFrameTimer=0;
  _storyCurrent={...(next),_timer:next.duration};
  storyActive=true;

  // 渲染到DOM（直接全文显示，不用打字机setTimeout）
  // v6.10: 防御null DOM元素
  if(!spEl || !txEl){
    console.warn('[StorySystem] DOM元素缺失，跳过渲染');
    return;
  }
  spEl.textContent=next.speaker;
  if(next.speaker==='任务指挥中心') spEl.style.color='#0cf';
  else if(next.speaker==='Boss') spEl.style.color='#f44';
  else spEl.style.color='#ff0';
  txEl.textContent=next.text;
  box.classList.add('show');
}

function checkStoryTrigger(heightM){
  if(!gameRunning) return; // v6.8: 游戏暂停时不触发剧情
  const milestones=[100,500,1000,1500,2000,3000,4000,5000];
  for(const m of milestones){
    if(heightM>=m&&!storyTriggered.has('height'+m)){
      storyTriggered.add('height'+m);
      const key='height'+m;
      if(STORY_DATA[key]){
        showStory(STORY_DATA[key].speaker,STORY_DATA[key].text,3.5);
        return;
      }
    }
  }
}
function addScorePopup(x,y,text,color='#fff',size=16){
  // v6.4: 预计算rgba字符串，避免每帧parseColor
  scorePopups.push({x,y,text,color,size,life:0.8,opacity:1,vy:-60,_rgba:'rgba('+parseColor(color)+',)'});
}

// ==================== 音效系统 (Web Audio API) ====================
let audioCtx=null, bgmGain=null, bgmActive=false, sfxMuted=false;
function initAudio(){
  if(audioCtx) { if(audioCtx.state==='suspended') audioCtx.resume(); return; }
  try{
    audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
  }catch(e){return;}
  bgmGain=audioCtx.createGain();bgmGain.gain.value=0;bgmGain.connect(audioCtx.destination);
}
// 全局点击/触摸激活音频（浏览器自动播放策略）
document.addEventListener('click',()=>{ initAudio(); if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume(); },{once:false});
document.addEventListener('touchstart',()=>{ initAudio(); if(audioCtx&&audioCtx.state==='suspended') audioCtx.resume(); },{once:false});
function playTone(freq,dur,type='square',vol=.12,detune=0){
  if(!audioCtx||sfxMuted) return;
  const t=audioCtx.currentTime;
  const osc=audioCtx.createOscillator();const g=audioCtx.createGain();
  osc.type=type;osc.frequency.setValueAtTime(freq,t);if(detune)osc.detune.setValueAtTime(detune,t);
  g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  osc.connect(g);g.connect(audioCtx.destination);
  osc.start(t);osc.stop(t+dur);
}
function playNoise(dur,vol=.08,lpFreq=800){
  if(!audioCtx||sfxMuted) return;
  const t=audioCtx.currentTime,bufferSize=audioCtx.sampleRate*dur;
  const buf=audioCtx.createBuffer(1,bufferSize,audioCtx.sampleRate);
  const data=buf.getChannelData(0);for(let i=0;i<bufferSize;i++) data[i]=Math.random()*2-1;
  const src=audioCtx.createBufferSource();src.buffer=buf;
  const lp=audioCtx.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(lpFreq,t);lp.frequency.exponentialRampToValueAtTime(200,t+dur);
  const g=audioCtx.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  src.connect(lp);lp.connect(g);g.connect(audioCtx.destination);
  src.start(t);src.stop(t+dur);
}
const SFX={
  shoot(){playTone(900,.05,'square',.10);playTone(1400,.04,'square',.08,60);},
  hit(freq=300){playTone(freq,.08,'sawtooth',.12);playNoise(.05,.05,1800);},
  explode(){playNoise(.3,.18,500);playTone(100,.25,'sine',.20);},
  pickup(){playTone(700,.08,'square',.10);setTimeout(()=>playTone(1000,.10,'square',.12),50);},
  bomb(){playNoise(.6,.20,250);playTone(60,.5,'sine',.25);},
  bossWarning(){playTone(150,.4,'sawtooth',.15);setTimeout(()=>playTone(200,.4,'sawtooth',.15),250);setTimeout(()=>playTone(150,.5,'sawtooth',.12),500);},
  die(){playNoise(.5,.15,350);playTone(80,.4,'sine',.18);playTone(50,.6,'sawtooth',.10);},
  achievement(){playTone(600,.12,'square',.10);setTimeout(()=>playTone(750,.12,'square',.10),120);setTimeout(()=>playTone(900,.18,'square',.12),240);},
  fever(){playTone(500,.10,'square',.08);setTimeout(()=>playTone(630,.10,'square',.08),70);setTimeout(()=>playTone(750,.10,'square',.08),140);setTimeout(()=>playTone(1000,.15,'square',.10),210);},
  combo(c){
    // 递进式连击音效：每5连击升一个音阶，有递进感
    const base = 300 + Math.min(c, 60) * 15;
    const vol = Math.min(0.12, 0.04 + c * 0.003);
    if(c>=50){
      // 50+: 三和弦爆发
      playTone(base,.12,'square',vol);
      setTimeout(()=>playTone(base*1.25,.1,'square',vol*.8),40);
      setTimeout(()=>playTone(base*1.5,.14,'square',vol),80);
      setTimeout(()=>playTone(base*2,.1,'sine',vol*.6),140);
    } else if(c>=25){
      // 25+: 双音上升
      playTone(base,.1,'square',vol);
      setTimeout(()=>playTone(base*1.33,.12,'square',vol),50);
    } else if(c>=10){
      // 10+: 上升扫频
      const o=audioCtx?audioCtx.createOscillator():null;
      if(o&&audioCtx&&!sfxMuted){
        const t=audioCtx.currentTime;
        const g=audioCtx.createGain();
        o.type='square';o.frequency.setValueAtTime(base*.8,t);
        o.frequency.linearRampToValueAtTime(base*1.2,t+.1);
        g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);
        o.connect(g);g.connect(audioCtx.destination);o.start(t);o.stop(t+.15);
      }
    } else if(c>=5){
      // 5+: 简单双音
      playTone(base,.08,'square',vol*.9);
      setTimeout(()=>playTone(base*1.2,.06,'square',vol*.7),60);
    } else {
      // 1-4: 清脆单音
      playTone(base,.06,'square',vol*.7);
    }
    // 里程碑连击额外特效音
    if(c===10) setTimeout(()=>SFX.milestone(10),150);
    else if(c===25) setTimeout(()=>SFX.milestone(25),150);
    else if(c===50) setTimeout(()=>SFX.milestone(50),200);
  },
  milestone(c){
    // 连击里程碑提示音：C大调上行琶音
    const notes=c>=50?[523,659,784,1047]:(c>=25?[440,554,659,880]:[349,440,523,698]);
    notes.forEach((f,i)=>setTimeout(()=>playTone(f,.15,'square',.08),i*70));
  },
};

// BGM - 简单循环低音 + 琶音（动态速度）
let bgmNoteIdx=0, bgmTimeout=null;
const BGM_NOTES=[65.41,73.42,82.41,98.00,110.00,98.00,82.41,73.42];
function bgmTick(){
  if(!bgmActive||!audioCtx) return;
  if(gameRunning||deathSlowMo>0){
    const t=audioCtx.currentTime;
    const osc=audioCtx.createOscillator();
    osc.type='triangle';osc.frequency.setValueAtTime(BGM_NOTES[bgmNoteIdx%8],t);
    const g=audioCtx.createGain();g.gain.setValueAtTime(.015,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);
    osc.connect(g);g.connect(audioCtx.destination);
    osc.start(t);osc.stop(t+.35);
    if(bgmNoteIdx%2===0){playNoise(.08,.02,2000);}
    bgmNoteIdx++;
  }
  const tempo=Math.max(150,400-heightM*.5);
  bgmTimeout=setTimeout(bgmTick,tempo);
}
function startBGM(){
  if(!audioCtx||bgmActive) return;
  bgmActive=true;bgmNoteIdx=0;
  bgmGain.gain.linearRampToValueAtTime(.04,audioCtx.currentTime+1);
  bgmTimeout=setTimeout(bgmTick,400);
}
function stopBGM(){
  bgmActive=false;
  if(bgmTimeout){clearTimeout(bgmTimeout);bgmTimeout=null;}
  if(bgmGain) bgmGain.gain.linearRampToValueAtTime(0,audioCtx.currentTime+.5);
}

function toggleSfx(){
  sfxMuted=!sfxMuted;
  const btn=document.getElementById('btn-sfx');
  btn.textContent=sfxMuted?'🔇':'🔊';
  btn.classList.toggle('muted',sfxMuted);
  if(sfxMuted){stopBGM();}else if(gameRunning){startBGM();}
}

// ==================== 游戏状态 ====================
let player,enemies,playerBullets,enemyBullets,items,particles;
let score=0, heightM=0, combo=0, maxCombo=0, kills=0;
let screenShakeTrauma=0, hitStop=0, damageVignette=0;
// v6.7: 全局看门狗 — 双重检测（gameRunning=false + 画面静止），1秒超时自动恢复
let _watchdogTimer=0; // 异常状态帧计数
let _lastWatchdogFingerprint=0; // 上一帧"指纹"
let _watchdogRecoveryCount=0; // v6.7: 恢复次数统计（用于日志）
const WATCHDOG_MAX=60; // ~1秒@60fps（v6.7: 从180大幅缩短，快速恢复优先）
// v6.5.3: Boss出场剧情延迟队列（替代setTimeout）
let _bossStoryQueue=null;
// v6.5.2: 帧级延迟队列（替代setTimeout，避免iframe中不可靠）
let _delayedBullets=[], _delayedWaves=[];
let feverGauge=0, feverActive=false, feverTimer=0, feverCount=0;
let bombCount=3, weaponLevel=1;
let bossFight=null, waveTimer=0, nextBossAt=500;
let gameSpeed=1, gameTime=0;
let itemsCollected=0, bossKills=0;
let weapon3Start=0, weapon3Distance=0;
let dailyMissions = getDailyMissions();
let lastZone='corporate';

// ==================== 擦弹系统 ====================
let grazeCount=0, starStormGauge=0, starStormActive=false, starStormTimer=0;
let isFocus=false, focusSlowMo=0;
let drones=[]; // 风筝伴侣无人机
let maxDronesThisGame=0; // 本局最多同时拥有无人机数
let passiveItems=[]; // 被动道具列表
let weaponEvolved=false; // 武器是否已进化

function resize(){
  W=canvas.width=window.innerWidth*(window.devicePixelRatio||1);
  H=canvas.height=window.innerHeight*(window.devicePixelRatio||1);
}
window.addEventListener('resize',resize); resize();

// ==================== 玩家 ====================
function createPlayer(){
  return {
    x:W/2,y:H*0.72,w:36,h:44,
    vx:0,vy:0,targetX:W/2,targetY:H*0.72,
    shootTimer:0,shootRate:0.18,
    invincible:0,shieldTimer:0,score2xTimer:0,magnetTimer:0,magnetRange:150,
    alive:true,bombAnim:0,
    squashX:1,squashY:1,flashTimer:0,
    hp:diffCfg.hp,maxHp:diffCfg.hp,damageFlash:0,
    focusMoveMult:1,confused:0
  };
}

function drawPlayer(p){
  ctx.save();
  ctx.translate(p.x,p.y);
  // 挤压拉伸
  const sx=p.squashX+(1-p.squashX)*0.15;
  const sy=p.squashY+(1-p.squashY)*0.15;
  ctx.scale(sx,sy);
  // 无敌闪烁/受击闪白
  if(p.invincible>0&&Math.floor(p.invincible*20)%2===0) ctx.globalAlpha=0.4;
  if(p.damageFlash>0){
    ctx.globalAlpha=1;
    ctx.fillStyle='rgba(255,0,0,0.3)';
    ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.fill();
    // 受击红框
    ctx.strokeStyle='rgba(255,0,0,0.6)';
    ctx.lineWidth=2;ctx.strokeRect(-20,-24,40,48);
  }

  // 护盾光环
  if(p.shieldTimer>0){
    ctx.beginPath();ctx.arc(0,0,30,0,Math.PI*2);
    ctx.strokeStyle=`rgba(0,255,255,${.5+Math.sin(frameCount*.2)*.3})`;
    ctx.lineWidth=2;ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,35,0,Math.PI*2);
    ctx.strokeStyle=`rgba(0,180,255,${.3+Math.sin(frameCount*.3)*.2})`;
    ctx.lineWidth=1;ctx.stroke();
  }
  // 磁铁光环
  if(p.magnetTimer>0){
    ctx.beginPath();ctx.arc(0,0,p.magnetRange,0,Math.PI*2);
    ctx.strokeStyle=`rgba(255,200,0,${.15+Math.sin(frameCount*.15)*.1})`;
    ctx.lineWidth=1;ctx.setLineDash([8,12]);ctx.stroke();ctx.setLineDash([]);
  }
  // 混乱状态：紫色问号旋转
  if(p.confused>0){
    ctx.fillStyle='rgba(170,68,255,0.6)';ctx.font='16px sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('❓',Math.sin(frameCount*5)*8,-30+Math.cos(frameCount*3)*4);
    ctx.fillText('❓',Math.cos(frameCount*5)*8,-30+Math.sin(frameCount*3)*4);
    ctx.strokeStyle='rgba(170,68,255,0.3)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.setLineDash([4,4]);
    ctx.lineDashOffset=frameCount*3;ctx.stroke();ctx.setLineDash([]);
  }

  const skin=SKINS[currentSkin];
  
  // 皮肤颜色
  let bodyColor1=skin.color==='#f80'?'#3a1a05':(skin.color==='#90f'?'#1a053a':(skin.color==='#FD0'?'#3a3005':'#1a1a3e'));
  let bodyColor2=skin.color==='#f80'?'#1a0d05':(skin.color==='#90f'?'#0d0530':(skin.color==='#FD0'?'#2a2005':'#0d1a3d'));
  
  // 主体：流线型战机风筝
  ctx.beginPath();
  ctx.moveTo(0,-24);ctx.lineTo(16,-4);ctx.lineTo(22,8);ctx.lineTo(14,18);
  ctx.lineTo(0,24);ctx.lineTo(-14,18);ctx.lineTo(-22,8);ctx.lineTo(-16,-4);
  ctx.closePath();
  const grad=ctx.createLinearGradient(0,-24,0,24);
  grad.addColorStop(0,bodyColor1);grad.addColorStop(.3,bodyColor2);
  grad.addColorStop(.7,'#152040');grad.addColorStop(1,'#1a2040');
  ctx.fillStyle=grad;ctx.fill();
  ctx.strokeStyle=skin.color;ctx.lineWidth=2;
  ctx.shadowColor=skin.color;ctx.shadowBlur=12;ctx.stroke();ctx.shadowBlur=0;

  // 电路纹理
  ctx.strokeStyle='rgba(0,200,255,0.3)';ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(0,-18);ctx.lineTo(0,18);ctx.stroke();
  ctx.strokeStyle='rgba(0,200,255,0.2)';
  ctx.beginPath();ctx.moveTo(-10,-6);ctx.lineTo(10,-6);
  ctx.moveTo(-12,6);ctx.lineTo(12,6);ctx.stroke();

  // 中央能量核心
  const core=ctx.createRadialGradient(0,0,0,0,0,10);
  core.addColorStop(0,'rgba(0,255,255,0.8)');core.addColorStop(.4,'rgba(0,180,255,0.4)');
  core.addColorStop(1,'rgba(0,100,255,0)');
  ctx.fillStyle=core;ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();

  // 机翼能量纹
  ctx.strokeStyle='rgba(0,255,200,0.5)';ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(10,0);ctx.lineTo(18,6);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-10,0);ctx.lineTo(-18,6);ctx.stroke();

  // 离子推进尾焰
  const trailLen=30+Math.sin(frameCount*.3)*8;
  const trailGrad=ctx.createLinearGradient(0,20,0,20+trailLen);
  trailGrad.addColorStop(0,'rgba(0,220,255,0.9)');trailGrad.addColorStop(.3,'rgba(0,150,255,0.5)');
  trailGrad.addColorStop(.7,'rgba(0,80,255,0.15)');trailGrad.addColorStop(1,'rgba(0,30,255,0)');
  ctx.fillStyle=trailGrad;
  ctx.beginPath();ctx.moveTo(-6,20);ctx.lineTo(6,20);ctx.lineTo(14,20+trailLen);ctx.lineTo(-14,20+trailLen);ctx.closePath();ctx.fill();
  ctx.fillStyle='rgba(0,150,255,0.3)';
  ctx.beginPath();ctx.moveTo(-6,20);ctx.lineTo(0,20);ctx.lineTo(-8,20+trailLen*.8);ctx.lineTo(-16,20+trailLen*.7);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(0,20);ctx.lineTo(6,20);ctx.lineTo(16,20+trailLen*.7);ctx.lineTo(8,20+trailLen*.8);ctx.closePath();ctx.fill();

  // 武器等级发光点
  const wingGlow=l=>{ctx.fillStyle='rgba(0,255,255,0.7)';ctx.shadowColor='#0ff';ctx.shadowBlur=6;ctx.beginPath();ctx.arc(l,0,2.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;};
  if(weaponLevel>=1){wingGlow(0)}
  if(weaponLevel>=2){wingGlow(16);wingGlow(-16)}
  if(weaponLevel>=3){wingGlow(8);wingGlow(-8)}

  // 集中模式：显示命中点（3px小点）
  if(isFocus){
    ctx.fillStyle='#0ff';ctx.shadowColor='#0ff';ctx.shadowBlur=12;
    ctx.beginPath();ctx.arc(0,0,3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    // 命中点外圈脉冲
    const pRadius=4+Math.sin(frameCount*.3)*1.5;
    ctx.strokeStyle='rgba(0,255,255,0.4)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(0,0,pRadius,0,Math.PI*2);ctx.stroke();
  }

  ctx.restore();
}

// ==================== 射击（多武器系统） ====================
function shoot(p){
  const cfg=WEAPON_TYPES[weaponType]; if(!cfg) return;
  const lvl=cfg.levels[Math.min(weaponLevel-1, cfg.levels.length-1)];
  const ty=p.y-24;
  if(weaponType==='spread'){
    const halfSpread=lvl.spread*(lvl.count-1)/2;
    for(let i=0;i<lvl.count;i++){
      const a=-Math.PI/2-halfSpread+(i/(lvl.count-1||1))*halfSpread*2;
      playerBullets.push({x:p.x,y:ty,vx:Math.cos(a)*lvl.speed,vy:Math.sin(a)*lvl.speed,type:'spread',life:lvl.life,alive:true});
    }
  } else if(weaponType==='laser'){
    // 激光弹 — 射出穿透光柱，向上飞行
    playerBullets.push({x:p.x,y:ty,vx:0,vy:-lvl.speed,w:lvl.width,l:lvl.length,dmg:lvl.dmg,type:'laser',life:lvl.life,alive:true});
  } else if(weaponType==='refract'){
    for(let i=0;i<lvl.count;i++){
      const a=-Math.PI/2+(i-(lvl.count-1)/2)*.12;
      playerBullets.push({x:p.x+i*4-(lvl.count-1)*2,y:ty,vx:Math.cos(a)*lvl.speed,vy:Math.sin(a)*lvl.speed,type:'refract',bounces:lvl.bounces,life:lvl.life,alive:true});
    }
  } else if(weaponType==='homing'){
    // 先找最近的敌人确定初始方向
    let targetA=-Math.PI/2;
    let minD=9999;
    for(let i=0;i<enemies.length;i++){const e=enemies[i];const d=Math.hypot(e.x-p.x,e.y-ty);if(d<minD){minD=d;targetA=Math.atan2(e.y-ty,e.x-p.x);}}
    for(let i=0;i<lvl.count;i++){
      const a=targetA+(i-(lvl.count-1)/2)*.25;
      playerBullets.push({x:p.x+i*6-(lvl.count-1)*3,y:ty,vx:Math.cos(a)*lvl.speed,vy:Math.sin(a)*lvl.speed,type:'homing',speed:lvl.speed,turnRate:lvl.turnRate,life:lvl.life,alive:true});
    }
  }
  SFX.shoot();
}
function drawPlayerBullet(b){
  if(b.y<-60||b.y>H+60||b.x<-60||b.x>W+60) return;
  /*v6.0: 绝对坐标渲染，去掉save/restore/translate*/
  const bx=b.x,by=b.y;
  if(b.type==='laser'){
    const w=b.w,l=b.l;
    const g=ctx.createLinearGradient(bx,by,bx,by-l);
    g.addColorStop(0,'#fff');g.addColorStop(.15,'#f44');g.addColorStop(.5,'#f22');g.addColorStop(1,'rgba(255,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(bx-w/2,by-l,w,l);
    ctx.fillStyle='rgba(255,80,80,0.6)';ctx.fillRect(bx-1,by-l,2,l);
    ctx.strokeStyle='rgba(255,255,255,0.5)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx,by-l);ctx.stroke();
  } else if(b.type==='refract'){
    ctx.fillStyle='#0f0';ctx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6,r=6;if(i===0)ctx.moveTo(bx+Math.cos(a)*r,by+Math.sin(a)*r);else ctx.lineTo(bx+Math.cos(a)*r,by+Math.sin(a)*r);}
    ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by,2.5,0,Math.PI*2);ctx.fill();
  } else if(b.type==='homing'){
    ctx.fillStyle='#ff0';ctx.beginPath();ctx.moveTo(bx,by-8);ctx.lineTo(bx+4,by);ctx.lineTo(bx+2,by+8);ctx.lineTo(bx-2,by+8);ctx.lineTo(bx-4,by);ctx.closePath();ctx.fill();
    ctx.fillStyle='#f80';ctx.beginPath();ctx.arc(bx,by,3,0,Math.PI*2);ctx.fill();
  } else {
    ctx.fillStyle='#0cf';
    ctx.beginPath();ctx.moveTo(bx,by-10);ctx.lineTo(bx+3,by-2);ctx.lineTo(bx+3,by+6);ctx.lineTo(bx,by+8);ctx.lineTo(bx-3,by+6);ctx.lineTo(bx-3,by-2);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.6)';ctx.fillRect(bx-1,by-8,2,14);
  }
}

// ==================== 敌机 ====================
const BOSS_TITLES=['虚空霸主','深渊监视者','星辰毁灭者','维度漫游者','永恒审判者','混沌领主','末日执行者','星际暴君','暗物质之王','超弦撕裂者'];
const ENEMY_NAMES={
  small:[
    '摸鱼探测器','996巡逻员','外卖配送员','甲方的眼线','幽灵探针',
    'Bug生成器','截屏小助手','弹幕快递员','太空社畜','薅羊毛无人机',
    '摸鱼协会会长','周报自动生成器','电梯广告播报员'
  ],
  medium:[
    'KPI考核员','需求变更通知','猎杀者MK-II','碎星炮手','Deadline追击者',
    '年终奖回收员','会议室预定机器人','PPT自动播放器','代码Review员',
    '考勤打卡机','需求文档.exe','BUG修复拒绝者'
  ],
  large:[
    '年终总结PPT','需求文档3.0','重装堡垒','钢铁巨鲸','泰坦级残骸',
    '甲方终极形态','996永恒装置','需求黑洞','无限改稿机器',
    '项目延期生成器','预算削减通知','裁员名单打印机'
  ],
  boss:[
    '湮灭核心·EX','虚空之眼','996终极Boss','甲方之王','需求之神',
    'Deadline Lord','年终奖清零者','无限需求体','PUA大师·改',
    '996永恒帝','需求变更之主','KPI终结者'
  ]
};
function createEnemy(type='small'){
  const x=Math.random()*(W-60)+30;
  const y=-80;
  const zone=getZone(heightM);
  const dScale=getDynamicScale();
  const types={
    small:{w:22,h:24,hp:1,score:100,speed:150,shootT:3},
    medium:{w:36,h:38,hp:3,score:300,speed:110,shootT:1.8},
    large:{w:52,h:56,hp:8,score:500,speed:70,shootT:1.2},
    boss:{w:80,h:90,hp:50,score:2000,speed:40,shootT:0.6}
  };
  const t=types[type];
  // 名称为通用池+区域池混合
  const genPool=ENEMY_NAMES[type]||[];
  const zonePool=type==='boss'?zone.bossNamePool:(genPool);
  const namePool=zonePool.length>0?zonePool:genPool;
  const randName=namePool[Math.floor(Math.random()*namePool.length)];
  // 动态血量缩放
  let dynHP=t.hp;
  if(type==='boss'){
    dynHP=getDynamicBossHP();
  } else {
    dynHP=getDynamicEnemyHP(t.hp);
  }
  // 区域配色
  const ci=Math.floor(Math.random()*zone.enemyBody.length);
  const obj={
    x,y,w:t.w,h:t.h,type,hp:dynHP,maxHp:dynHP,
    score:t.score,color:zone.enemyStroke[ci]||'#f44',speed:t.speed,zone:zone.theme,
    bodyColor:zone.enemyBody[ci]||'#3a0a0a',
    strokeColor:zone.enemyStroke[ci]||'#f44',
    coreColor:zone.enemyCore[ci]||'#f66',
    name:randName,
    vx:(Math.random()-.5)*60,vy:t.speed,
    shootTimer:t.shootT,shootCooldown:t.shootT+Math.random(),
    pattern:0,flashTimer:0,telegraphTimer:0,telegraphAngle:0
  };
  if(type==='boss'){
    const titlePool=zone.bossTitlePool.length>0?zone.bossTitlePool:BOSS_TITLES;
    obj.title=titlePool[Math.floor(Math.random()*titlePool.length)];
    obj.bossType=zone.theme; // 标记Boss类型用于弹幕选择
    // Boss阶段化系统
    obj.phase=0; // 0=100%-75%, 1=75%-50%, 2=50%-25%, 3=25%-0%
    obj.phaseThresholds=[0.75,0.50,0.25]; // 阶段转换阈值
    obj.phaseChanged=false; // 标记本帧是否已触发阶段转换
    // Boss技能系统
    obj.skillCooldown=4+Math.random()*3; // 初始冷却4-7秒
    obj.skillTimer=obj.skillCooldown;
    obj.skillPattern=0;
    obj.invulnerable=0; // 无敌计时器
  }
  return obj;
}

function drawHeartPath(x,y,s){
  const cx=x+s/2,cy=y+s/4;
  ctx.beginPath();
  ctx.moveTo(cx,y+s*.9);
  ctx.bezierCurveTo(x-s*.3,y+s*.45,x-s*.2,y,x,y);
  ctx.bezierCurveTo(x+s*.2,y,x+s*.3,y+s*.45,cx,y+s*.9);
}

function drawHeart(x,y,s,color){
  ctx.fillStyle=color;
  drawHeartPath(x,y,s);ctx.fill();
}

function drawEnemy(e){
  ctx.save();ctx.translate(e.x,e.y);
  const hpRatio=e.hp/e.maxHp;
  const bc=e.bodyColor||'#3a0a0a';
  const sc=e.strokeColor||'#f44';
  const cc=e.coreColor||'#f66';

  // 受击闪白
  if(e.flashTimer>0){ctx.globalAlpha=1;ctx.fillStyle='#fff';e.flashTimer-=dt;}
  
  if(e.type==='boss'){
    // Boss攻击预警
    if(e.telegraphTimer>0){
      ctx.fillStyle=`rgba(${parseColor(sc)},0.25)`;
      ctx.beginPath();ctx.arc(0,0,e.w*.9,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=`rgba(${parseColor(sc)},0.5)`;ctx.lineWidth=2;ctx.setLineDash([6,3]);
      ctx.beginPath();ctx.arc(0,0,e.w*.85,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    }
    // 无敌护盾效果
    if(e.invulnerable>0){
      ctx.strokeStyle='rgba(170,68,255,0.7)';ctx.lineWidth=3;
      ctx.setLineDash([8,4]);ctx.lineDashOffset=frameCount*5;
      ctx.beginPath();ctx.arc(0,0,e.w*.8,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle='rgba(170,68,255,0.08)';ctx.beginPath();ctx.arc(0,0,e.w*.8,0,Math.PI*2);ctx.fill();
    }
    // Boss主体 - 根据区域主题变化
    const topC=sc; // stroke色用于上面
    const bg=ctx.createLinearGradient(0,-45,0,45);
    bg.addColorStop(0,bc);bg.addColorStop(.5,sc);bg.addColorStop(1,bc);
    ctx.fillStyle=bg;
    // 不同区域Boss外形
    const zone=e.zone||'corporate';
    if(zone==='military'){
      // 军事风格：八角形战舰
      ctx.beginPath();
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4-Math.PI/8;
        const r=i%2===0?42:32;
        const px=Math.cos(a)*r,py=Math.sin(a)*r;
        if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.closePath();ctx.fill();
      // 用双层描边代替shadowBlur（性能更好）
      ctx.strokeStyle=sc+'44';ctx.lineWidth=8;ctx.stroke();
      ctx.strokeStyle=sc;ctx.lineWidth=2.5;ctx.stroke();
    } else if(zone==='alien'){
      // 外星风格：不规则多边体
      ctx.beginPath();
      ctx.moveTo(0,-44);ctx.lineTo(20,-30);ctx.lineTo(38,-10);ctx.lineTo(34,10);
      ctx.lineTo(42,20);ctx.lineTo(20,38);ctx.lineTo(-10,40);ctx.lineTo(-35,20);
      ctx.lineTo(-40,-5);ctx.lineTo(-25,-25);ctx.closePath();
      ctx.fill();
      ctx.strokeStyle=sc+'44';ctx.lineWidth=10;ctx.stroke();
      ctx.strokeStyle=sc;ctx.lineWidth=2.5;ctx.stroke();
      // 异星触手
      for(let i=0;i<4;i++){
        const a=i*Math.PI/2+frameCount*.03;
        ctx.strokeStyle=sc;ctx.lineWidth=1.5;ctx.globalAlpha=.4;
        ctx.beginPath();ctx.moveTo(Math.cos(a)*30,Math.sin(a)*25);
        ctx.lineTo(Math.cos(a)*52,Math.sin(a)*42);ctx.stroke();
        ctx.globalAlpha=1;
      }
    } else if(zone==='cosmic'){
      // 宇宙风格：旋转椭圆体
      ctx.beginPath();
      ctx.ellipse(0,0,42,38,frameCount*.01,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=sc+'44';ctx.lineWidth=12;ctx.stroke();
      ctx.strokeStyle=sc;ctx.lineWidth=2.5;ctx.stroke();
      // 光环
      ctx.beginPath();ctx.ellipse(0,0,50,20,frameCount*.02,0,Math.PI*2);
      ctx.strokeStyle=sc;ctx.lineWidth=1.5;ctx.globalAlpha=.5;ctx.stroke();ctx.globalAlpha=1;
    } else if(zone==='void'){
      // 虚空风格：碎片几何体
      ctx.beginPath();
      ctx.moveTo(0,-45);ctx.lineTo(28,-25);ctx.lineTo(42,0);ctx.lineTo(25,30);
      ctx.lineTo(-25,35);ctx.lineTo(-42,5);ctx.lineTo(-30,-20);ctx.closePath();
      ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=14;ctx.setLineDash([10,5]);ctx.stroke();
      ctx.strokeStyle=sc;ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
      // 虚空裂缝
      ctx.strokeStyle=sc;ctx.lineWidth=1;
      for(let i=0;i<3;i++){
        const a=i*Math.PI*2/3+frameCount*.02;
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(a)*45,Math.sin(a)*30);ctx.stroke();
      }
    } else {
      // Corporate: 默认钻石形
      ctx.beginPath();
      ctx.moveTo(0,-42);ctx.lineTo(30,-20);ctx.lineTo(40,0);ctx.lineTo(30,25);
      ctx.lineTo(10,40);ctx.lineTo(-10,40);ctx.lineTo(-30,25);ctx.lineTo(-40,0);
      ctx.lineTo(-30,-20);ctx.closePath();
      ctx.fill();
      ctx.strokeStyle=sc+'44';ctx.lineWidth=8;ctx.stroke();
      ctx.strokeStyle=sc;ctx.lineWidth=2.5;ctx.stroke();
    }
    // 能量核心
    const core=ctx.createRadialGradient(0,0,0,0,0,16);
    core.addColorStop(0,'#fff');core.addColorStop(.3,cc);core.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=core;ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();
    // 小血条
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(-30,-52,60,4);
    ctx.fillStyle=hpRatio>.5?sc:'#f00';ctx.fillRect(-30,-52,60*hpRatio,4);
    // 名字 + 称号
    ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
    ctx.shadowColor=sc;ctx.shadowBlur=8;ctx.fillText(e.name,0,-56);
    ctx.shadowBlur=0;
    ctx.fillStyle='#ff0';ctx.font='9px sans-serif';ctx.fillText(`【${e.title}】`,0,-44);
  } else if(e.type==='large'){
    ctx.fillStyle=bc;ctx.strokeStyle=sc;ctx.lineWidth=2;
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6,r=26;if(i===0)ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);else ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=cc;ctx.beginPath();ctx.arc(0,0,6,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(-14,-e.h/2-6,28,3);
    ctx.fillStyle=hpRatio>.5?sc:'#f00';ctx.fillRect(-14,-e.h/2-6,28*hpRatio,3);
  } else if(e.type==='medium'){
    ctx.fillStyle=bc;ctx.strokeStyle=sc;ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(0,-17);ctx.lineTo(16,0);ctx.lineTo(0,17);ctx.lineTo(-16,0);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=cc;ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();
  } else {
    // 小怪去掉shadowBlur（性能优化）
    ctx.fillStyle=sc;
    ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(9,0);ctx.lineTo(0,10);ctx.lineTo(-9,0);ctx.closePath();ctx.fill();
  }
  
  // === 名称标签（Boss始终显示；小/中/大怪每4帧刷新一次，且只显示在屏幕上半区）===
  const nameY=e.type==='boss'?-e.h/2-20:(e.type==='large'?-e.h/2-14:(e.type==='medium'?-e.h/2-12:-e.h/2-8));
  const nameSize=e.type==='boss'?13:(e.type==='large'?9:8);
  const nameAlpha=e.type==='boss'?1:.5;
  // 非Boss敌机：跳过每帧绘制文字（最大性能节省之一）
  const showName=e.type==='boss'||(frameCount%4===0&&e.y<H*.6);
  if(showName){
    ctx.fillStyle=`rgba(255,255,255,${nameAlpha})`;ctx.font=`bold ${nameSize}px sans-serif`;
    ctx.textAlign='center';
    if(e.type==='boss'){
      ctx.shadowColor=`rgba(${parseColor(sc)},0.8)`;ctx.shadowBlur=8;
      ctx.fillText('⚡ '+e.name+' ⚡',0,nameY);
      ctx.shadowBlur=0;
    } else {
      ctx.fillText(e.name,0,nameY);
    }
    ctx.textAlign='left';
  }
  
  ctx.globalAlpha=1;
  ctx.restore();
}

function enemyShoot(e){
  // 性能保护：敌弹过多时停止生成新弹
  if(enemyBullets.length>_adaptMaxEB*.9) return;
  // v6.10: 防御NaN — 如果玩家坐标无效，不射击
  if(!player || !isFinite(player.x) || !isFinite(player.y)){
    console.warn('[enemyShoot] 玩家坐标无效，跳过射击');
    return;
  }
  const bsm=getDynamicBulletSpeed();
  const dScale=getDynamicScale();
  if(e.type==='boss'){
    // 攻击预警：发射前闪烁
    e.telegraphTimer=0.3;
    // 根据Boss类型+当前阶段选择弹幕模式
    const bossType=e.bossType||'corporate';
    const bp=BOSS_PATTERNS[bossType]||BOSS_PATTERNS['corporate'];
    const phasePatterns=bp.phasePatterns[e.phase]||bp.phasePatterns[0];
    const p=e.pattern%phasePatterns.length;
    if(phasePatterns[p]) phasePatterns[p](e,bsm);
    e.pattern++;
  } else if(e.type==='large'){
    enemyBullets.push({x:e.x,y:e.y+15,vx:-40*bsm,vy:220*bsm,life:4,alive:true,bulletType:'normal'});
    enemyBullets.push({x:e.x,y:e.y+15,vx:40*bsm,vy:220*bsm,life:4,alive:true,bulletType:'normal'});
    if(currentDifficulty==='hard'||currentDifficulty==='hell'||dScale>2.5){
      enemyBullets.push({x:e.x,y:e.y+15,vx:0,vy:240*bsm,life:3.5,alive:true,bulletType:'fast'});
    }
    // dScale>2: 侧向散射
    if(dScale>2){
      enemyBullets.push({x:e.x-10,y:e.y+10,vx:-80*bsm,vy:200*bsm,life:3,alive:true,bulletType:'wave'});
      enemyBullets.push({x:e.x+10,y:e.y+10,vx:80*bsm,vy:200*bsm,life:3,alive:true,bulletType:'wave'});
    }
    // dScale>3.5: 扇形散射
    if(dScale>3.5){
      for(let i=-2;i<=2;i++){
        enemyBullets.push({x:e.x,y:e.y+10,vx:i*60*bsm,vy:(200+Math.abs(i)*30)*bsm,life:3.5,alive:true,bulletType:'explosive'});
      }
    }
    // dScale>5: 瞄准玩家方向射击
    if(dScale>5&&player.alive){
      const dx=player.x-e.x,dy=player.y-e.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
      // v6.10: 防御NaN
      if(isFinite(dx) && isFinite(dy) && dist>0){
        enemyBullets.push({x:e.x,y:e.y,vx:dx/dist*180*bsm,vy:dy/dist*180*bsm,life:4,alive:true,bulletType:'laser'});
      }
    }
  } else if(e.type==='medium'){
    enemyBullets.push({x:e.x,y:e.y+10,vx:0,vy:200*bsm,life:3.5,alive:true,bulletType:'normal'});
    if(dScale>1.5){
      enemyBullets.push({x:e.x-8,y:e.y+8,vx:-30*bsm,vy:180*bsm,life:3,alive:true,bulletType:'normal'});
      enemyBullets.push({x:e.x+8,y:e.y+8,vx:30*bsm,vy:180*bsm,life:3,alive:true,bulletType:'normal'});
    }
    // dScale>4: 中怪也开始多方向射击
    if(dScale>4){
      for(let i=-1;i<=1;i+=2){
        enemyBullets.push({x:e.x,y:e.y+8,vx:i*50*bsm,vy:170*bsm,life:3,alive:true,bulletType:'homing'});
      }
    }
  } else {
    // 小兵射击概率随难度递进
    const smallShootProb=Math.min(.9, .25 + dScale*.08);
    if(Math.random()<smallShootProb) enemyBullets.push({x:e.x,y:e.y+8,vx:0,vy:180*bsm,life:3,alive:true,bulletType:'normal'});
    if(dScale>2.5&&Math.random()<.3){
      enemyBullets.push({x:e.x,y:e.y+8,vx:(Math.random()-.5)*80*bsm,vy:150*bsm,life:2.5,alive:true,bulletType:'wave'});
    }
    // dScale>5: 小兵也疯狂
    if(dScale>5&&Math.random()<.5){
      enemyBullets.push({x:e.x,y:e.y+6,vx:(Math.random()-.5)*120*bsm,vy:140*bsm,life:2.5,alive:true,bulletType:'fast'});
    }
  }
}

function drawEnemyBullet(b){
  if(b.y<-30||b.y>H+30||b.x<-30||b.x>W+30) return;
  const bt=b.bulletType||'normal';
  const cfg=ENEMY_BULLET_TYPES[bt]||ENEMY_BULLET_TYPES['normal'];
  // 性能降级：子弹数量多时只画普通形式
  const lowDetail=enemyBullets.length>_adaptMaxEB*.75;
  const bx=b.x,by=b.y;
  /* v6.4: 绝对坐标 + 独特几何形状 — 每种弹幕类型一眼可辨 */

  if(bt==='laser'){
    // 高速激光束 — 细长线束 + 白芯
    ctx.strokeStyle=cfg.color;ctx.lineWidth=cfg.size;ctx.globalAlpha=0.8;
    ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+b.vx*.025,by+b.vy*.025);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.5)';ctx.lineWidth=1;ctx.globalAlpha=0.6;
    ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx+b.vx*.015,by+b.vy*.015);ctx.stroke();
    ctx.globalAlpha=1;

  } else if(bt==='fast'){
    // 快速弹 — 白色菱形 + 长拖尾(运动方向延伸)
    const spd=Math.sqrt(b.vx*b.vx+b.vy*b.vy);
    const nx=spd>0.1?b.vx/spd:0,ny=spd>0.1?b.vy/spd:0;
    for(let t=1;t<=3;t++){
      const tx=bx-nx*t*5,ty=by-ny*t*5;
      const alpha=1-t*0.28,sz=2+t*0.8;
      ctx.globalAlpha=alpha;ctx.fillStyle=cfg.glow;
      ctx.beginPath();ctx.moveTo(tx,ty-sz);ctx.lineTo(tx+sz*0.5,ty);ctx.lineTo(tx,ty+sz);ctx.lineTo(tx-sz*0.5,ty);ctx.closePath();ctx.fill();
    }
    ctx.fillStyle='#fff';ctx.globalAlpha=1;
    ctx.beginPath();ctx.moveTo(bx,by-7);ctx.lineTo(bx+2.5,by);ctx.lineTo(bx,by+7);ctx.lineTo(bx-2.5,by);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';ctx.fillRect(bx-.5,by-5,1,10);

  } else if(bt==='wave'){
    // 波形弹 — 扁平椭圆 + 正弦摆动偏移（非圆形！）
    const wt=(b._wt||0)*6;
    const wobbleX=Math.sin(wt)*2.5,wobbleY=Math.cos(wt*1.3)*1.5;
    const wx=bx+wobbleX,wy=by+wobbleY;
    ctx.fillStyle=cfg.glow;ctx.beginPath();
    ctx.ellipse(wx,wy,cfg.size*1.6,cfg.size*0.7,wt*0.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=cfg.inner;ctx.beginPath();
    ctx.ellipse(wx,wy,cfg.size*0.4,cfg.size*0.25,wt*0.5,0,Math.PI*2);ctx.fill();
    if(!lowDetail){
      ctx.globalAlpha=0.35;ctx.fillStyle=cfg.glow;
      ctx.beginPath();ctx.ellipse(wx-b.vx*.008,wy-b.vy*.008,cfg.size*1.1,cfg.size*0.5,wt*0.5,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=1;
    }

  } else if(bt==='orb'){
    // 能量球 — 六边形外框 + 内旋点（非圆形！）
    const or=cfg.size,rot=b._rot||0;
    ctx.strokeStyle=cfg.color;ctx.lineWidth=2;ctx.globalAlpha=0.7;
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6+rot;const px=bx+Math.cos(a)*or,py=by+Math.sin(a)*or;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
    ctx.closePath();ctx.stroke();
    ctx.fillStyle=cfg.glow;ctx.globalAlpha=0.35;ctx.fill();ctx.globalAlpha=0.7;
    const ir=or*0.55;
    ctx.strokeStyle=cfg.color;ctx.lineWidth=1;ctx.globalAlpha=0.5;
    ctx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3-Math.PI/6-rot*1.5;const px=bx+Math.cos(a)*ir,py=by+Math.sin(a)*ir;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
    ctx.closePath();ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,0.7)';ctx.globalAlpha=1;ctx.beginPath();ctx.arc(bx,by,2,0,Math.PI*2);ctx.fill();

  } else if(bt==='explosive'){
    // 爆炸弹 — 锯齿星形（非圆形！）+ 脉冲
    const pulse=lowDetail?1:1+Math.sin(b.life*15)*.2;
    const er=cfg.size*pulse,spikes=6,erot=b._rot||0;
    ctx.fillStyle=cfg.glow;ctx.beginPath();
    for(let i=0;i<spikes*2;i++){
      const r=i%2===0?er:er*0.5;
      const a=i*Math.PI/spikes-Math.PI/2+erot*0.3;
      const px=bx+Math.cos(a)*r,py=by+Math.sin(a)*r;
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(bx,by,2.2,0,Math.PI*2);ctx.fill();
    if(!lowDetail){
      ctx.strokeStyle='#ff0';ctx.lineWidth=1;ctx.setLineDash([2,2]);
      ctx.beginPath();
      for(let i=0;i<spikes*2;i++){
        const r=i%2===0?er+2:er*0.5+2;
        const a=i*Math.PI/spikes-Math.PI/2+erot*0.3;
        const px=bx+Math.cos(a)*r,py=by+Math.sin(a)*r;
        if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.closePath();ctx.stroke();ctx.setLineDash([]);
    }

  } else if(bt==='homing'){
    // 追踪弹 — 三角箭头 + 方向指示（非圆形！）
    const spd=Math.sqrt(b.vx*b.vx+b.vy*b.vy);
    const hx=spd>0.1?b.vx/spd:0,hy=spd>0.1?b.vy/spd:0;
    for(let t=1;t<=2;t++){
      const tx=bx-hx*t*6,ty=by-hy*t*6;
      const alpha=1-t*0.4,sz=3+t*1.5;
      ctx.globalAlpha=alpha;ctx.fillStyle=cfg.glow;
      ctx.beginPath();ctx.moveTo(tx,ty-sz);ctx.lineTo(tx+sz*0.6,ty+sz*0.5);ctx.lineTo(tx-sz*0.6,ty+sz*0.5);ctx.closePath();ctx.fill();
    }
    ctx.fillStyle=cfg.glow;ctx.globalAlpha=1;
    ctx.beginPath();
    ctx.moveTo(bx+hx*7,by+hy*7);
    ctx.lineTo(bx+hy*4,hx*-4+by-4);
    ctx.lineTo(bx-hy*4,hx*4+by-4);
    ctx.closePath();ctx.fill();
    ctx.strokeStyle='#ff0';ctx.lineWidth=1;ctx.globalAlpha=0.7;
    ctx.stroke();ctx.globalAlpha=1;
    ctx.fillStyle=cfg.inner;ctx.beginPath();ctx.arc(bx,by,1.8,0,Math.PI*2);ctx.fill();

  } else {
    // 普通弹 — 经典红圆球
    ctx.fillStyle=cfg.glow;ctx.beginPath();ctx.arc(bx,by,cfg.size,0,Math.PI*2);ctx.fill();
    if(!lowDetail){ctx.fillStyle=cfg.inner;ctx.beginPath();ctx.arc(bx,by-0.8,2,0,Math.PI*2);ctx.fill();}
  }
}

// ==================== 道具 ====================
function createItem(x,y,type,weaponSub){return {x,y,type,weaponSub,vy:80,lived:0,maxLife:8,alive:true,yoy:0,collecting:false,collectSpeed:0};}
const ITEM_COLORS={weapon:'#0ff',bomb:'#ff0',star:'#ff0',shield:'#0f0',coin:'#FD0',health:'#f0f',drone:'#4af',evolve:'#f0f'};

function drawItem(it){
  const iy=it.y+(it.collecting?0:it.yoy);
  if(!it.collecting) it.yoy=Math.sin(it.lived*4)*3;
  const c=it.type==='weapon'&&it.weaponSub&&WEAPON_TYPES[it.weaponSub]?WEAPON_TYPES[it.weaponSub].color:(ITEM_COLORS[it.type]||'#fff');
  const ix=it.x,iy2=iy,sz=11; // 基础尺寸
  /* v6.4: 每种道具独特几何形状 — 不再依赖emoji */

  if(it.type==='weapon'){
    // === 武器 — 菱形水晶（内嵌武器颜色） ===
    ctx.fillStyle='rgba(255,255,255,0.25)';ctx.beginPath();ctx.arc(ix,iy2,16,0,Math.PI*2);ctx.fill();
    // 外菱形
    ctx.fillStyle=c;ctx.globalAlpha=0.5;ctx.beginPath();
    ctx.moveTo(ix,iy2-sz-3);ctx.lineTo(ix+sz+1,iy2);ctx.lineTo(ix,iy2+sz+3);ctx.lineTo(ix-sz-1,iy2);ctx.closePath();ctx.fill();
    ctx.globalAlpha=1;
    // 内菱形亮核
    ctx.fillStyle='#fff';ctx.globalAlpha=0.9;ctx.beginPath();
    ctx.moveTo(ix,iy2-sz+2);ctx.lineTo(ix+sz-3,iy2);ctx.lineTo(ix,iy2+sz-2);ctx.lineTo(ix-sz+3,iy2);ctx.closePath();ctx.fill();
    ctx.globalAlpha=1;
    // 武器子类型指示点
    ctx.fillStyle=c;ctx.beginPath();ctx.arc(ix,iy2,3,0,Math.PI*2);ctx.fill();

  } else if(it.type==='bomb'){
    // === 炸弹 — 尖刺星形 ===
    ctx.fillStyle='rgba(255,255,0,0.2)';ctx.beginPath();ctx.arc(ix,iy2,16,0,Math.PI*2);ctx.fill();
    const spikes=8;const outer=sz+3,inner=sz*0.45;const brot=(it._rot||0);
    ctx.fillStyle=c;ctx.beginPath();
    for(let i=0;i<spikes*2;i++){
      const r=i%2===0?outer:inner;
      const a=i*Math.PI/spikes-Math.PI/2+brot;
      const px=ix+Math.cos(a)*r,py=iy2+Math.sin(a)*r;
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.closePath();ctx.fill();
    // 红芯
    ctx.fillStyle='#f44';ctx.beginPath();ctx.arc(ix,iy2,3,0,Math.PI*2);ctx.fill();

  } else if(it.type==='star'){
    // === 星星 — 五角星 ===
    ctx.fillStyle='rgba(255,215,0,0.2)';ctx.beginPath();ctx.arc(ix,iy2,16,0,Math.PI*2);ctx.fill();
    const srot=(it._rot||0)*0.8;
    ctx.fillStyle='#ffd700';ctx.beginPath();
    for(let i=0;i<10;i++){
      const r=i%2===0?sz+2:sz*0.45;
      const a=i*Math.PI/5-Math.PI/2+srot;
      const px=ix+Math.cos(a)*r,py=iy2+Math.sin(a)*r;
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
    }
    ctx.closePath();ctx.fill();
    // 白高光
    ctx.fillStyle='rgba(255,255,255,0.7)';ctx.beginPath();
    ctx.arc(ix-2,iy2-2,2.5,0,Math.PI*2);ctx.fill();

  } else if(it.type==='shield'){
    // === 护盾 — 圆角六边形盾牌 ===
    ctx.fillStyle='rgba(0,255,0,0.15)';ctx.beginPath();ctx.arc(ix,iy2,16,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=c;ctx.globalAlpha=0.6;ctx.beginPath();
    for(let i=0;i<6;i++){const a=i*Math.PI/3;a<Math.PI?null:null;const r=sz+2;const pa=[[-r,-r*0.7],[r,-r*0.7],[r*1.1,r*0.3],[r*0.5,r*1.15],[-r*0.5,r*1.15],[-r*1.1,r*0.3]][i];if(i===0)ctx.moveTo(ix+pa[0],iy2+pa[1]);else ctx.lineTo(ix+pa[0],iy2+pa[1]);}
    // 用简化的盾形：上宽下窄
    ctx.beginPath();ctx.moveTo(ix-sz-2,iy2-sz);
    ctx.quadraticCurveTo(ix,iy2-sz-4,ix+sz+2,iy2-sz);
    ctx.lineTo(ix+sz+1,iy2+sz*0.3);
    ctx.lineTo(ix+sz*0.4,iy2+sz+3);
    ctx.lineTo(ix-sz*0.4,iy2+sz+3);
    ctx.lineTo(ix-sz-1,iy2+sz*0.3);
    ctx.closePath();ctx.fill();ctx.globalAlpha=1;
    // 十字标志
    ctx.fillStyle='#fff';ctx.fillRect(ix-1,iy2-4,2,8);ctx.fillRect(ix-4,iy2-1,8,2);

  } else if(it.type==='coin'){
    // === 金币 — 金色圆环 + 内C符号 ===
    ctx.fillStyle='rgba(255,200,0,0.15)';ctx.beginPath();ctx.arc(ix,iy2,16,0,Math.PI*2);ctx.fill();
    // 外圈金环
    ctx.strokeStyle='#ffd700';ctx.lineWidth=3;ctx.beginPath();ctx.arc(ix,iy2,sz+1,0,Math.PI*2);ctx.stroke();
    // 内填充
    ctx.fillStyle='#ffcc00';ctx.globalAlpha=0.5;ctx.beginPath();ctx.arc(ix,iy2,sz-2,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    // $ 符号
    ctx.fillStyle='#b8860b';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('$',ix,iy2);ctx.textAlign='left';

  } else if(it.type==='health'){
    // === 血包 — 粉红十字/心形混合 ===
    ctx.fillStyle='rgba(255,0,170,0.15)';ctx.beginPath();ctx.arc(ix,iy2,16,0,Math.PI*2);ctx.fill();
    // 十字形
    ctx.fillStyle='#ff3399';ctx.fillRect(ix-2.5,iy2-sz-1,5,sz*2+2);
    ctx.fillRect(ix-sz-1,iy2-2.5,sz*2+2,5);
    // 白边框
    ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=1.5;ctx.strokeRect(ix-2.5,iy2-sz-1,5,sz*2+2);
    // 四角小圆装饰
    ctx.fillStyle='rgba(255,100,180,0.6)';
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([dx,dy])=>{
      ctx.beginPath();ctx.arc(ix+dx*(sz+3),iy2+dy*(sz+3),2,0,Math.PI*2);ctx.fill();
    });

  } else if(it.type==='drone'){
    // === 无人机 — 扁椭圆UFO ===
    ctx.fillStyle='rgba(68,170,255,0.15)';ctx.beginPath();ctx.arc(ix,iy2,16,0,Math.PI*2);ctx.fill();
    // 扁椭圆机身
    ctx.fillStyle=c;ctx.globalAlpha=0.6;ctx.beginPath();
    ctx.ellipse(ix,iy2,sz+5,sz*0.35,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    // 驾驶舱圆顶
    ctx.fillStyle='rgba(150,210,255,0.8)';ctx.beginPath();
    ctx.ellipse(ix,iy2-2,sz*0.45,sz*0.35,0,0,Math.PI*2);ctx.fill();
    // 两侧灯
    ctx.fillStyle='#0ff';ctx.beginPath();ctx.arc(ix-sz-2,iy2,2,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f44';ctx.beginPath();ctx.arc(ix+sz+2,iy2,2,0,Math.PI*2);ctx.fill();

  } else if(it.type==='evolve'){
    // === 进化 — 双螺旋/DNA环 ===
    ctx.fillStyle='rgba(255,0,255,0.12)';ctx.beginPath();ctx.arc(ix,iy2,17,0,Math.PI*2);ctx.fill();
    const erot=(it._rot||0),er=sz+1;
    // 左螺旋臂（紫）
    ctx.strokeStyle='#d0f';ctx.lineWidth=2.5;ctx.globalAlpha=0.7;ctx.beginPath();
    for(let t=0;t<=20;t++){const a=t*0.35+erot,r=er*(0.4+0.6*t/20);const px=ix+Math.cos(a)*r,py=iy2+Math.sin(a)*r*0.55;if(t===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
    ctx.stroke();
    // 右螺旋臂（粉）
    ctx.strokeStyle='#f6a';ctx.beginPath();
    for(let t=0;t<=20;t++){const a=-t*0.35+erot+Math.PI,r=er*(0.4+0.6*t/20);const px=ix+Math.cos(a)*r,py=iy2+Math.sin(a)*r*0.55;if(t===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);}
    ctx.stroke();ctx.globalAlpha=1;
    // 中心发光核
    ctx.fillStyle='rgba(255,200,255,0.9)';ctx.beginPath();ctx.arc(ix,iy2,3,0,Math.PI*2);ctx.fill();

  } else {
    // 兜底圆形
    ctx.fillStyle='rgba(255,255,255,0.3)';ctx.beginPath();ctx.arc(ix,iy2,14,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=c;ctx.globalAlpha=0.4;ctx.beginPath();ctx.arc(ix,iy2,9,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle='#fff';ctx.font='14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('?',ix,iy2);
  }

  // 统一外框虚线旋转环（所有道具共用）
  ctx.beginPath();ctx.arc(ix,iy2,18,0,Math.PI*2);ctx.setLineDash([4,4]);
  ctx.lineDashOffset=(it.lived||0)*50;
  ctx.strokeStyle=c;ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);

  // 道具旋转动画
  it._rot=(it._rot||0)+0.03;
}

// ==================== 星风暴 (擦弹必杀) ====================
function activateStarStorm(){
  if(starStormGauge<100||starStormActive) return;
  starStormGauge=0;
  starStormActive=true;
  starStormTimer=2.5; // 持续2.5秒
  screenShakeTrauma=0.8;
  player.invincible=2.5;
  // 清空敌弹
  enemyBullets.forEach(b=>{
    spawnParticles(b.x,b.y,3,'#0cf',40,.3,1.5);
  });
  enemyBullets=[];
  // 伤害所有敌机
  enemies.forEach(e=>{
    if(e.type==='small'||e.type==='medium'){
      e.hp=0;
      spawnParticles(e.x,e.y,12,'#ff0',80,.4,2.5);
    } else {
      e.hp=Math.max(1,Math.floor(e.hp*.5)); // Boss掉50%血
      spawnParticles(e.x,e.y,20,'#f80',100,.5,3);
    }
  });
  // 全屏闪光粒子
  for(let i=0;i<80;i++){
    const ax=Math.random()*W, ay=Math.random()*H;
    spawnParticles(ax,ay,1,'#0ff',60,.6,2);
  }
  SFX.bomb(); // 复用炸弹音效
  addScorePopup(player.x,player.y-40,'⭐ 星风暴!','#0ff',22);
}

function updateStarStorm(dt){
  if(!starStormActive) return;
  starStormTimer-=dt;
  // 星风暴持续期间的视觉效果：环绕玩家的光环
  if(Math.random()<.4){
    const a=Math.random()*Math.PI*2, r=40+Math.random()*60;
    particles.push(new Particle(player.x+Math.cos(a)*r,player.y+Math.sin(a)*r,0,0,.35,'#0cf',1.2));
  }
  if(starStormTimer<=0) starStormActive=false;
}

// ==================== 风筝伴侣（无人机）系统 ====================
const DRONE_TYPES = [
  {name:'攻击型',icon:'🔴',color:'#f44',desc:'自动射击',shootRate:1.2},
  {name:'防御型',icon:'🛡️',color:'#4af',desc:'吸收敌弹',absorbRange:50},
  {name:'支援型',icon:'💚',color:'#0f0',desc:'缓慢回血',healRate:5}
];
function addDrone(){
  if(drones.length>=3) return;
  const idx=drones.length;
  const type=DRONE_TYPES[idx];
  drones.push({
    idx, type:type.name, color:type.color, icon:type.icon,
    orbitAngle:idx*Math.PI*2/3, orbitRadius:35+idx*12,
    shootTimer:0, absorbCooldown:0, healTimer:0
  });
  if(drones.length>maxDronesThisGame) maxDronesThisGame=drones.length;
  addScorePopup(player.x,player.y-30,'🛸 '+type.name+'无人机','#4af',16);
  SFX.powerup&&SFX.powerup();
}
function updateDrones(dt){
  if(!player.alive) return;
  drones.forEach(d=>{
    // 环绕玩家旋转
    d.orbitAngle+=dt*2.5;
    d.x=player.x+Math.cos(d.orbitAngle)*d.orbitRadius;
    d.y=player.y+Math.sin(d.orbitAngle)*d.orbitRadius;
    // 攻击型：自动射击
    if(d.type==='攻击型'){
      d.shootTimer-=dt;
      if(d.shootTimer<=0){
        let nx=0,ny=-1,md=350;
        enemies.forEach(e=>{const dx=e.x-d.x,dy=e.y-d.y,d2=Math.hypot(dx,dy);if(d2<md){md=d2;nx=dx/d2;ny=dy/d2;}});
        if(md<350){
          enemyBullets.push({x:d.x,y:d.y,vx:nx*350,vy:ny*350,life:2,alive:true,color:'#f84',isDrone:true});
        }
        d.shootTimer=DRONE_TYPES[0].shootRate;
      }
    }
    // 防御型：吸收附近敌弹
    if(d.type==='防御型'){
      d.absorbCooldown-=dt;
      if(d.absorbCooldown<=0){
        for(let i=enemyBullets.length-1;i>=0;i--){
          const b=enemyBullets[i];
          if(!b.isDrone&&Math.hypot(b.x-d.x,b.y-d.y)<DRONE_TYPES[1].absorbRange){
            spawnParticles(b.x,b.y,2,'#4af',30,.2,1);
            enemyBullets.splice(i,1);
            d.absorbCooldown=0.3; // 吸收冷却
            break;
          }
        }
      }
    }
    // 支援型：缓慢回血
    if(d.type==='支援型'){
      d.healTimer+=dt;
      if(d.healTimer>=DRONE_TYPES[2].healRate&&player.hp<player.maxHp){
        player.hp=Math.min(player.maxHp,player.hp+1);
        d.healTimer=0;
        if(Math.random()<.3) particles.push(new Particle(d.x,d.y,0,0,.3,'#0f0',1));
      }
    }
  });
}
function drawDrones(){
  drones.forEach(d=>{
    ctx.save();
    ctx.translate(d.x,d.y);
    // 无人机主体
    ctx.fillStyle=d.color;
    ctx.shadowColor=d.color;ctx.shadowBlur=8;
    ctx.beginPath();ctx.arc(0,0,5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    // 环绕光环
    ctx.strokeStyle=d.color+'80';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(0,0,8,0,Math.PI*2);ctx.stroke();
    // 类型图标（小）
    ctx.fillStyle='#fff';ctx.font='8px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(d.icon,0,0);
    ctx.restore();
  });
}

// ==================== 炸弹 ====================
function useBomb(){
  if(bombCount<=0) return;
  bombCount--; dailyMissions.missions.forEach(m=>{if(m.type==='bomb'&&!m.done)m.progress++;});
  spawnParticles(W/2,H/2,60,'#fff',300,.8,4);
  SFX.bomb();
  spawnParticles(W/2,H/2,40,'#0ff',250,.6,3);
  screenShakeTrauma=0.5;
  enemies.forEach(e=>{spawnParticles(e.x,e.y,15,'#f84',100,.4,3);});
  enemies=[];enemyBullets=[];
  player.invincible=1.5;player.bombAnim=1;
}

// ==================== 背景 ====================
let bgStars=[];
function initBg(){
  bgStars=[];
  for(let i=0;i<150;i++) bgStars.push({x:Math.random()*W,y:Math.random()*H,size:Math.random()*2+.5,twinkle:Math.random()*Math.PI*2,speed:Math.random()*.5+.3});
}
function drawBg(offset){
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  bgStars.forEach(s=>{
    const sy=(s.y+offset*.05)%H;
    ctx.fillStyle=`rgba(255,255,255,${.4+.6*Math.abs(Math.sin(s.twinkle+frameCount*.02))})`;
    ctx.fillRect(s.x,sy,s.size,s.size);
  });
  const cityY=H*.6+offset*.2;
  ctx.fillStyle='rgba(5,10,30,0.9)';ctx.beginPath();ctx.moveTo(0,H);
  for(let x=0;x<W;x+=30){
    const h=40+Math.sin(x*.02+offset*.01)*30+Math.sin(x*.05)*15;
    ctx.lineTo(x,cityY-h);
  }
  ctx.lineTo(W,H);ctx.fill();
  for(let x=0;x<W;x+=60){
    const h=40+Math.sin(x*.02+offset*.01)*30+Math.sin(x*.05)*15;
    const colors=['#f0f','#0ff','#ff0','#0f0','#f80'];
    ctx.fillStyle=colors[Math.floor(x/60)%colors.length];ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=4;
    ctx.fillRect(x-1,cityY-h-1,3,3);ctx.shadowBlur=0;
  }
  const cloudBase=H*.35+offset*.35;
  ctx.fillStyle='rgba(10,20,60,0.5)';
  for(let x=-50;x<W+50;x+=80){
    const cy2=cloudBase+Math.sin(x*.015+offset*.015)*25;
    ctx.beginPath();ctx.ellipse(x,cy2,50+Math.sin(x)*15,12+Math.cos(x)*6,0,0,Math.PI*2);ctx.fill();
  }
}

// ==================== 天气 ====================
let weather={type:'clear',timer:15+Math.random()*30};
function updateWeather(dt){
  weather.timer-=dt;
  if(weather.timer<=0){
    const types=['clear','clear','clear','rain','rainbow','meteor'];
    weather.type=types[Math.floor(Math.random()*types.length)];
    weather.duration=weather.type==='clear'?15+Math.random()*20:(5+Math.random()*8);
    weather.timer=weather.duration;
  }
}
function drawWeather(offset){
  if(weather.type==='rain'){
    for(let i=0;i<30;i++){
      const rx=(Math.sin(i*137.5+frameCount*.1)+1)*W/2;
      const ry=(i*37+offset*50)%H;
      ctx.strokeStyle='rgba(100,180,255,0.3)';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(rx,ry);ctx.lineTo(rx-15,ry+25);ctx.stroke();
    }
  } else if(weather.type==='rainbow'){
    ctx.save();ctx.globalAlpha=.2;
    ['#f00','#f80','#ff0','#0f0','#0ff','#06f','#90f'].forEach((c,i)=>{
      ctx.strokeStyle=c;ctx.lineWidth=3;
      ctx.beginPath();ctx.arc(W/2,H/2+100+offset*.3,180-i*10,Math.PI*1.1,Math.PI*1.9);ctx.stroke();
    });
    ctx.restore();
    if(Math.random()<.02) items.push(createItem(Math.random()*W,-20,'coin'));
  } else if(weather.type==='meteor'){
    for(let i=0;i<5;i++){
      const mx=Math.random()*W,my=Math.random()*H*.6;
      ctx.strokeStyle=`rgba(255,255,200,${.3+Math.random()*.4})`;ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(mx-30,my+50);ctx.stroke();
      ctx.fillStyle=`rgba(255,255,200,${.2})`;ctx.beginPath();ctx.arc(mx-30,my+50,2,0,Math.PI*2);ctx.fill();
    }
    if(Math.random()<.02) items.push(createItem(Math.random()*W,-20,'star'));
  }
}

// ==================== 成就弹窗 ====================
let achievementQueue=[], achievementPopupTimer=0;
function unlockAchievement(aid){
  if(achievements.includes(aid)) return;
  achievements.push(aid);SAVE.set('achievements',achievements);
  achievementQueue.push(aid);
  SFX.achievement();
}

function showAchievement(){
  if(achievementQueue.length===0||achievementPopupTimer>0) return;
  const aid=achievementQueue[0];
  const a=ACHIEVEMENTS.find(x=>x.id===aid);
  if(!a) return;
  const popup=document.getElementById('achievement-popup');
  popup.querySelector('.ach-icon').textContent=a.icon;
  popup.querySelector('.ach-title').textContent=a.name;
  popup.querySelector('.ach-desc').textContent=a.desc;
  popup.classList.add('show');
  achievementPopupTimer=3;
  achievementQueue.shift();
  setTimeout(()=>{
    if(achievementQueue.length===0) popup.classList.remove('show');
  },2500);
}

// ==================== 死亡慢镜头 ====================
let deathSlowMo=0, deathTimer=0;
function gameOver(cause){
  gameRunning=false;player.alive=false;
  // v6.5.2: 关闭武器升级面板，防止状态残留
  weaponUpgradeActive=false;
  const wuPanel=document.getElementById('weapon-upgrade');
  if(wuPanel) wuPanel.style.display='none';
  spawnParticles(player.x,player.y,60,'#fff',200,1,4);
  spawnParticles(player.x,player.y,40,'#f84',150,.8,3);
  spawnParticles(player.x,player.y,20,SKINS[currentSkin].color,180,1.2,4);
  screenShakeTrauma=0.9;deathSlowMo=1.5;
  SFX.die();stopBGM();
  // 剧终慢镜头粒子继续渲染1.5秒
  deathTimer=1.5;
  // 结局剧情（根据高度决定是悲壮结局还是英雄结局）
  const storyKey=heightM>=2000?'gameOverGood':'gameOver';
  setTimeout(()=>queueStory(STORY_DATA[storyKey]),800);

  const earned=Math.floor(score/10);
  totalCoins+=earned;gamesPlayed++;totalKills+=kills;
  if(heightM>recordHeight) recordHeight=Math.floor(heightM);
  SAVE.set('coins',totalCoins);SAVE.set('record',recordHeight);
  SAVE.set('kills',totalKills);SAVE.set('games',gamesPlayed);
  saveDaily();

  // Boss累积击杀
  let thisBossKills=0;
  const bIndex=achievements.findIndex(a=>a.id==='boss_slayer');
  if(bIndex>=0) thisBossKills=totalKills;

  // 检查成就
  const stats={
    games:gamesPlayed, kills:totalKills, height:heightM, bossKills:bossKills,
    maxCombo, coins:totalCoins, weapon3Distance, itemsCollected, survivalTime:gameTime,
    feverCount, maxDrones:maxDronesThisGame
  };
  ACHIEVEMENTS.forEach(a=>{
    if(!achievements.includes(a.id)&&a.check(stats)) unlockAchievement(a.id);
  });

  setTimeout(()=>{
    // 排行榜
    const newEntry={score:Math.floor(score),height:Math.floor(heightM),kills,date:new Date().toLocaleDateString()};
    const lb=getLeaderboard();
    // 检查是否进入排行榜
    let lbRank=-1;
    lb.push(newEntry);
    lb.sort((a,b)=>b.score-a.score);
    const top10=lb.slice(0,10);
    const idx=top10.findIndex(e=>e.score===newEntry.score&&e.height===newEntry.height&&e.kills===newEntry.kills);
    if(idx>=0) lbRank=idx+1;
    SAVE.set('leaderboard',top10);

    document.getElementById('go-title').textContent=cause==='被击中了'?'被击落了':'坠落了';
    document.getElementById('go-cause').textContent=cause;
    document.getElementById('go-height').textContent=Math.floor(heightM)+'m';
    document.getElementById('go-score').textContent=score;
    document.getElementById('go-kills').textContent=kills;
    document.getElementById('go-combo').textContent=maxCombo;
    document.getElementById('go-coins').textContent=earned;
    document.getElementById('go-newRecord').style.display=(heightM>=recordHeight&&heightM>10)?'block':'none';
    
    // 排行榜展示
    const goLbEl=document.getElementById('go-lb');
    if(top10.length>0){
      goLbEl.style.display='block';
      let lbHTML='';
      top10.forEach((e,i)=>{
        const isCurrent=e.score===newEntry.score&&e.height===newEntry.height&&e.kills===newEntry.kills;
        const rankClass=i===0?'go-rank-1':(i===1?'go-rank-2':(i===2?'go-rank-3':''));
        lbHTML+=`<tr class="${isCurrent?'go-lb-current':''}">
          <td class="go-lb-rank ${rankClass}">#${i+1}</td>
          <td>${e.score}</td><td>${e.height}m</td><td>${e.kills}</td>
          <td>${e.date}</td></tr>`;
      });
      document.getElementById('go-lb-tbody').innerHTML=lbHTML;
    } else {
      goLbEl.style.display='none';
    }
    
    document.getElementById('gameover').style.display='flex';
    refreshMenu();
    // 生成分享截图卡
    generateShareCard(Math.floor(score), Math.floor(heightM), kills, maxCombo);
  },1000);
}

// ==================== 分享截图卡 ====================
function generateShareCard(score, height, kills, combo){
  try{
    const sc=document.createElement('canvas');
    const sw=320, sh=180;
    sc.width=sw;sc.height=sh;
    const sx=sc.getContext('2d');
    // 背景渐变
    const bg=sx.createLinearGradient(0,0,sw,sh);
    bg.addColorStop(0,'#05061a');bg.addColorStop(1,'#0a1030');
    sx.fillStyle=bg;sx.fillRect(0,0,sw,sh);
    // 星点
    sx.fillStyle='rgba(255,255,255,0.6)';
    for(let i=0;i<40;i++){sx.beginPath();sx.arc(Math.random()*sw,Math.random()*sh,.8,0,Math.PI*2);sx.fill();}
    // 顶部标题
    sx.fillStyle='#0cf';sx.font='bold 14px monospace';sx.textAlign='center';
    sx.fillText('⭐ 星际风筝传说 '+GAME_VERSION+' ⭐',sw/2,22);
    // 分割线
    sx.strokeStyle='rgba(0,200,255,0.3)';sx.lineWidth=1;
    sx.beginPath();sx.moveTo(20,30);sx.lineTo(sw-20,30);sx.stroke();
    // 高度大字
    sx.fillStyle='#fff';sx.font='bold 36px monospace';sx.textAlign='center';
    sx.fillText(height+'m',sw/2,72);
    sx.fillStyle='rgba(255,255,255,0.5)';sx.font='11px monospace';
    sx.fillText('飞行高度',sw/2,88);
    // 三列数据
    const cols=[
      {label:'得分',val:score,color:'#ff0'},
      {label:'击杀',val:kills,color:'#f44'},
      {label:'最大连击',val:'×'+combo,color:'#0f8'},
    ];
    cols.forEach((c,i)=>{
      const cx=50+i*110;
      sx.fillStyle=c.color;sx.font='bold 16px monospace';sx.textAlign='center';
      sx.fillText(c.val,cx,120);
      sx.fillStyle='rgba(255,255,255,0.4)';sx.font='10px monospace';
      sx.fillText(c.label,cx,134);
    });
    // 底部版权
    sx.fillStyle='rgba(255,255,255,0.2)';sx.font='9px monospace';sx.textAlign='center';
    sx.fillText('kodecoffee.com/i/kitelegend',sw/2,158);
    // 绑定到 go-share 区域
    const shareEl=document.getElementById('go-share');
    shareEl.innerHTML='';
    sc.style.cssText='border-radius:8px;max-width:100%;border:1px solid rgba(0,200,255,0.3);cursor:pointer;display:block;margin:0 auto;';
    sc.title='点击下载截图，分享你的战绩！';
    sc.onclick=()=>{
      try{
        const link=document.createElement('a');
        link.download='kite-legend-'+Date.now()+'.png';
        link.href=sc.toDataURL('image/png');
        link.click();
      }catch(e){}
    };
    shareEl.appendChild(sc);
    const tip=document.createElement('div');
    tip.textContent='👆 点击图片保存并分享战绩';
    tip.style.cssText='font-size:10px;color:rgba(0,200,255,0.6);text-align:center;margin-top:4px;';
    shareEl.appendChild(tip);
    shareEl.style.display='block';
  }catch(e){document.getElementById('go-share').style.display='none';}
}

function saveDaily(){
  const today=new Date().toISOString().split('T')[0];
  dailyMissions.date=today;
  SAVE.set('daily',{date:today,missions:dailyMissions.missions});
}

function refreshMenu(){
  document.getElementById('menu-stats').innerHTML=
    `🏆 最高: ${recordHeight}m &nbsp;|&nbsp; 🪙 ${totalCoins} &nbsp;|&nbsp; 🎮 ${gamesPlayed}局`;
  renderSkinSelector();
  renderDifficultySelector();
}

// ==================== 难度选择器 ====================
function renderDifficultySelector(){
  const el=document.getElementById('difficulty-selector');
  el.innerHTML='';
  Object.entries(DIFFICULTIES).forEach(([key,d])=>{
    const btn=document.createElement('div');
    btn.className='diff-btn';
    if(key===currentDifficulty) btn.classList.add('active');
    btn.textContent=d.name;
    btn.title=d.desc;
    btn.style.setProperty('--dc',d.color);
    btn.style.setProperty('--ds',`rgba(${parseColor(d.color)},.5)`);
    btn.style.setProperty('--db',`rgba(${parseColor(d.color)},.1)`);
    btn.onclick=(e)=>{e.stopPropagation();currentDifficulty=key;diffCfg=DIFFICULTIES[key];SAVE.set('difficulty',key);renderDifficultySelector();};
    el.appendChild(btn);
  });
}

// ==================== 皮肤选择器 ====================
function renderSkinSelector(){
  const el=document.getElementById('skin-selector');
  el.innerHTML='';
  SKINS.forEach((s,i)=>{
    const btn=document.createElement('div');
    btn.className='skin-btn';
    if(i===currentSkin) btn.classList.add('active');
    const unlocked=isSkinUnlocked(i);
    if(!unlocked) btn.classList.add('locked');
    btn.innerHTML=`${s.icon}<span class="skin-lock">${unlocked?'':s.desc}</span>`;
    btn.title=s.name+(unlocked?' ✅':' 🔒 '+s.desc);
    if(unlocked){
      btn.onclick=(e)=>{e.stopPropagation();currentSkin=i;SAVE.set('skin',i);renderSkinSelector();};
    }
    el.appendChild(btn);
  });
}

// ==================== 排行榜 ====================
function getLeaderboard(){
  return SAVE.get('leaderboard',[]);
}
function addToLeaderboard(){
  const lb=getLeaderboard();
  lb.push({score,height:Math.floor(heightM),kills,date:new Date().toLocaleDateString()});
  lb.sort((a,b)=>b.score-a.score);
  const top10=lb.slice(0,10);
  SAVE.set('leaderboard',top10);
}

function showLeaderboard(){
  const lb=getLeaderboard();
  const tbody=document.getElementById('lb-tbody');
  if(lb.length===0){
    tbody.innerHTML='<tr><td colspan="5" class="lb-empty">暂无记录，快去飞行吧！</td></tr>';
  } else {
    let html='';
    lb.forEach((e,i)=>{
      const rc=i===0?'lb-rank-1':(i===1?'lb-rank-2':(i===2?'lb-rank-3':''));
      html+=`<tr>
        <td class="lb-rank ${rc}">#${i+1}</td>
        <td>${e.score}</td><td>${e.height}m</td><td>${e.kills}</td>
        <td>${e.date}</td></tr>`;
    });
    tbody.innerHTML=html;
  }
  document.getElementById('leaderboard-overlay').style.display='flex';
}
function closeLeaderboard(){
  document.getElementById('leaderboard-overlay').style.display='none';
}

// ==================== 主更新循环 ====================
function update(now){
  if(!gameRunning){
    if(deathSlowMo>0){deathSlowMo-=(now-lastTime)/1000;if(deathSlowMo<0)deathSlowMo=0;}
    if(deathTimer>0){deathTimer-=(now-lastTime)/1000;}
    return;
  }
  dt=Math.min((now-lastTime)/1000,.05);
  // v6.10: 【致命修复】NaN <= 0 是 false！所以 dt=NaN 时不会被修正，导致整个游戏崩溃
  if(!isFinite(dt) || dt<=0) dt=0.016;
  if(!isFinite(lastTime)) lastTime=now; // 修复 lastTime 变成 NaN 的连锁反应
  lastTime=now;frameCount++;gameTime+=dt;

  // FPS自适应降级：每15帧采样8个样本，缓和衰减+快速恢复
  if(frameCount%15===0&&dt>0.001){
    const fps=1/Math.max(dt,0.0001);
    _fpsSamples.push(fps);if(_fpsSamples.length>8)_fpsSamples.shift();
    const avgFps=_fpsSamples.reduce((a,b)=>a+b,0)/_fpsSamples.length;
    if(avgFps<25){_adaptMaxEB=Math.max(80,_adaptMaxEB-15);_adaptMaxP=Math.max(80,_adaptMaxP-20);}
    else if(avgFps>45){_adaptMaxEB=Math.min(200,_adaptMaxEB+20);_adaptMaxP=Math.min(300,_adaptMaxP+30);}
  }

  if(hitStop>0){hitStop-=dt;dt*=.1;}

  // Trauma²震屏衰减
  if(screenShakeTrauma>0){screenShakeTrauma*=Math.pow(.88,dt*60);if(screenShakeTrauma<.001)screenShakeTrauma=0;}
  // 受击红晕衰减
  if(damageVignette>0){damageVignette-=dt*1.2;if(damageVignette<0)damageVignette=0;}

  // v6.5.2: 处理帧级延迟子弹队列（替代setTimeout）
  if(_delayedBullets&&_delayedBullets.length>0){
    for(let di=_delayedBullets.length-1;di>=0;di--){
      const db=_delayedBullets[di];
      if(frameCount>=db.frame){
        // v6.10: 防御NaN坐标 — 如果tx/ty/x/y是NaN，跳过并删除
        if(!isFinite(db.tx)||!isFinite(db.ty)||!isFinite(db.x)||!isFinite(db.y)){
          console.warn('[_delayedBullets] 无效坐标，跳过');
          _delayedBullets.splice(di,1);
          continue;
        }
        const dx=db.tx-db.x,dy=db.ty-db.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
        enemyBullets.push({x:db.x,y:db.y,vx:dx/dist*db.speed,vy:dy/dist*db.speed,life:db.life,alive:true,bulletType:db.type,isSkill:true});
        _delayedBullets.splice(di,1);
      }
    }
  }
  // v6.5.2: 处理帧级延迟波形弹幕队列（替代setTimeout）
  if(_delayedWaves&&_delayedWaves.length>0){
    for(let wi=_delayedWaves.length-1;wi>=0;wi--){
      const dw=_delayedWaves[wi];
      if(frameCount>=dw.frame){
        // v6.10: 防御NaN坐标
        if(!isFinite(dw.x)||!isFinite(dw.y)||!isFinite(dw.count)){
          console.warn('[_delayedWaves] 无效坐标，跳过');
          _delayedWaves.splice(wi,1);
          continue;
        }
        for(let i=0;i<dw.count;i++){
          const a=i*Math.PI*2/dw.count+dw.layer*0.5;
          enemyBullets.push({x:dw.x,y:dw.y,vx:Math.cos(a)*160,vy:Math.sin(a)*120+100,life:3,alive:true,bulletType:'wave',wavePhase:dw.layer*1.2});
        }
        _delayedWaves.splice(wi,1);
      }
    }
  }

  // 星风暴更新
  updateStarStorm(dt);
  // 无人机更新
  updateDrones(dt);

  // 集中模式：游戏减速 + 玩家移速降低
  if(isFocus){
    dt*=0.5; // 时间减缓到50%
    player.focusMoveMult=0.5; // 移速减半
  } else {
    player.focusMoveMult=1;
  }

  heightM+=80*dt*gameSpeed;
  // gameSpeed 上限 8x，避免极高高度下每帧跨越数百米导致逻辑混乱
  gameSpeed=Math.min(8, diffCfg.speedMult+heightM/5000);
  // 剧情触发检查（每帧检查，但有触发冷却）
  if(frameCount%120===0) checkStoryTrigger(heightM);
  // 分区切换检测
  const curZ=getZone(heightM);
  if(curZ.theme!==lastZone){
    lastZone=curZ.theme;
    // 区域切换提示
    const zoneEnterTexts={
      corporate:'🟡 进入低轨道 — 职场废土',
      military:'🟠 进入平流层 — 军事禁区',
      alien:'🟣 进入太空边缘 — 外星遗迹',
      cosmic:'💗 进入深空 — 宇宙法则失效',
      void:'⬜ 进入虚空 — 超越理解的领域'
    };
    addScorePopup(W/2,H*.35,zoneEnterTexts[curZ.theme]||curZ.name,'#0ff',20);
    SFX.fever();
  }

  // 满级武器飞行距离
  const maxLvl=(WEAPON_TYPES[weaponType]?.levels.length||3);
  if(weaponLevel>=maxLvl&&weapon3Start===0) weapon3Start=heightM;
  if(weaponLevel>=maxLvl) weapon3Distance=heightM-weapon3Start;

  updateWeather(dt);

  // === 玩家更新 ===
  if(player.alive){
    const fmm=player.focusMoveMult||1;
    // 混乱状态：反转移动方向
    const cm=player.confused>0?-1:1;
    // v6.10: 防御NaN — 如果player坐标变成NaN，强制重置到屏幕中心
    if(!isFinite(player.x)) player.x=W/2;
    if(!isFinite(player.y)) player.y=H*.85;
    if(!isFinite(player.targetX)) player.targetX=W/2;
    if(!isFinite(player.targetY)) player.targetY=H*.85;
    player.x+=(player.targetX-player.x)*.1*fmm*cm;
    player.y+=(player.targetY-player.y)*.06*fmm*cm;
    player.x=Math.max(5,Math.min(W-5,player.x));
    player.y=Math.max(H*.05,Math.min(H*.95,player.y));
    // 挤压拉伸
    const spd=Math.abs(player.vx)/800;
    player.squashX=1+spd*.2;player.squashY=1-spd*.15;
    // 减速回弹
    player.vx*=.9;player.vy*=.9;

    if(player.invincible>0) player.invincible-=dt;
    if(player.shieldTimer>0) player.shieldTimer-=dt;
    if(player.damageFlash>0) player.damageFlash-=dt;
    if(player.confused>0) player.confused-=dt;
    if(player.score2xTimer>0) player.score2xTimer-=dt;
    if(player.magnetTimer>0) player.magnetTimer-=dt;
    if(player.bombAnim>0) player.bombAnim-=dt;

    player.shootTimer-=dt;
    if(player.shootTimer<=0){shoot(player);player.shootTimer=weaponType==='laser'?0.4:player.shootRate;}

    if(feverActive){
      feverTimer-=dt;
      if(feverTimer<=0){feverActive=false;feverGauge=0;}
      else{player.shootRate=.06;player.invincible=Math.max(player.invincible,.05);}
    } else {player.shootRate=.18;}

    // 粒子：只在总数<250时生成，降低频率
    if(particles.length<250&&Math.random()<.15){
      particles.push(new Particle(player.x+(Math.random()-.5)*16,player.y+24,0,140+Math.random()*80,.4,'#0cf',1+Math.random()));
    }
  }

  // === 粒子（原地清理，避免每帧创建新数组） ===
  const MAX_PARTICLES=_adaptMaxP;
  for(let i=particles.length-1;i>=0;i--){particles[i].update(dt);if(!particles[i].alive||i>=MAX_PARTICLES)particles.splice(i,1);}

  // === 得分飘字 ===
  scorePopups.forEach(s=>{s.y+=s.vy*dt;s.opacity-=.8*dt;if(s.opacity<0)s.opacity=0;});
  scorePopups=scorePopups.filter(s=>s.opacity>0);
  if(bossKillAnnounce.active){bossKillAnnounce.timer-=dt;if(bossKillAnnounce.timer<=0)bossKillAnnounce.active=false;}
  if(bossIntroAnnounce.active){bossIntroAnnounce.timer-=dt;if(bossIntroAnnounce.timer<=0)bossIntroAnnounce.active=false;}

  // === 成就弹窗 ===
  if(achievementPopupTimer>0){achievementPopupTimer-=dt;if(achievementPopupTimer<=0)showAchievement();}

  // === 子弹（原地清理） ===
  const MAX_PLAYER_BULLETS=100;
  for(let i=playerBullets.length-1;i>=0;i--){
    const b=playerBullets[i];
    if(b.type==='homing'){
        // v6.4: 追踪弹每4帧重算目标（原每帧遍历所有敌人=O(n×m)）
        b._trc=(b._trc||0)+1;
        if(b._trc>=4){
          b._trc=0;let nx=0,ny=-1,md=400;
          for(let j=enemies.length-1;j>=0;j--){const e=enemies[j];const dx=e.x-b.x,dy=e.y-b.y,d=Math.hypot(dx,dy);if(d<md){md=d;nx=dx/d;ny=dy/d;}}
          if(md<400){b._tnx=nx;b._tny=ny;}
        }
        if(b._tnx!==undefined){
          const tvx=b._tnx*b.speed,tvy=b._tny*b.speed,f=Math.min(1,b.turnRate*dt);
          b.vx+=(tvx-b.vx)*f;b.vy+=(tvy-b.vy)*f;
        }
      }
      b.x+=b.vx*dt;b.y+=b.vy*dt;
      if(b.type==='refract'&&b.bounces>0){
        // 折射弹：撞墙反弹
        let bounced=false;
        if(b.x<=10||b.x>=W-10){b.vx*=-1;b.bounces--;bounced=true;}
        if(b.y<=10||b.y>=H-10){b.vy*=-1;b.bounces--;bounced=true;}
        if(bounced) b.life=Math.max(b.life,1.2); // 反弹刷新生命
      }
    b.life-=dt;
    // v6.10: 防御NaN
    if(!isFinite(b.x)||!isFinite(b.y)||!isFinite(b.life)||b.y>H+30||b.y<-30||b.x<-30||b.x>W+30||b.life<=0||i>=MAX_PLAYER_BULLETS){playerBullets.splice(i,1);}
  }
  // 敌弹更新 + 擦弹检测 + 特殊行为（原地清理）
  const MAX_ENEMY_BULLETS=_adaptMaxEB;
  for(let i=enemyBullets.length-1;i>=0;i--){
    const b=enemyBullets[i];
    b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;
    // v6.4: 旋转动画（六边形/星形弹幕视觉旋转）
    if(b.bulletType==='orb'||b.bulletType==='explosive'){
      b._rot=(b._rot||0)+dt*(b.bulletType==='orb'?2.5:4);
    }
    // v6.10: 防御NaN — NaN子弹永远不满足删除条件，会无限堆积
    if(!isFinite(b.x)||!isFinite(b.y)||!isFinite(b.life)||b.y>H+30||b.y<-30||b.x<-30||b.x>W+30||b.life<=0||i>=MAX_ENEMY_BULLETS){
      // 爆炸弹死亡时散开
      if((b.bulletType==='explosive'||b.willSplit)&&b.life<=0&&b.y<H+30&&b.y>-30&&b.x<W+30&&b.x>-30){
        for(let j=0;j<6;j++){
          const a=j*Math.PI*2/6;
          if(enemyBullets.length<MAX_ENEMY_BULLETS) enemyBullets.push({x:b.x,y:b.y,vx:Math.cos(a)*120,vy:Math.sin(a)*60+80,life:2.5,alive:true,bulletType:'normal'});
        }
      }
      enemyBullets.splice(i,1);continue;
    }
    // 追踪弹：逐渐转向玩家（每2帧计算一次，减少sqrt开销）
    if(b.bulletType==='homing'&&player.alive&&!b._homingLocked&&(frameCount&1)===0){
      const hdx=player.x-b.x,hdy=player.y-b.y,hdist=Math.sqrt(hdx*hdx+hdy*hdy)||1;
      const turnRate=b.turnRate||3;
      const spd=Math.sqrt(b.vx*b.vx+b.vy*b.vy)||200;
      b.vx+=(hdx/hdist*spd-b.vx)*Math.min(1,turnRate*dt*3);
      b.vy+=(hdy/hdist*spd-b.vy)*Math.min(1,turnRate*dt*3);
      // 锁定超过2秒后不再追踪
      if(!b._homingLife) b._homingLife=0;
      b._homingLife+=dt*2;
      if(b._homingLife>2) b._homingLocked=true;
    }
    // 波形弹：初始化时记录基础速度，偶数帧叠加横向正弦偏移
    if(b.bulletType==='wave'&&!b._waveApplied){
      b._waveBaseAngle=Math.atan2(b.vy,b.vx);
      b._waveBaseSpd=Math.sqrt(b.vx*b.vx+b.vy*b.vy)||180;
      b._cosA=Math.cos(b._waveBaseAngle);b._sinA=Math.sin(b._waveBaseAngle);
      b._cosPerpA=Math.cos(b._waveBaseAngle+Math.PI/2);b._sinPerpA=Math.sin(b._waveBaseAngle+Math.PI/2);
      b._waveSpeed=b.waveSpeed||(2+Math.random()*3);
      b._wavePhase=b.wavePhase||Math.random()*Math.PI*2;
      b._waveApplied=true;
    }
    if(b.bulletType==='wave'&&b._waveApplied&&(frameCount&1)===0){
      // 用计数器替代life计算，避免maxLife依赖
      b._wt=(b._wt||0)+0.033;
      const offset=Math.sin(b._wt*b._waveSpeed*8+b._wavePhase)*18;
      b.vx=b._cosA*b._waveBaseSpd+b._cosPerpA*offset;
      b.vy=b._sinA*b._waveBaseSpd+b._sinPerpA*offset;
    }
    // 引力弹（orb类且带gravityTarget）— 每2帧算一次，大幅降低sqrt次数
    if(b.gravityTarget&&b.life>0.5&&(frameCount&1)===0){
      const gx=b.gravityTarget.x,gy=b.gravityTarget.y;
      const gdx=gx-b.x,gdy=gy-b.y,gdist=Math.sqrt(gdx*gdx+gdy*gdy)||1;
      if(gdist<280){
        const strength=gdist<60?-200:b.gravityTarget.strength*0.8;
        b.vx+=(gdx/gdist)*strength*dt*2; // ×2补偿隔帧计算
        b.vy+=(gdy/gdist)*strength*dt*2;
        const maxSpd=350;const curSpd=Math.sqrt(b.vx*b.vx+b.vy*b.vy);
        if(curSpd>maxSpd){b.vx=b.vx/curSpd*maxSpd;b.vy=b.vy/curSpd*maxSpd;}
      }
    }
    // 擦弹检测：子弹离玩家14-45px范围内算擦弹
    if(player.alive&&!b._grazed){
      const gdx=b.x-player.x, gdy=b.y-player.y;
      const gdist=Math.sqrt(gdx*gdx+gdy*gdy);
      if(gdist>14&&gdist<45){
        b._grazed=true;
        grazeCount++;
        starStormGauge=Math.min(100, starStormGauge+2.2);
      }
    }
  }
  // 注：分裂弹已在上方主循环中处理（willSplit在life<=0时爆炸），此处无需重复处理

  // === 道具（原地清理+收集） ===
  for(let i=items.length-1;i>=0;i--){
    const it=items[i];
    if(it.collecting){
      const dx=player.x-it.x,dy=player.y-it.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
      const spd=600+it.collectSpeed;
      it.x+=dx/dist*spd*dt;it.y+=dy/dist*spd*dt;
      it.collectSpeed+=200*dt;
    } else {it.y+=it.vy*dt;}
    it.lived+=dt;
    if(it.lived>it.maxLife||it.y>H+30){items.splice(i,1);continue;}
    // 收集检测
    const dx=it.x-player.x,dy=(it.y+(it.collecting?0:it.yoy))-player.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const range=player.magnetTimer>0?player.magnetRange:40;
    if(dist<range&&!it.collecting){
      if(range>40){it.collecting=true;it.collectSpeed=0;}
      if(dist<28){
        applyItem(it);
        items.splice(i,1);
        SFX.pickup();
      }
    }
  }

  // === 碰撞: 子弹 vs 敌机 ===
  for(let bi=playerBullets.length-1;bi>=0;bi--){
    const b=playerBullets[bi];
    if(b.type==='laser'){
      // 激光束 — 穿透路径上所有敌人
      let hitAny=false;
      for(let ei=enemies.length-1;ei>=0;ei--){
        const e=enemies[ei];
        // 敌人是否在激光束矩形范围内
        if(Math.abs(e.x-b.x)<e.w/2+b.w/2+2 && e.y> b.y-b.l && e.y<b.y+e.h/2){
          if(e.invulnerable>0){spawnParticles(e.x,e.y,1,'#a4f',30,.15,.5);continue;} // Boss无敌
          e.hp-=b.dmg*(weaponEvolved?1.5:1);e.flashTimer=.06;
          spawnParticles(e.x,e.y,2,'#f44',30,.15,1);
          hitAny=true;
          if(e.hp<=0){
            spawnParticles(e.x,e.y,25,e.color,120,.5,3);
            SFX.explode();
            screenShakeTrauma=Math.min(1,Math.max(screenShakeTrauma,e.type==='boss'?.7:(e.type==='large'?.3:.12)));
            hitStop=e.type==='boss'?.15:(e.type==='large'?.04:.02);
            addScorePopup(e.x,e.y-10,'+'+e.score,e.color,e.type==='boss'?22:(e.type==='large'?18:14));
            const mult=player.score2xTimer>0?2:1+(currentSkin===1?.1:0);
            const addScore=e.score*mult;
            score+=addScore;kills++;combo++;
            if(combo>maxCombo) maxCombo=combo;
            if(combo%5===0) SFX.combo(combo);
            dailyMissions.missions.forEach(m=>{if(m.type==='kills'&&!m.done)m.progress++;});
            feverGauge=Math.min(100,feverGauge+(e.type==='boss'?30:(e.type==='large'?15:5)));
            if(feverGauge>=100&&!feverActive){feverActive=true;feverTimer=3;feverCount++;spawnParticles(player.x,player.y,30,'#ff0',150,.6,3);SFX.fever();}
            if(e.type==='boss'){bossKills++;dailyMissions.missions.forEach(m=>{if(m.type==='boss'&&!m.done)m.progress++;});bossFight=null;
              const bossKillTexts=['⚡ BOSS 陨落！⚡','💀 甲方之王 倒下了','🔥 996 永恒帝 已被推翻','⚡ 需求黑洞 已关闭','💥 年终奖清零者 已清零','⚡ KPI终结者 已终结','🔥 无限需求体 已饱和','⚡ PUA大师 已下线'][Math.floor(Math.random()*8)];
              bossKillAnnounce={active:true,timer:2.5,text:bossKillTexts};spawnParticles(e.x,e.y,50,'#f00',200,.8,4);
              if(player.hp<player.maxHp){player.hp=Math.min(player.maxHp,player.hp+2);addScorePopup(e.x,e.y-30,'HP+2','#0f0',14);}
              dailyMissions.missions.forEach(m=>{if(m.type==='boss'&&!m.done)m.progress++;});
              // 按区域选专属击败台词
              const killZone=getZone(heightM);
              const killPool=STORY_DATA.bossKillByTheme[killZone.theme];
              const killStory=killPool&&killPool.length>0?killPool[Math.floor(Math.random()*killPool.length)]:STORY_DATA.bossKill;
              queueStory(killStory);
            }
            enemies.splice(ei,1);
          }
        }
      }
      if(hitAny) SFX.hit(80);
    } else {
      // 普通子弹 — AABB碰撞
      for(let ei=enemies.length-1;ei>=0;ei--){
        const e=enemies[ei];
        if(Math.abs(b.x-e.x)<e.w/2+4&&Math.abs(b.y-e.y)<e.h/2+4){
          if(e.invulnerable>0){spawnParticles(e.x,e.y,1,'#a4f',20,.1,.5);continue;} // Boss无敌
          e.hp-=(weaponEvolved?2:1);e.flashTimer=.06;
          playerBullets.splice(bi,1);
          spawnParticles(b.x,b.y,4,'#0ff',40,.2,1.5);
          SFX.hit(e.type==='boss'?150:(e.type==='large'?250:500));
          if(e.hp<=0){
          spawnParticles(e.x,e.y,25,e.color,120,.5,3);
          SFX.explode();
          screenShakeTrauma=Math.min(1,Math.max(screenShakeTrauma,e.type==='boss'?.7:(e.type==='large'?.3:.12)));
          hitStop=e.type==='boss'?.15:(e.type==='large'?.04:.02);
          addScorePopup(e.x,e.y-10,'+'+e.score,e.color,e.type==='boss'?22:(e.type==='large'?18:14));

          const mult=player.score2xTimer>0?2:1+(currentSkin===1?.1:0);
          const addScore=e.score*mult;
          score+=addScore;kills++;combo++;
          if(combo>maxCombo) maxCombo=combo;
          if(combo%5===0) SFX.combo(combo);
          dailyMissions.missions.forEach(m=>{if(m.type==='kills'&&!m.done)m.progress++;});

          feverGauge=Math.min(100,feverGauge+(e.type==='boss'?30:(e.type==='large'?15:5)));
          if(feverGauge>=100&&!feverActive){feverActive=true;feverTimer=3;feverCount++;spawnParticles(player.x,player.y,30,'#ff0',150,.6,3);SFX.fever();}

          if(e.type==='boss'){bossKills++;dailyMissions.missions.forEach(m=>{if(m.type==='boss'&&!m.done)m.progress++;});bossFight=null;
            // Boss击杀全屏特效
            const bossKillTexts=['⚡ BOSS 陨落！⚡','💀 甲方之王 倒下了','🔥 996 永恒帝 已被推翻','⚡ 需求黑洞 已关闭','💥 年终奖清零者 已清零','⚡ KPI终结者 已终结','🔥 无限需求体 已饱和','⚡ PUA大师 已下线'][Math.floor(Math.random()*8)];
            bossKillAnnounce={active:true,timer:2,text:bossKillTexts};
            // Boss击杀剧情 — 按区域选专属台词
            setTimeout(()=>{
              const killZone2=getZone(heightM);
              const killPool2=STORY_DATA.bossKillByTheme[killZone2.theme];
              const killStory2=killPool2&&killPool2.length>0?killPool2[Math.floor(Math.random()*killPool2.length)]:STORY_DATA.bossKill;
              queueStory(killStory2);
            },2200);
            spawnParticles(e.x,e.y,50,'#ff0',200,.8,4);spawnParticles(e.x,e.y,35,'#f44',160,.6,3);
            spawnParticles(e.x,e.y,20,'#fff',120,.5,2);
            screenShakeTrauma=.8;hitStop=.2;
            items.push(createItem(e.x,e.y,'weapon'));items.push(createItem(e.x-20,e.y,'bomb'));items.push(createItem(e.x+20,e.y,'star'));items.push(createItem(e.x,e.y-20,'shield'));items.push(createItem(e.x-10,e.y-10,'coin'));items.push(createItem(e.x+10,e.y-10,'coin'));
            // Boss必掉无人机
            if(drones.length<3) items.push(createItem(e.x,e.y+20,'drone'));
            // Boss 20%概率掉进化道具（第二关后）
            if(heightM>500&&!weaponEvolved&&Math.random()<.2) items.push(createItem(e.x,e.y-20,'evolve'));
          } else if(e.type==='large'){
            if(Math.random()<.7)items.push(createItem(e.x,e.y,Math.random()<.5?'weapon':'bomb'));
            if(Math.random()<.5)items.push(createItem(e.x+15,e.y,'coin'));
          } else if(e.type==='medium'){
            if(Math.random()<.4)items.push(createItem(e.x,e.y,Math.random()<.4?'star':'shield'));
            if(Math.random()<.3)items.push(createItem(e.x+10,e.y,'coin'));
          } else {
            if(Math.random()<.15)items.push(createItem(e.x,e.y,'coin'));
            if(Math.random()<.04)items.push(createItem(e.x,e.y,'star'));
          }
          enemies.splice(ei,1);
        }
        break;
      }
    }
  }
}

  // === 碰撞: 玩家 vs 敌机 ===
  if(player.alive){
    for(let ei=enemies.length-1;ei>=0;ei--){
      const e=enemies[ei];
      if(Math.abs(player.x-e.x)<e.w/2+18&&Math.abs(player.y-e.y)<e.h/2+18){
        if(player.invincible>0||player.shieldTimer>0){
          e.hp=0;spawnParticles(e.x,e.y,15,'#fff',100,.4,3);
          score+=e.score;kills++;addScorePopup(e.x,e.y-10,'+'+e.score,'#fff',16);
          feverGauge=Math.min(100,feverGauge+10);
          enemies.splice(ei,1);
        } else {
          // 扣血+无敌帧
          player.hp--;player.invincible=1.5;player.damageFlash=.15;
          screenShakeTrauma=.5;damageVignette=.35;
          spawnParticles(player.x,player.y,10,'#f44',80,.3,2);
          SFX.hit(200);
          if(player.hp<=0){gameOver('被击落了');return;}
        }
      }
    }
  }

  // === 碰撞: 玩家 vs 敌弹 ===
  if(player.alive&&player.invincible<=0){
    for(let bi=enemyBullets.length-1;bi>=0;bi--){
      const b=enemyBullets[bi];
      if(Math.abs(b.x-player.x)<14&&Math.abs(b.y-player.y)<18){
        // 扣血+无敌帧
        player.hp--;player.invincible=1.5;player.damageFlash=.15;
        screenShakeTrauma=.5;damageVignette=.35;
        spawnParticles(player.x,player.y,6,'#f44',60,.2,2);
        SFX.hit(250);
        enemyBullets.splice(bi,1);
        if(player.hp<=0){gameOver('被击中了');return;}
      }
    }
  }

  // === 敌机更新（原地清理+数量上限） ===
  // 动态上限：dScale越高，同屏怪物越少（保持视觉可读性和性能）
  const dScaleNow=getDynamicScale();
  const MAX_ENEMIES=dScaleNow>6?40:(dScaleNow>4?50:65);
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    e.y+=e.vy*dt;e.x+=e.vx*dt;
    if(e.x<20||e.x>W-20) e.vx*=-1;
    e.shootCooldown-=dt;
    if(e.telegraphTimer>0) e.telegraphTimer-=dt;
    if(e.invulnerable>0) e.invulnerable-=dt;
    
    // Boss阶段转换检测（v6.7: 零副作用版 —— 只改phase/color/invulnerable，不调用任何其他函数）
    if(e.type==='boss'&&!e._phaseChanging){
      try{
        const hpRatio=e.hp/e.maxHp;
        for(let ph=3;ph>=1;ph--){
          if(e.phase<ph&&hpRatio<=e.phaseThresholds[ph-1]){
            e.phase=ph;
            e._phaseChanging=true;
            e._phaseChangeTimer=0.3; // v6.7: 缩短到0.3秒
            e.invulnerable=0.3;
            // 只改颜色，不做其他任何事
            const phaseColors=['#f44','#f80','#f0f','#0ff'];
            e.strokeColor=phaseColors[ph]||'#f44';
            console.log(`[Boss] → Phase ${ph}, HP:${Math.round(hpRatio*100)}%`);
            break;
          }
        }
      }catch(err){
        console.error('[Boss Phase Error]',err);
        e._phaseChanging=false;
        if(!gameRunning){gameRunning=true;weaponUpgradeActive=false;}
      }
    }
    // 阶段转换计时器递减（替代setTimeout）
    if(e._phaseChanging && e._phaseChangeTimer>0){
      e._phaseChangeTimer-=dt;
      if(e._phaseChangeTimer<=0) e._phaseChanging=false;
    }
    
    // Boss战硬封顶：超过120颗敌弹时暂停发射+技能
    const ebHardCap=bossFight?90:(_adaptMaxEB*.85);
    if(e.shootCooldown<=0&&e.y>10&&e.y<H*.7){
      if(enemyBullets.length<ebHardCap) enemyShoot(e);
      e.shootCooldown=e.shootTimer*(.8+Math.random()*.4)*diffCfg.shootRateMult;
    }
    // Boss技能系统
    if(e.type==='boss'&&e.y>10){
      if(e.skillTimer>0) e.skillTimer-=dt;
      if(e.skillTimer<=0&&enemyBullets.length<ebHardCap*.75){
        const skills=BOSS_SKILLS[e.bossType]||BOSS_SKILLS['corporate'];
        if(skills&&skills.length>0){
          // 权重随机选技能
          const totalW=skills.reduce((s,sk)=>s+sk.weight,0);
          let r=Math.random()*totalW,wAcc=0,picked=skills[0];
          for(let si=0;si<skills.length;si++){wAcc+=skills[si].weight;if(r<=wAcc){picked=skills[si];break;}}
          picked.fn(e);
          e.skillTimer=picked.cooldown*(.7+Math.random()*.6);
          // 技能名提示
          if(picked.name&&e.y<H*.5){
            particles.push({x:e.x,y:e.y-30,vx:0,vy:-40,life:.8,size:12,color:'#ff0',text:picked.name,alive:true,type:'text'});
          }
        }
      }
    }
    
    // 仅移出屏幕外的敌人（不含Boss上限清理——改到循环后从头删）
    if(e.y>H+120){
      if(e.type==='boss'&&bossFight===e) bossFight=null;
      enemies.splice(i,1);
    }
  }
  // 超出上限时从头部删除最老的敌人（而非末尾的新敌人），保持换区时新区颜色敌人存活
  while(enemies.length>MAX_ENEMIES){
    let rmIdx=enemies.findIndex(e=>e.type!=='boss');
    if(rmIdx<0) break;
    if(enemies[rmIdx]===bossFight) bossFight=null;
    enemies.splice(rmIdx,1);
  }

  // === 生成敌机 ===
  waveTimer-=dt;
  if(waveTimer<=0){
    const dScale=getDynamicScale();
    // 动态敌机概率：随难度提高，大怪比例增加
    let smallP=diffCfg.enemyProbs[0];
    let medP=diffCfg.enemyProbs[1];
    let largeP=diffCfg.enemyProbs[2];
    if(dScale>1.5){
      const shift=Math.min(.2,(dScale-1)*.08);
      smallP=Math.max(.05,smallP-shift);
      medP=Math.min(.5,medP+shift*.4);
      largeP=Math.min(.7,largeP+shift*.4);
    }
    // Boss战期间减少但不停止敌机生成（减半）
    let count=getDynamicSpawnCount();
    if(bossFight) count=Math.ceil(count*.4);
    // 生成时也检查动态上限（避免瞬间超出）
    const spawnLimit=dScaleNow>6?40:(dScaleNow>4?50:65);
    if(enemies.length>=spawnLimit) count=0;
    else count=Math.min(count, spawnLimit-enemies.length);
    for(let i=0;i<count;i++){
      const r=Math.random();
      const type=r<smallP?'small':(r<smallP+medP?'medium':'large');
      enemies.push(createEnemy(type));
    }
    const smin=getDynamicSpawnMin();
    const smax=getDynamicSpawnMax();
    waveTimer=smin+Math.random()*(smax-smin);
    // 随 gameSpeed 缩短 spawn 间隔
    waveTimer=Math.max(.04,waveTimer/(1+gameSpeed*.08));
  }

  // === Boss生成 ===
  // 安全网：bossFight引用指向的对象不在敌人数组里时，清除引用
  if(bossFight && !enemies.includes(bossFight)) bossFight=null;
  if(heightM>=nextBossAt&&!bossFight){
    const boss=createEnemy('boss');
    boss.x=W/2;boss.y=-60;
    enemies.push(boss);bossFight=boss;
    SFX.bossWarning();
    // Boss出场台词含区域名
    const zone=getZone(heightM);
    const zoneName=zone.name;
    const introQuotes=[
      `⚠️ ${zoneName} — ${boss.title} 接近！`,
      `警告：${zoneName}检测到BOSS信号！`,
      `${zoneName}守卫者 — ${boss.name} 登场！`,
    ][Math.floor(Math.random()*3)];
    bossIntroAnnounce={active:true,timer:2.5,text:introQuotes,bossName:boss.name};
    // Boss战前剧情 — 用帧计时器延迟1.5秒（约90帧）替代setTimeout
    _bossStoryQueue={frame: frameCount+90, zone: zone, boss: boss};
    // Boss间隔：固定值，不随速度膨胀
    nextBossAt+=diffCfg.bossInterval+Math.random()*(diffCfg.bossInterval*.3);
    waveTimer=2;
  }

  // Boss飞出屏幕太远 → 安全清除（防止卡死）
  if(bossFight && bossFight.y>H+200){ bossFight=null; }

  // combo衰减
  if(frameCount%60===0&&combo>0) combo=Math.max(0,combo-1);

  // 每日任务检查
  dailyMissions.missions.forEach(m=>{
    if(!m.done){
      let v=0;
      if(m.type==='height')v=heightM;
      else if(m.type==='combo')v=maxCombo;
      else if(m.type==='score')v=score;
      else v=m.progress||0;
      if(v>=m.need){m.done=true;m.progress=m.need;addScorePopup(player.x,player.y-30,'✓ 任务完成!','#0f0',18);}
      else m.progress=v;
    }
  });

  // 道具掉落
  if(Math.random()<.003) items.push(createItem(Math.random()*W,-20,'coin'));
  // 武器道具：可升级同类型或切换新类型
  if(Math.random()<.0012 && weaponLevel<3){
    items.push(createItem(Math.random()*W,-20,'weapon',weaponType));
  }
  // 低频掉落随机武器类型（切换或重置）
  if(Math.random()<.0005){
    const types=Object.keys(WEAPON_TYPES).filter(t=>t!==weaponType);
    const newType=types[Math.floor(Math.random()*types.length)];
    items.push(createItem(Math.random()*W,-20,'weapon',newType));
  }
  
  // v6.5.3: Boss出场剧情延迟队列处理（替代setTimeout）
  if(_bossStoryQueue&&frameCount>=_bossStoryQueue.frame){
    try{
      const bs=_bossStoryQueue;
      const theme=bs.zone.theme;
      const prePool=STORY_DATA.bossPreByTheme[theme];
      if(prePool&&prePool.length>0){
        const picked=prePool[Math.floor(Math.random()*prePool.length)];
        queueStory(picked.lines||picked);
      } else {
        queueStory([{speaker:'任务指挥中心',text:`${bs.zone.name}区域 — Boss单位${bs.boss.name}出现！`,delay:0}]);
      }
    }catch(e){console.warn('[BossStory] 剧情播放出错:',e);}
    _bossStoryQueue=null;
  }

  // v6.8: 每帧推进story系统（帧驱动，替代setTimeout）
  updateStorySystem();
}

function applyItem(it){
  itemsCollected++;dailyMissions.missions.forEach(m=>{if(m.type==='coin'&&it.type==='coin'&&!m.done)m.progress++;if(m.type==='weapon'&&it.type==='weapon'&&!m.done)m.progress++;});
  spawnParticles(it.x,it.y,12,ITEM_COLORS[it.type],60,.4,2);
  const itemNames={
    weapon:['火力超频！','武器升级！','伤害提升！'][Math.floor(Math.random()*3)],
    bomb:['核弹装填！','清屏神器+1！','炸弹补给！'][Math.floor(Math.random()*3)],
    star:['星尘加持！','双倍得分！','幸运之星！'][Math.floor(Math.random()*3)],
    shield:['护盾充能！','无敌启动！','能量护盾！'][Math.floor(Math.random()*3)],
    coin:'',
    health:['维修机器人！','生命恢复！','HP+2！'][Math.floor(Math.random()*3)]
  };
  if(itemNames[it.type]) addScorePopup(it.x,it.y-5,itemNames[it.type],ITEM_COLORS[it.type],12);
  switch(it.type){
    case 'weapon':{
      // 显示武器升级选择界面
      showWeaponUpgrade();
      addScorePopup(it.x,it.y-5,'武器升级选择','#0ff',14);
    }break;
    case 'bomb':bombCount=Math.min(9,bombCount+1);break;
    case 'star':player.score2xTimer=5;break;
    case 'shield':player.shieldTimer=5;player.invincible=5;player.hp=Math.min(player.maxHp,player.hp+1);break;
    case 'coin':{const bns=currentSkin===3?75:50;totalCoins+=bns;score+=bns;addScorePopup(it.x,it.y,'+'+bns,'#FD0',13);}break;
    case 'health':player.hp=Math.min(player.maxHp,player.hp+2);addScorePopup(it.x,it.y,'+2HP','#0f0',14);break;
    case 'drone':addDrone();break;
    case 'evolve':{
      const maxLvl=(WEAPON_TYPES[weaponType]?.levels.length||3);
      if(weaponLevel>=maxLvl&&!weaponEvolved){
        weaponEvolved=true;
        addScorePopup(it.x,it.y-20,'🌌 武器进化！','#f0f',20);
        spawnParticles(it.x,it.y,30,'#f0f',120,.6,3);
        SFX.powerup&&SFX.powerup();
      } else if(weaponEvolved){
        addScorePopup(it.x,it.y,'已满进化','#888',14);
      } else {
        addScorePopup(it.x,it.y,'需先升满武器','#f80',14);
      }
    }break;
  }
}

// ==================== 渲染 ====================
function draw(offset){
  ctx.clearRect(0,0,W,H);

  // Trauma² 震屏
  let sx=0,sy=0;
  if(screenShakeTrauma>0){
    const mag=screenShakeTrauma*screenShakeTrauma*50;
    sx=(Math.random()-.5)*mag*2;
    sy=(Math.random()-.5)*mag*2;
  }
  if(deathSlowMo>0&&!gameRunning){
    const dm=deathSlowMo;
    sx=(Math.random()-.5)*dm*12;
    sy=(Math.random()-.5)*dm*12;
  }

  ctx.save();ctx.translate(sx,sy);

  drawBg(offset);
  drawWeather(offset);

  // 道具（屏幕外跳过）
  for(let i=0;i<items.length;i++){const it=items[i];if(it.y>-50&&it.y<H+50) drawItem(it);}

  // 敌机（屏幕外跳过）
  for(let i=0;i<enemies.length;i++){const e=enemies[i];if(e.y>-100&&e.y<H+100) drawEnemy(e);}

  // 敌弹（屏幕外跳过）
  for(let i=0;i<enemyBullets.length;i++){const b=enemyBullets[i];if(b.y>-50&&b.y<H+50) drawEnemyBullet(b);}

  // 玩家子弹（屏幕外跳过 - drawPlayerBullet内部已判断）
  for(let i=0;i<playerBullets.length;i++) drawPlayerBullet(playerBullets[i]);

  // 玩家
  if(player.alive) drawPlayer(player);
  if(deathSlowMo>0&&!player.alive) drawPlayer(player);
  // 无人机
  if(drones.length>0) drawDrones();

  // 粒子（v6.4: 批量渲染 — 按颜色分组，单次beginPath/fill，减少90%canvas调用）
  const _particleBatches=new Map();
  for(let i=0;i<particles.length;i++){
    const p=particles[i];
    if(p.y<-50||p.y>H+50||p.x<-50||p.x>W+50) continue;
    if(p.type==='text'){
      ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;
      ctx.font=`bold ${p.size}px sans-serif`;ctx.textAlign='center';
      ctx.fillText(p.text||'',p.x,p.y);
    } else {
      const key=p.color+'|'+Math.floor(p.alpha*10); // 同色同透明度合并
      let arr=_particleBatches.get(key);if(!arr){arr=[];_particleBatches.set(key,arr);}
      arr.push(p);
    }
  }
  // 批量绘制：每种颜色组合只需一次beginPath
  _particleBatches.forEach(arr=>{
    if(arr.length===0) return;
    ctx.globalAlpha=arr[0].alpha;ctx.fillStyle=arr[0].color;ctx.beginPath();
    for(let k=0;k<arr.length;k++){
      const p=arr[k],r=p.size*p.alpha;
      ctx.moveTo(p.x+r,p.y);ctx.arc(p.x,p.y,r,0,Math.PI*2);
    }
    ctx.fill();
  });
  _particleBatches.clear();
  ctx.globalAlpha=1;
  ctx.textAlign='left';

  // 得分飘字（v6.4: 用预计算颜色，避免每帧parseColor）
  scorePopups.forEach(s=>{
    ctx.fillStyle=s._rgba.replace(')',','+s.opacity+')');
    ctx.font=`bold ${s.size}px sans-serif`;
    ctx.textAlign='center';
    ctx.fillText(s.text,s.x,s.y);
    ctx.textAlign='left';
  });

  // Boss出场台词
  if(bossIntroAnnounce.active){
    const t=bossIntroAnnounce.timer;
    const alpha=Math.min(1,t/.3);
    ctx.save();
    ctx.globalAlpha=alpha;
    // 警告红底
    ctx.fillStyle='rgba(255,0,0,0.15)';ctx.fillRect(0,0,W,60);
    ctx.strokeStyle='rgba(255,60,0,0.5)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(0,60);ctx.lineTo(W,60);ctx.stroke();
    // 主标题
    ctx.fillStyle='#fff';ctx.font='bold 22px sans-serif';ctx.textAlign='center';
    ctx.shadowColor='#f00';ctx.shadowBlur=18;
    ctx.fillText(bossIntroAnnounce.text,W/2,28);
    ctx.shadowBlur=0;
    // Boss名字
    ctx.fillStyle='#ff0';ctx.font='bold 16px sans-serif';
    ctx.fillText(`—— ${bossIntroAnnounce.bossName} ——`,W/2,50);
    ctx.restore();
  }

  // Boss击杀全屏大字
  if(bossKillAnnounce.active){
    const t=bossKillAnnounce.timer;
    const alpha=Math.min(1,t/.3);
    const scale=1+(2-t)*.4; // 缩放动画
    ctx.save();
    ctx.globalAlpha=alpha;
    ctx.translate(W/2,H*.35);
    ctx.scale(scale,scale);
    // 光晕
    const glow=ctx.createRadialGradient(0,0,20,0,0,200);
    glow.addColorStop(0,'rgba(255,255,100,0.6)');glow.addColorStop(.5,'rgba(255,100,0,0.2)');glow.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=glow;ctx.fillRect(-250,-80,500,160);
    // 主文字
    ctx.fillStyle='#fff';ctx.font='bold 48px sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor='#f80';ctx.shadowBlur=30;
    ctx.fillText(bossKillAnnounce.text,0,0);
    ctx.shadowColor='#f00';ctx.shadowBlur=15;
    ctx.fillText(bossKillAnnounce.text,0,0);
    ctx.shadowBlur=0;
    // 副标题
    ctx.fillStyle='rgba(255,255,255,0.8)';ctx.font='bold 16px sans-serif';
    ctx.fillText('+2000 POINTS',0,36);
    ctx.restore();
    ctx.textAlign='left';
  }

  // 炸弹动画
  if(player.bombAnim>0){ctx.fillStyle=`rgba(255,255,255,${player.bombAnim*.6})`;ctx.fillRect(0,0,W,H);}

  ctx.restore();

  // === 受击红晕 + 低血量警示 ===
  if(gameRunning&&player.alive){
    const lowHp=player.hp<=player.maxHp*.25;
    const vignetteAlpha=Math.max(lowHp?.15:0,damageVignette*.7);
    if(vignetteAlpha>.001){
      const vg=ctx.createRadialGradient(W/2,H*.55,W*.1,W/2,H*.55,W*.8);
      vg.addColorStop(0,'rgba(255,0,0,0)');
      vg.addColorStop(.35,'rgba(255,0,0,0)');
      vg.addColorStop(.7,`rgba(180,0,0,${vignetteAlpha*.5})`);
      vg.addColorStop(1,`rgba(255,0,0,${vignetteAlpha})`);
      ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
      // 低血量脉冲
      if(lowHp&&Math.sin(frameCount*.2)>.4){
        ctx.fillStyle=`rgba(255,0,0,${.08+Math.sin(frameCount*.2)*.05})`;
        ctx.fillRect(0,0,W,H);
      }
    }
  }

  // === HUD（不受震屏影响） ===
  // 左侧面板
  const hudX=12;
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(hudX-2,8,110,192);
  ctx.strokeStyle='rgba(0,200,255,0.4)';ctx.lineWidth=1;ctx.strokeRect(hudX-2,8,110,192);
  ctx.fillStyle='#0cf';ctx.font='bold 11px sans-serif';ctx.textAlign='left';
  ctx.fillText('ALTITUDE',hudX+4,28);
  ctx.fillStyle='#fff';ctx.font='bold 26px monospace';ctx.fillText(Math.floor(heightM)+'m',hudX+4,54);
  // 区域名称
  const curZone=getZone(heightM);
  ctx.fillStyle=curZone.theme==='void'?'#fff':(curZone.theme==='cosmic'?'#f0f':(curZone.theme==='alien'?'#90f':(curZone.theme==='military'?'#f80':'#0cf')));
  ctx.font='bold 10px sans-serif';ctx.fillText(curZone.name,hudX+4,66);
  ctx.fillStyle='#0cf';ctx.font='bold 11px sans-serif';ctx.fillText('SCORE',hudX+4,80);
  ctx.fillStyle='#ff0';ctx.font='bold 22px monospace';ctx.fillText(Math.floor(score),hudX+4,102);
  ctx.fillStyle='#0cf';ctx.font='bold 11px sans-serif';ctx.fillText('WEAPON',hudX+4,122);
  const wt=WEAPON_TYPES[weaponType];
  ctx.fillStyle=wt?wt.color:'#0ff';ctx.font='bold 12px monospace';
  const evoTag=weaponEvolved?' 🌌EVO':'';
  ctx.fillText((wt?wt.icon+' ':'')+(wt?wt.name:'')+' LV'+weaponLevel+evoTag,hudX+4,144);
  ctx.fillStyle='#0cf';ctx.font='bold 11px sans-serif';ctx.fillText('BOMB',hudX+4,162);
  for(let i=0;i<Math.min(bombCount,9);i++){
    ctx.fillStyle='#ff0';ctx.fillRect(hudX+4+i*10,150,8,14);
    ctx.strokeStyle='#880';ctx.lineWidth=.5;ctx.strokeRect(hudX+4+i*10,150,8,14);
  }
  // 玩家HP条 — v6.2: 加大加亮
  const hpBarW=90,hpBarH=12,hpy=174;
  ctx.fillStyle='#fff';ctx.font='bold 13px sans-serif';ctx.fillText('❤️ HP '+player.hp+'/'+player.maxHp,hudX+4,hpy-2);
  ctx.fillStyle='rgba(40,0,0,0.7)';ctx.fillRect(hudX+4,hpy+2,hpBarW,hpBarH);
  const hpPct=player.hp/player.maxHp;
  ctx.fillStyle=hpPct>.5?'#f44':(hpPct>.25?'#f80':'#f00');
  if(hpPct<=.25&&Math.sin(frameCount*.5)>0) ctx.fillStyle='#ff0'; // 低血量闪烁
  ctx.fillRect(hudX+4,hpy+2,hpBarW*hpPct,hpBarH);
  // 血量分格线
  for(let i=1;i<player.maxHp;i++){ctx.strokeStyle='rgba(0,0,0,0.3)';ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(hudX+4+i*(hpBarW/player.maxHp),hpy+2);ctx.lineTo(hudX+4+i*(hpBarW/player.maxHp),hpy+2+hpBarH);ctx.stroke();}
  ctx.strokeStyle='rgba(255,100,100,0.6)';ctx.lineWidth=1.5;ctx.strokeRect(hudX+4,hpy+2,hpBarW,hpBarH);
  // 星风暴能量槽（下移）
  ctx.fillStyle='#0cf';ctx.font='bold 11px sans-serif';ctx.fillText('STORRM',hudX+4,204);
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(hudX+4,208,90,8);
  const sgPct=starStormGauge/100;
  const sgGrad=ctx.createLinearGradient(hudX+4,0,hudX+4+90*sgPct,0);
  sgGrad.addColorStop(0,'#0cf');sgGrad.addColorStop(1,sgPct>=1?'#0ff':'#086');
  ctx.fillStyle=sgGrad;ctx.fillRect(hudX+4,208,90*sgPct,8);
  if(starStormGauge>=100){
    ctx.fillStyle='#0ff';ctx.font='bold 10px monospace';ctx.textAlign='center';
    ctx.shadowColor='#0ff';ctx.shadowBlur=8;
    ctx.fillText('⭐ READY!',hudX+50,224);
    ctx.shadowBlur=0;
  } else {
    ctx.fillStyle='rgba(0,200,255,0.4)';ctx.font='9px monospace';ctx.textAlign='center';
    ctx.fillText(Math.floor(starStormGauge)+'%',hudX+50,224);
  }
  ctx.textAlign='left';

  // Fever进度
  if(feverGauge>0||feverActive){
    const barX=W-28,barH=H*.4,barY=H*.2;
    ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(barX-2,barY-2,18,barH+4);
    ctx.strokeStyle='rgba(255,200,0,0.4)';ctx.strokeRect(barX-2,barY-2,18,barH+4);
    const fillH=feverActive?barH:(feverGauge/100*barH);
    const fGrad=ctx.createLinearGradient(0,barY+barH,0,barY);
    fGrad.addColorStop(0,'#f80');fGrad.addColorStop(.5,'#ff0');fGrad.addColorStop(1,'#fff');
    ctx.fillStyle=fGrad;ctx.fillRect(barX,barY+barH-fillH,14,fillH);
    if(feverActive){
      ctx.fillStyle='#ff0';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('FEVER',barX+7,barY-10);
      ctx.fillStyle=`rgba(255,255,0,${.3+Math.sin(frameCount*.3)*.2})`;ctx.fillRect(barX-4,barY-4,22,barH+8);
    }
    ctx.textAlign='left';
  }

  // Boss血条 (屏幕顶部居中)
  if(bossFight&&bossFight.hp>0){
    const bw=Math.min(300,W*.6),bh=12,bx=(W-bw)/2,by=8;
    ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(bx-1,by-1,bw+2,bh+2);
    ctx.strokeStyle='rgba(255,0,0,0.6)';ctx.lineWidth=1;ctx.strokeRect(bx-1,by-1,bw+2,bh+2);
    const hpR=bossFight.hp/bossFight.maxHp;
    const hpGrad=ctx.createLinearGradient(bx,0,bx+bw,0);
    hpGrad.addColorStop(0,'#f00');hpGrad.addColorStop(.5,'#f44');hpGrad.addColorStop(1,'#f00');
    ctx.fillStyle=hpR>.5?hpGrad:'#f00';
    if(hpR<=.3&&Math.sin(frameCount*.3)>0) ctx.fillStyle='#ff0';
    ctx.fillRect(bx,by,bw*hpR,bh);
    ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
    ctx.fillText(`BOSS ${Math.floor(hpR*100)}%`,W/2,by+11);
    ctx.textAlign='left';
  }

  // 进度条 (底部)
  const pbY=H-8,pbW=W*.5,pbX=(W-pbW)/2;
  const progressToBoss=heightM%500/500;
  ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(pbX-1,pbY-1,pbW+2,6);
  ctx.strokeStyle='rgba(0,200,255,0.2)';ctx.strokeRect(pbX-1,pbY-1,pbW+2,6);
  ctx.fillStyle='#0cf';ctx.fillRect(pbX,pbY,pbW*progressToBoss,4);
  ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font='9px sans-serif';ctx.textAlign='center';
  ctx.fillText('BOSS: '+Math.floor(nextBossAt-heightM)+'m',W/2,pbY-4);
  ctx.textAlign='left';

  // 道具状态
  if(player.score2xTimer>0){ctx.fillStyle='#ff0';ctx.font='12px sans-serif';ctx.textAlign='right';ctx.fillText('⭐x2 '+player.score2xTimer.toFixed(1)+'s',W-20,30);}
  if(player.shieldTimer>0){ctx.fillStyle='#0f0';ctx.font='12px sans-serif';ctx.textAlign='right';ctx.fillText('🛡️ '+player.shieldTimer.toFixed(1)+'s',W-20,48);}
  if(player.magnetTimer>0){ctx.fillStyle='#FD0';ctx.font='12px sans-serif';ctx.textAlign='right';ctx.fillText('🧲 '+player.magnetTimer.toFixed(1)+'s',W-20,66);}
  ctx.textAlign='left';

  // Combo 显示
  if(combo>=3){
    const sz=18+Math.min(combo,30);
    const ca=Math.min(1,combo/15);
    ctx.fillStyle=`rgba(255,200,0,${ca})`;ctx.font=`bold ${sz}px sans-serif`;ctx.textAlign='center';
    ctx.fillText(`${combo} COMBO!`,W/2,combo>=10?80:68);
    if(combo>=10){
      ctx.fillStyle=`rgba(255,150,0,${ca*.6})`;
      ctx.font=`bold ${sz+4}px sans-serif`;
      ctx.fillText(`${combo} COMBO!`,W/2+1,combo>=10?81:69);
    }
    ctx.textAlign='left';
  }

  // 天气
  if(weather.type!=='clear'){
    ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font='11px sans-serif';ctx.textAlign='right';
    ctx.fillText({rain:'🌧️ 暴风雨',rainbow:'🌈 彩虹',meteor:'🌠 流星雨'}[weather.type]||'',W-20,18);
    ctx.textAlign='left';
  }

  // 连击条(Combo进度)
  if(combo>=5){
    ctx.fillStyle='rgba(0,0,0,0.4)';ctx.fillRect(W/2-40,H-30,80,3);
    ctx.fillStyle='#f80';ctx.fillRect(W/2-40,H-30,80*Math.min(1,combo/20),3);
  }

  // 皮肤名称
  ctx.fillStyle='rgba(255,255,255,0.25)';ctx.font='9px sans-serif';ctx.textAlign='center';
  ctx.fillText(SKINS[currentSkin].name+' | '+diffCfg.name+'难度',W/2,H-15);
  ctx.textAlign='left';
}

// ==================== 循环 ====================
function gameLoop(now){
  try {
    if(!lastTime) lastTime=now;
    if(gameRunning||deathSlowMo>0) {
      update(now);
      // v6.7: 帧指纹（加入bossHp）检测画面是否真的在变化
      const bossHp=bossFight?Math.floor(bossFight.hp):0;
      const fp=enemies.length*1000+enemyBullets.length*100+playerBullets.length*10+Math.floor(score)+bossHp;
      if(fp===_lastWatchdogFingerprint){
        _watchdogTimer++;
      } else {
        _watchdogTimer=0; _lastWatchdogFingerprint=fp;
      }
      // v6.10: 画面静止 → 强制恢复（安全优先）
      // 取消storyActive豁免 — 正常story播放时画面会变化，指纹不会相同
      // 如果dt变成NaN导致画面静止+story卡住，看门狗必须能触发
      if(_watchdogTimer>WATCHDOG_MAX && gameRunning){
        _watchdogRecoveryCount++;
        console.warn(`[Watchdog v6.10] #${_watchdogRecoveryCount} 静止恢复! e=${enemies.length} eb=${enemyBullets.length} wuActive=${weaponUpgradeActive} storyActive=${storyActive}`);
        // 如果story卡住了，强制关闭
        if(storyActive){
          console.warn('[Watchdog] story系统卡住，强制关闭');
          storyActive=false;_storyCurrent=null;_storyPending=[];
          try{const b=document.getElementById('story-box');if(b)b.classList.remove('show');}catch(_){}
        }
        enemies.forEach(e=>{e._phaseChanging=false;e._phaseChangeTimer=0;e.invulnerable=0;});
        if(enemyBullets.length>150) enemyBullets.splice(0,enemyBullets.length-150);
        _watchdogTimer=0;
        waveTimer=0.1;
        // 如果武器升级面板超过60帧没关（理论上有15s超时不可能），强制关闭
        if(weaponUpgradeActive && _wuTimeout===null){
          console.warn('[Watchdog] 武器升级面板异常，强制关闭');
          _closeWeaponUpgrade(null);
        }
      }
    } else {
      _watchdogTimer++;
      // v6.10: gameRunning=false时冻结恢复
      // 取消storyActive豁免 — dt=NaN时gameRunning可能还是true（如果异常在update之后发生）
      // 或者如果gameRunning被意外设为false，但story卡住了
      const goEl=document.getElementById('gameover');
      const menuEl=document.getElementById('menu');
      const isNormalStop=(goEl&&goEl.style.display.match(/flex|block/))
                     ||(menuEl&&menuEl.style.display.match(/flex|block/));
      if(_watchdogTimer>WATCHDOG_MAX && !isNormalStop){
        _watchdogRecoveryCount++;
        console.warn(`[Watchdog v6.10] #${_watchdogRecoveryCount} 冻结恢复! running=${gameRunning}`);
        gameRunning=true;
        weaponUpgradeActive=false;
        if(_wuTimeout){clearTimeout(_wuTimeout);_wuTimeout=null;}
        const wuEl=document.getElementById('weapon-upgrade');
        if(wuEl) wuEl.style.display='none';
        // 强制关闭story
        storyActive=false;_storyCurrent=null;_storyPending=[];
        try{const b=document.getElementById('story-box');if(b)b.classList.remove('show');}catch(_){}
        _watchdogTimer=0;
        enemies.forEach(e=>{e._phaseChanging=false;e._phaseChangeTimer=0;e.invulnerable=0;});
        if(enemyBullets.length>150) enemyBullets.splice(0,enemyBullets.length-150);
        waveTimer=0.1;
      }
    }
    draw(heightM);
  } catch(e) {
    console.error('Game loop error:', e);
    // v6.5.3: 严重错误时尝试恢复，不要让游戏静默死亡
    if(!gameRunning && !player.alive) return; // 正常gameOver状态
    if(!gameRunning) { console.warn('[GameLoop] 错误导致暂停，自动恢复'); gameRunning=true; weaponUpgradeActive=false; }
  }
  requestAnimationFrame(gameLoop);
}

// ==================== 输入 ====================
let isTouching=false,touchId=null,shooting=false;

canvas.addEventListener('touchstart',e=>{
  e.preventDefault();
  if(!gameRunning) return;
  const t=e.changedTouches[0];
  touchId=t.identifier;
  player.targetX=t.clientX*(W/canvas.offsetWidth);
  player.targetY=t.clientY*(H/canvas.offsetHeight);
  isTouching=true;shooting=true;
},{passive:false});

canvas.addEventListener('touchmove',e=>{
  e.preventDefault();
  if(!gameRunning) return;
  for(let t of e.changedTouches){
    if(t.identifier===touchId){
      player.targetX=t.clientX*(W/canvas.offsetWidth);
      player.targetY=t.clientY*(H/canvas.offsetHeight);
      if(Math.abs(t.clientX-player.x)>5||Math.abs(t.clientY-player.y)>5){
        player.vx=(player.targetX-player.x)*8;
        player.vy=(player.targetY-player.y)*4;
      }
    }
  }
},{passive:false});

canvas.addEventListener('touchend',e=>{
  e.preventDefault();
  for(let t of e.changedTouches){if(t.identifier===touchId){isTouching=false;shooting=false;touchId=null;}}
},{passive:false});

canvas.addEventListener('mousedown',e=>{
  if(!gameRunning) return;
  player.targetX=e.offsetX*(W/canvas.offsetWidth);player.targetY=e.offsetY*(H/canvas.offsetHeight);shooting=true;
});
canvas.addEventListener('mousemove',e=>{
  if(!gameRunning||!shooting) return;
  player.targetX=e.offsetX*(W/canvas.offsetWidth);player.targetY=e.offsetY*(H/canvas.offsetHeight);
});
canvas.addEventListener('mouseup',()=>{shooting=false;});

window.addEventListener('keydown',e=>{
  if(!gameRunning) return;
  switch(e.key){
    case 'ArrowLeft':player.targetX-=30;break;
    case 'ArrowRight':player.targetX+=30;break;
    case 'ArrowUp':player.targetY-=20;break;
    case 'ArrowDown':player.targetY+=20;break;
    case ' ':e.preventDefault();shooting=true;break;
    case 'b':case 'B':useBomb();break;
    case 'e':case 'E':activateStarStorm();break;
    case 'Shift':isFocus=true;break;
  }
});
window.addEventListener('keyup',e=>{
  if(e.key===' ')shooting=false;
  if(e.key==='Shift')isFocus=false;
});

// ==================== 游戏控制 ====================
function startGame(){
  initAudio();startBGM();
  diffCfg = DIFFICULTIES[currentDifficulty];
  player=createPlayer();
  player.hp=diffCfg.hp;player.maxHp=diffCfg.hp;
  enemies=[];playerBullets=[];enemyBullets=[];items=[];particles=[];
  _delayedBullets=[];_delayedWaves=[]; // v6.5.2: 重置延迟队列
  _bossStoryQueue=null; // v6.5.3: 重置Boss剧情队列
  _watchdogTimer=0; _lastWatchdogFingerprint=0; // v6.6.1: 重置看门狗
  _fpsSamples=[];_adaptMaxEB=200;_adaptMaxP=300; // v6.0: 每局重置FPS自适应
  scorePopups=[];
  // v6.5.2: 重置遗漏的状态变量
  bossKills=0;grazeCount=0;starStormGauge=0;starStormActive=false;starStormTimer=0;
  drones=[];weaponUpgradeActive=false;
  if(_wuTimeout){clearTimeout(_wuTimeout);_wuTimeout=null;} // v6.9: 清除武器升级超时
  const wuPanel=document.getElementById('weapon-upgrade');
  if(wuPanel) wuPanel.style.display='none'; // 确保面板隐藏
  bossKillAnnounce={active:false,timer:0,text:''};
  bossIntroAnnounce={active:false,timer:0,text:'',bossName:''}; // v6.5.2: 重置Boss出场通告
  score=0;heightM=0;combo=0;maxCombo=0;kills=0;
  screenShakeTrauma=0;hitStop=0;damageVignette=0;
  feverGauge=0;feverActive=false;feverTimer=0;feverCount=0;
  bombCount=diffCfg.startBombs;weaponLevel=1;weaponType='spread';weaponEvolved=false;
  bossFight=null;waveTimer=.3;nextBossAt=diffCfg.bossInterval;
  gameSpeed=diffCfg.speedMult;frameCount=0;gameTime=0;
  itemsCollected=0;deathSlowMo=0;deathTimer=0;
  weapon3Start=0;weapon3Distance=0;
  maxDronesThisGame=0;
  weather={type:'clear',timer:15};dailyMissions=getDailyMissions();
  lastZone='corporate';

  initBg();
  document.getElementById('menu').style.display='none';
  document.getElementById('gameover').style.display='none';
  achievementQueue=[];achievementPopupTimer=0;
  document.getElementById('achievement-popup').classList.remove('show');
  gameRunning=true;
  lastTime=performance.now();
  storyTriggered.clear(); // 重置剧情触发记录
  // v6.8: 重置帧驱动story系统
  _storyPending=[];_storyCurrent=null;_storyFrameTimer=0;storyActive=false;
  try{const b=document.getElementById('story-box');if(b)b.classList.remove('show');}catch(_){}

  // 开场剧情（v6.8: 直接用queueStory，无需外层setTimeout）
  queueStory(STORY_DATA.start);

  // 教程
  if(!hasPlayedTutorial){
    document.getElementById('tutorial').style.display='flex';
    hasPlayedTutorial=true;SAVE.set('tutorial',true);
  }
}

function closeTutorial(){
  document.getElementById('tutorial').style.display='none';
}

function backToMenu(){
  gameRunning=false;deathSlowMo=0;
  weaponUpgradeActive=false;
  if(_wuTimeout){clearTimeout(_wuTimeout);_wuTimeout=null;} // v6.9: 清除武器升级超时
  const wuPanel=document.getElementById('weapon-upgrade');
  if(wuPanel) wuPanel.style.display='none';
  // v6.8: 清理story系统
  _storyPending=[];_storyCurrent=null;_storyFrameTimer=0;storyActive=false;
  try{const b=document.getElementById('story-box');if(b)b.classList.remove('show');}catch(_){}
  document.getElementById('gameover').style.display='none';
  document.getElementById('menu').style.display='flex';
  refreshMenu();
}

// ==================== 辅助函数 ====================
function parseColor(c){
  const w={
    '#f44':'255,68,68','#f84':'255,136,68','#f22':'255,34,34','#f00':'255,0,0',
    '#0ff':'0,255,255','#ff0':'255,255,0','#0f0':'0,255,0','#FD0':'255,221,0',
    '#f0f':'255,0,255','#fff':'255,255,255','#0cf':'0,204,255','#f80':'255,136,0',
    '#f55':'255,85,85','#f60':'255,102,0','#90f':'153,0,255','#80f':'128,0,255',
    '#a0f':'170,0,255','#c0f':'204,0,255','#d0f':'221,0,255','#fa6':'255,170,102',
    '#ccc':'204,204,204','#aaa':'170,170,170','#ddd':'221,221,221','#eee':'238,238,238',
    '#888':'136,136,136','#444':'68,68,68','#f8f':'255,136,255'
  };
  if(w[c]) return w[c];
  // 通用 hex 转换
  if(c&&c.length===4){ // #RGB
    return parseInt(c[1]+c[1],16)+','+parseInt(c[2]+c[2],16)+','+parseInt(c[3]+c[3],16);
  }
  if(c&&c.length===7){ // #RRGGBB
    return parseInt(c.substring(1,3),16)+','+parseInt(c.substring(3,5),16)+','+parseInt(c.substring(5,7),16);
  }
  return '255,255,255';
}

// ==================== 初始化 ====================
// 初始化空数组/对象，避免 draw(0) 时崩溃
player = createPlayer(); player.alive = false;
enemies = []; playerBullets = []; enemyBullets = []; items = []; particles = [];
initBg();
refreshMenu();
renderSkinSelector();

const menuBg=document.getElementById('menu-bg');
for(let i=0;i<30;i++){
  const p=document.createElement('div');
  p.className='menu-particle';
  p.style.left=Math.random()*100+'%';
  p.style.animationDelay=Math.random()*4+'s';
  p.style.animationDuration=(3+Math.random()*4)+'s';
  p.style.background=['#0ff','#08f','#0f8','#f0f','#ff0','#fff'][Math.floor(Math.random()*6)];
  menuBg.appendChild(p);
}

draw(0);
window.addEventListener('resize',()=>{resize();initBg();});

// 版本号显示
document.getElementById('menu-version').textContent = GAME_VERSION + ' · ' + BUILD_DATE;

console.log('🌌 星际风筝传说 ' + GAME_VERSION + ' — 光束觉醒');
console.log('  v5.3: 实体上限 · 原地清理 · 去ShadowBlur · Boss弹幕缩减 · 屏幕外裁剪');
console.log('  v5.2: 连击音效升级 · Boss专属台词 · 15个成就 · 死亡分享截图卡');
console.log('  性能: 粒子MAX300 · 敌弹MAX200 · 玩家弹MAX100 · 敌机MAX60 · 发射拦截');
console.log('  ☕ 支持作者: https://kodecoffee.com/i/kitelegend');
// 预加载第一帧
requestAnimationFrame(gameLoop);

// ==================== 武器升级选择系统 ====================
let weaponUpgradeActive=false;
const WEAPON_UPGRADE_OPTIONS=[
  {type:'upgrade',weight:4,desc:'升级当前武器到下一等级',icon:'⬆️',getCfg(){
    const wt=WEAPON_TYPES[weaponType];
    if(!wt||weaponLevel>=wt.levels.length) return null;
    return {name:'升级 '+wt.name+' → LV'+(weaponLevel+1),desc:'提升'+wt.name+'的威力',icon:wt.icon,color:wt.color,action:()=>{weaponLevel++;addScorePopup(W/2,H*.4,'⬆️ '+wt.name+' LV'+(weaponLevel),wt.color,20);}};
  }},
  {type:'switch',weight:3,desc:'切换为其他武器类型',icon:'🔄',getCfg(){
    const keys=Object.keys(WEAPON_TYPES).filter(k=>k!==weaponType);
    if(keys.length===0) return null;
    const k=keys[Math.floor(Math.random()*keys.length)];
    const wt=WEAPON_TYPES[k];
    return {name:'切换: '+wt.name,desc:wt.desc+'（从LV1开始）',icon:wt.icon,color:wt.color,action:()=>{weaponType=k;weaponLevel=1;addScorePopup(W/2,H*.4,'🔄 '+wt.name,wt.color,20);}};
  }},
  {type:'special',weight:2,desc:'获得特殊能力',icon:'⚡',getCfg(){
    const specs=[
      {name:'+1 炸弹',desc:'炸弹数量+1',icon:'💣',action:()=>{bombCount=Math.min(9,bombCount+1);addScorePopup(W/2,H*.4,'💣 炸弹+1','#f80',20);}},
      {name:'+1 最大HP',desc:'最大生命值+1',icon:'❤️',action:()=>{player.maxHp++;player.hp=Math.min(player.maxHp,player.hp+1);addScorePopup(W/2,H*.4,'❤️ HP+1','#f44',20);}},
      {name:'进化武器',desc:'武器进化（需满级）',icon:'🌌',action:()=>{if(weaponLevel>=WEAPON_TYPES[weaponType].levels.length&&!weaponEvolved){weaponEvolved=true;addScorePopup(W/2,H*.4,'🌌 武器进化！','#f0f',22);}else{addScorePopup(W/2,H*.4,'需先升满武器','#888',16);}}},
      {name:'磁铁延长',desc:'磁铁持续时间+3秒',icon:'🧲',action:()=>{player.magnetTimer=Math.min(15,player.magnetTimer+3);addScorePopup(W/2,H*.4,'🧲 磁铁+3s','#FD0',20);}},
      {name:'护盾延长',desc:'护盾持续时间+3秒',icon:'🛡️',action:()=>{player.shieldTimer=Math.min(15,player.shieldTimer+3);addScorePopup(W/2,H*.4,'🛡️ 护盾+3s','#0cf',20);}}
    ];
    return specs[Math.floor(Math.random()*specs.length)];
  }}
];

// v6.9: 武器升级超时计时器（绝对安全保险）
let _wuTimeout=null;

function _closeWeaponUpgrade(chosenOpt){
  // 清超时
  if(_wuTimeout){clearTimeout(_wuTimeout);_wuTimeout=null;}
  const panel=document.getElementById('weapon-upgrade');
  if(panel) panel.style.display='none';
  weaponUpgradeActive=false;
  // 恢复玩家无敌状态
  if(player) player.invincible=Math.max(player.invincible||0,0);
  // 执行选项动作
  if(chosenOpt){
    try{chosenOpt.action();}catch(e){console.error('[WeaponUpgrade] action出错:',e);}
  }
  console.log('[WeaponUpgrade] 关闭，gameRunning=',gameRunning);
}

function showWeaponUpgrade(){
  if(weaponUpgradeActive) return;

  // 先检查DOM元素是否存在
  const panel=document.getElementById('weapon-upgrade');
  const optionsEl=document.getElementById('wu-options');
  if(!panel||!optionsEl){
    // fallback: 直接升级武器等级，游戏不暂停
    console.warn('[WeaponUpgrade] DOM不存在，直接升级');
    const wt=WEAPON_TYPES[weaponType];
    if(wt&&weaponLevel<wt.levels.length){
      weaponLevel++;
      addScorePopup(player.x,player.y-20,'⬆️ '+wt.name+' LV'+weaponLevel,wt.color,18);
    }else{
      bombCount=Math.min(9,bombCount+1);
      addScorePopup(player.x,player.y-20,'💣 炸弹+1','#f80',18);
    }
    return;
  }

  weaponUpgradeActive=true;
  // v6.9: 【核心改动】游戏继续运行！不再设 gameRunning=false
  // 武器升级期间玩家进入无敌模式（被Boss弹打不死），游戏照常运行
  if(player) player.invincible=Math.max(player.invincible||0, 12); // 12秒无敌

  try{
    optionsEl.innerHTML='';

    // v6.9: 严格去重选项生成
    const options=[];
    const usedTypes=new Set();
    const shuffled=[...WEAPON_UPGRADE_OPTIONS].sort(()=>Math.random()-.5);
    for(const opt of shuffled){
      if(options.length>=3) break;
      if(usedTypes.has(opt.type)) continue;
      const cfg=opt.getCfg();
      if(cfg){
        options.push(cfg);
        usedTypes.add(opt.type);
      }
    }

    // 无可用选项：直接升级，不弹面板
    if(options.length===0){
      console.warn('[WeaponUpgrade] 无可用选项，直接升级');
      weaponUpgradeActive=false;
      if(player) player.invincible=0;
      const wt=WEAPON_TYPES[weaponType];
      if(wt&&weaponLevel<wt.levels.length) weaponLevel++;
      else bombCount=Math.min(9,bombCount+1);
      return;
    }

    // 渲染选项
    options.forEach((opt,idx)=>{
      const div=document.createElement('div');
      div.className='wu-option';
      div.innerHTML=`
        <div class="wo-icon">${opt.icon}</div>
        <div class="wo-content">
          <div class="wo-name">${opt.name}</div>
          <div class="wo-desc">${opt.desc}</div>
        </div>
      `;
      div.onclick=()=>_closeWeaponUpgrade(opt);
      optionsEl.appendChild(div);
    });

    panel.style.display='flex';

    // v6.9: 15秒超时保险 —— 无论如何都会自动关闭，绝不卡死
    if(_wuTimeout) clearTimeout(_wuTimeout);
    _wuTimeout=setTimeout(()=>{
      console.warn('[WeaponUpgrade] 15秒超时，自动选第1项');
      _closeWeaponUpgrade(options[0]);
    }, 15000);

  }catch(e){
    console.error('[WeaponUpgrade] 渲染出错:',e);
    weaponUpgradeActive=false;
    if(player) player.invincible=0;
    try{if(panel)panel.style.display='none';}catch(_){}
  }
}

