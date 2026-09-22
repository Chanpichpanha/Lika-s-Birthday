import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import './style.css';

const $ = (q) => document.querySelector(q);
const els = {
  game: $('#game'), intro: $('#intro'), pause: $('#pause'), hud: $('#hud'), interact: $('#interact'),
  interactText: $('#interact-text'), objective: $('#objective-text'), dialogue: $('#dialogue'),
  dialogueText: $('#dialogue-text'), crosshair: $('#crosshair'), toast: $('#toast'), help: $('#help'),
  bookModal: $('#book-modal'), book: $('#book'), sound: $('#sound-btn'), mobileControls: $('#mobile-controls'),
  moveStick: $('#move-stick'), stickThumb: $('#stick-thumb'), lookZone: $('#look-zone'),
  mobileSprint: $('#mobile-sprint'), mobileJump: $('#mobile-jump'), mobileInteract: $('#mobile-interact'),
  turnSheet: $('#page-turn-sheet'), turnFront: $('#turn-front'), turnBack: $('#turn-back'),
  passcodeModal: $('#passcode-modal'), passcodeInput: $('#passcode-input'), passcodeSubmit: $('#passcode-submit'), passcodeError: $('#passcode-error'),
  installTip: $('#install-tip'), installGuide: $('#install-guide')
};

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x6d8fb5);
scene.fog = new THREE.Fog(0xf4bbce, 34, 90);
const isTouch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const isStandalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
const mobileBookMedia = matchMedia('(max-width: 950px)');
const viewportSize=()=>({width:els.game.clientWidth,height:els.game.clientHeight});
function syncAppHeight(){document.documentElement.style.setProperty('--app-height',`${viewportSize().height}px`);}
syncAppHeight();

const introCard=$('.intro-card'),startButton=$('#start-btn');
if(!isTouch&&!reducedMotion){
  let pointerFrame=0,pointerX=0,pointerY=0;
  const paintIntroParallax=()=>{pointerFrame=0;els.intro.style.setProperty('--intro-x',`${pointerX*8}px`);els.intro.style.setProperty('--intro-y',`${pointerY*6}px`);els.intro.style.setProperty('--card-rx',`${pointerY*-2.4}deg`);els.intro.style.setProperty('--card-ry',`${pointerX*3.1}deg`);};
  els.intro.addEventListener('pointermove',e=>{pointerX=e.clientX/innerWidth*2-1;pointerY=e.clientY/innerHeight*2-1;if(!pointerFrame)pointerFrame=requestAnimationFrame(paintIntroParallax);});
  els.intro.addEventListener('pointerleave',()=>{pointerX=pointerY=0;if(!pointerFrame)pointerFrame=requestAnimationFrame(paintIntroParallax);});
  startButton.addEventListener('pointermove',e=>{const r=startButton.getBoundingClientRect();startButton.style.setProperty('--magnet-x',`${(e.clientX-r.left-r.width/2)*.08}px`);startButton.style.setProperty('--magnet-y',`${(e.clientY-r.top-r.height/2)*.11}px`);});
  startButton.addEventListener('pointerleave',()=>{startButton.style.setProperty('--magnet-x','0px');startButton.style.setProperty('--magnet-y','0px');});
}

if((isIOS&&!isStandalone)||new URLSearchParams(location.search).get('preview')==='install')els.installTip.classList.remove('hidden');
els.installTip.onclick=()=>els.installGuide.classList.remove('hidden');
document.querySelectorAll('[data-close="install"]').forEach(button=>button.onclick=()=>els.installGuide.classList.add('hidden'));
function requestGameFullscreen(){
  if(!isTouch||isIOS||isStandalone||!document.fullscreenEnabled||document.fullscreenElement)return;
  document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(()=>{});
}

const initialViewport=viewportSize();
const camera = new THREE.PerspectiveCamera(68, initialViewport.width / initialViewport.height, 0.05, 120);
camera.position.set(0, 1.72, 15);
const renderer = new THREE.WebGLRenderer({ antialias: !isTouch, powerPreference: 'high-performance' });
renderer.setSize(initialViewport.width, initialViewport.height);
renderer.setPixelRatio(Math.min(devicePixelRatio, isTouch ? 1.45 : 1.85));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.14;
els.game.appendChild(renderer.domElement);

const clock = new THREE.Clock();
const keys = {};
const balloons = [];
const clouds = [];
let started = false, doorOpen = false, enteredHouse = false, metFinn = false, giftOpen = false;
let activeInteraction = null, dialogueTimer = 0, toastTimer = 0, pageSpread = 0, mobilePage = 0;
let draggingLook = false, lookPointer = null, lastLookX = 0, lastLookY = 0, bookTurning = false;
let audioCtx = null, masterGain = null, musicBus = null, musicTimer = null, musicStep = 0, muted = false;

const C = { pink:0xf58fb2, cream:0xfff3df, mint:0x8fd7c1, purple:0xa995df, berry:0xc94f78, brown:0x8b5a45, gold:0xffd372, blue:0x8ec8e8, dark:0x3b293d };
const mat = (color, rough=.72, metal=0) => new THREE.MeshStandardMaterial({ color, roughness:rough, metalness:metal });
const mats = { pink:mat(C.pink), cream:mat(C.cream), mint:mat(C.mint), purple:mat(C.purple), berry:mat(C.berry), brown:mat(C.brown), gold:mat(C.gold,.42,.08), blue:mat(C.blue), dark:mat(C.dark), white:mat(0xffffff) };

function mesh(geometry, material, pos=[0,0,0], cast=true, receive=true) {
  const m = new THREE.Mesh(geometry, material); m.position.set(...pos); m.castShadow=cast; m.receiveShadow=receive; scene.add(m); return m;
}
function box(size, material, pos, parent=scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(...size), material); m.position.set(...pos); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
}
function roundedBox(size, radius, material, pos, parent=scene, cast=true) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(size[0],size[1],size[2],4,radius),material); m.position.set(...pos); m.castShadow=cast; m.receiveShadow=true; parent.add(m); return m;
}
function sphere(radius, material, pos, scale=[1,1,1], parent=scene, cast=true) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius,20,14), material); m.position.set(...pos); m.scale.set(...scale); m.castShadow=cast; parent.add(m); return m;
}
function cylinder(r1,r2,h,material,pos,parent=scene,segments=24) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1,r2,h,segments),material); m.position.set(...pos); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m;
}
function addLight(color,intensity,pos,range=0) { const l=new THREE.PointLight(color,intensity,range,2); l.position.set(...pos); l.castShadow=false; scene.add(l); return l; }

// Layered storybook sky with a cool zenith, warm horizon, drifting clouds, and distant hills.
const sky=new THREE.Mesh(new THREE.SphereGeometry(105,36,20),new THREE.ShaderMaterial({
  side:THREE.BackSide,depthWrite:false,
  uniforms:{topColor:{value:new THREE.Color(0x82bde8)},middleColor:{value:new THREE.Color(0xdab8ef)},horizonColor:{value:new THREE.Color(0xf7bdc7)}},
  vertexShader:'varying vec3 vWorld; void main(){vec4 world=modelMatrix*vec4(position,1.0);vWorld=normalize(world.xyz);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'uniform vec3 topColor;uniform vec3 middleColor;uniform vec3 horizonColor;varying vec3 vWorld;void main(){float h=clamp(vWorld.y*.5+.5,0.0,1.0);vec3 low=mix(horizonColor,middleColor,smoothstep(.42,.62,h));vec3 col=mix(low,topColor,smoothstep(.62,1.0,h));gl_FragColor=vec4(col,1.0);}'
})); sky.frustumCulled=false; scene.add(sky);
scene.add(new THREE.HemisphereLight(0xffe5ee, 0x7f9f78, 2.15));
const sun = new THREE.DirectionalLight(0xfff1d1, 3.15); sun.position.set(-8,13,9); sun.castShadow=true; sun.shadow.mapSize.set(isTouch?768:1024,isTouch?768:1024); sun.shadow.camera.left=-18; sun.shadow.camera.right=18; sun.shadow.camera.top=18; sun.shadow.camera.bottom=-18; sun.shadow.bias=-.0006; scene.add(sun);
addLight(0xff9fbd, 40, [0,4.5,-2], 13); addLight(0xffd487, 32, [-5,3,-4], 10);
sphere(2.2,new THREE.MeshBasicMaterial({color:0xffe7a3,fog:false}),[-22,18,-48],[1,1,.2],scene,false);

function makeCloud(x,y,z,scale,drift){
  const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);g.userData.drift=drift;
  const cloudMat=new THREE.MeshBasicMaterial({color:0xfff8f2,transparent:true,opacity:.84,fog:true});
  [[-1.15,0,1.15],[-.35,.35,1.35],[.62,.18,1.18],[1.35,-.08,.85]].forEach(([px,py,s])=>sphere(.75,cloudMat,[px,py,0],[1.45*s,s,.65*s],g,false));
  scene.add(g);clouds.push(g);
}
makeCloud(-18,11,-27,1.25,.11);makeCloud(17,13,-38,1.7,.075);makeCloud(-8,16,-56,1.4,.055);makeCloud(26,9,-17,1.1,.095);makeCloud(-28,8,-10,.9,.12);
const hillMats=[mat(0xb99bd4,1),mat(0x96c3ad,1),mat(0xd8a2ba,1)];
for(let i=0;i<15;i++){const a=i/15*Math.PI*2,r=46+(i%3)*5;const h=sphere(6+(i%4),hillMats[i%3],[Math.sin(a)*r,1.2,Math.cos(a)*r],[1.7,.72,1.1],scene,false);h.receiveShadow=false;}

// Ground, instanced stepping stones and varied candy trees guide the player from spawn.
const ground=mesh(new THREE.CircleGeometry(70,64),mat(0x91c69b,.9),[0,-.04,0],false,true);ground.rotation.x=-Math.PI/2;
const pathGeo=new THREE.CylinderGeometry(.56,.62,.13,18),pathMat=mat(0xffecde,.88),path=new THREE.InstancedMesh(pathGeo,pathMat,12),pathMx=new THREE.Matrix4();
path.castShadow=true;path.receiveShadow=true;
for(let i=0;i<12;i++){pathMx.compose(new THREE.Vector3(Math.sin(i*.83)*.38,.015,14.2-i*.92),new THREE.Quaternion().setFromEuler(new THREE.Euler(0,i*.47,0)),new THREE.Vector3(.82+(i%3)*.12,1,.82+((i+1)%4)*.08));path.setMatrixAt(i,pathMx);path.setColorAt(i,new THREE.Color(i%2?0xfff0e4:0xf7a8be));}
path.instanceMatrix.needsUpdate=true;scene.add(path);
function candyTree(x,z,i){
  const g=new THREE.Group();g.position.set(x,0,z);const height=1.65+(i%3)*.18;
  cylinder(.14,.19,height,i%2?mats.cream:mats.berry,[0,height/2,0],g,16);
  const crown=sphere(.72,[mats.pink,mats.purple,mats.mint][i%3],[0,height+.36,0],[1+(i%2)*.13,1.12,.72],g);crown.rotation.z=(i%2?1:-1)*.08;
  sphere(.24,mats.cream,[-.33,height+.42,.28],[.9,.65,.55],g);scene.add(g);
}
for(let side of [-1,1])for(let i=0;i<6;i++)candyTree(side*(3.8+(i%2)*.95),10.2-i*2.4,i+(side>0?2:0));
// Lollipops flanking the path — varied heights and candy colours
function lollipop(x,z,material,h=2.2){const g=new THREE.Group();g.position.set(x,0,z);cylinder(.07,.07,h,mats.cream,[0,h/2,0],g,10);sphere(.36,material,[0,h+.28,0],[1,1,.35],g);const swirl=new THREE.Mesh(new THREE.TorusGeometry(.26,.04,8,22,Math.PI*1.5),mats.cream);swirl.position.set(0,h+.28,.02);g.add(swirl);scene.add(g);}
lollipop(-2.8,12.5,mats.pink,2.0);lollipop(2.5,11.2,mats.purple,2.3);lollipop(-3.2,8.5,mats.mint,1.8);lollipop(3.0,7.0,mats.berry,2.1);

// Cottage shell
const house = new THREE.Group(); scene.add(house);
const wallMat = mat(0xf4a9bb), trimMat = mat(0xffefd9), floorMat = mat(0xc98570), roofMat = mat(0xc66d89);
box([13,.3,11],floorMat,[0,.01,-1],house);
box([13,5.4,.34],wallMat,[0,2.7,-6.3],house);
box([.34,5.4,10.6],wallMat,[-6.5,2.7,-1],house); box([.34,5.4,10.6],wallMat,[6.5,2.7,-1],house);
box([5.15,5.4,.35],wallMat,[-3.93,2.7,4.3],house); box([5.15,5.4,.35],wallMat,[3.93,2.7,4.3],house); box([2.7,1.25,.35],wallMat,[0,4.78,4.3],house);
const roofLeft=roundedBox([7.55,.48,12.3],.2,roofMat,[-3.15,6.55,-1],house);roofLeft.rotation.z=.48;
const roofRight=roundedBox([7.55,.48,12.3],.2,roofMat,[3.15,6.55,-1],house);roofRight.rotation.z=-.48;
roundedBox([.8,3.2,1.3],.18,mat(0xe58ca5),[4.3,7.05,-2.4],house);sphere(.62,trimMat,[4.3,8.55,-2.4],[1,.55,1],house);
const gableShape=new THREE.Shape();gableShape.moveTo(-6.5,0);gableShape.lineTo(0,3.55);gableShape.lineTo(6.5,0);gableShape.closePath();
const gableGeometry=new THREE.ShapeGeometry(gableShape),gableMaterial=mat(0xe993ab);gableMaterial.side=THREE.DoubleSide;
const frontGable=new THREE.Mesh(gableGeometry,gableMaterial);frontGable.position.set(0,5.12,4.47);frontGable.castShadow=true;frontGable.receiveShadow=true;house.add(frontGable);
const rearGable=new THREE.Mesh(gableGeometry,gableMaterial);rearGable.position.set(0,5.12,-6.47);rearGable.castShadow=true;rearGable.receiveShadow=true;house.add(rearGable);
function createHouseSign(text){
  const c=document.createElement('canvas'); c.width=1024;c.height=256; const x=c.getContext('2d');
  x.fillStyle='rgba(233,147,171,0.9)'; x.beginPath(); x.roundRect(128,40,768,160,60); x.fill();
  x.strokeStyle='rgba(255,255,255,0.8)'; x.lineWidth=8; x.stroke();
  x.fillStyle='#fff'; x.beginPath(); x.arc(190,120,12,0,Math.PI*2);x.fill();
  x.beginPath(); x.arc(834,120,12,0,Math.PI*2);x.fill();
  x.fillStyle='white'; x.font='800 85px Fredoka, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,512,125);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true})); s.scale.set(6, 1.5, 1); return s;
}
const houseSign = createHouseSign("Lika's BD Party");
houseSign.position.set(0, 5.7, 4.6);
house.add(houseSign);
// frosting base and ceiling trim
for(let x=-6;x<=6;x+=.75){ sphere(.46,trimMat,[x,.32,4.48],[1,.62,.55],house); sphere(.34,trimMat,[x,5.2,-6.12],[1,.65,.5],house); }
// doorway candy-cane frame
for(let y=.35;y<4.3;y+=.5){ box([.38,.32,.48],Math.round(y*2)%2?mats.cream:mats.berry,[-1.52,y,4.12],house); box([.38,.32,.48],Math.round(y*2)%2?mats.berry:mats.cream,[1.52,y,4.12],house); }
box([3.4,.42,.5],mats.cream,[0,4.18,4.12],house);

// Windows
function windowSet(x,z,rot=0){
  const g=new THREE.Group(); g.position.set(x,2.8,z); g.rotation.y=rot; house.add(g);
  box([2.25,2.25,.18],mats.cream,[0,0,0],g); box([1.82,1.82,.2],new THREE.MeshStandardMaterial({color:0x87bee0,emissive:0xffaa55,emissiveIntensity:.5,roughness:.2,transparent:true,opacity:.88}),[0,0,.05],g);
  box([.13,1.9,.23],mats.cream,[0,0,.16],g); box([1.9,.13,.23],mats.cream,[0,0,.16],g);
}
windowSet(-4.3,4.15,0); windowSet(4.3,4.15,0);
// Warm interior glow behind windows — visible from outside
addLight(0xffcc88,18,[-4.3,2.8,3.2],8); addLight(0xffcc88,18,[4.3,2.8,3.2],8);

// Door pivot and heart window
const doorPivot=new THREE.Group(); doorPivot.position.set(-1.35,0,4.03); house.add(doorPivot);
const doorMaterial=mat(0xb66b86,.62,0);doorMaterial.emissive.setHex(0x5a1f39);doorMaterial.emissiveIntensity=0;
const door=roundedBox([2.7,4,.22],.2,doorMaterial,[1.35,2,0],doorPivot); roundedBox([2.25,3.55,.12],.17,mat(0xe593aa),[1.35,2,.15],doorPivot);
const knob=sphere(.11,mats.gold,[2.38,1.95,.24],[1,1,.5],doorPivot);
const heartShape=new THREE.Shape(); heartShape.moveTo(0,0); heartShape.bezierCurveTo(-.8,-.55,-1.2,.35,0,1.15); heartShape.bezierCurveTo(1.2,.35,.8,-.55,0,0);
const heart=new THREE.Mesh(new THREE.ExtrudeGeometry(heartShape,{depth:.08,bevelEnabled:true,bevelSize:.04,bevelThickness:.03}),new THREE.MeshStandardMaterial({color:0xfad5df,transparent:true,opacity:.86,roughness:.25})); heart.scale.set(.46,.46,.46); heart.rotation.x=Math.PI; heart.position.set(1.35,3.05,.2); doorPivot.add(heart);

// Interior rug
const rug=mesh(new THREE.CircleGeometry(3.8,48),mat(0xea8fac),[0,.18,-1],false,true); rug.rotation.x=-Math.PI/2; rug.scale.z=.62;
const rug2=mesh(new THREE.RingGeometry(2.8,3.25,48),mats.cream,[0,.19,-1],false,true); rug2.rotation.x=-Math.PI/2; rug2.scale.z=.62;

// Party bunting and fairy bulbs
function lineBetween(a,b,color=0x745062){ const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]); scene.add(new THREE.Line(geo,new THREE.LineBasicMaterial({color}))); }
function bunting(z,y){ lineBetween([-5.6,y,z],[5.6,y,z]); for(let x=-5.3,i=0;x<5.5;x+=.75,i++){ const shape=new THREE.Shape(); shape.moveTo(-.28,0);shape.lineTo(.28,0);shape.lineTo(0,-.58);shape.closePath(); const flag=new THREE.Mesh(new THREE.ShapeGeometry(shape),[mats.pink,mats.mint,mats.purple,mats.gold][i%4]); flag.position.set(x,y-.02,z+.02); scene.add(flag); } }
bunting(-5.85,4.6); bunting(3.9,4.72);
for(let x=-5.3;x<=5.3;x+=.7){ sphere(.065,mats.gold,[x,4.55,-5.9]); }

// Interior wall decorations — picture frames, shelf, trinkets
const texLoader = new THREE.TextureLoader();
function pictureFrame(x,y,z,rotY=0,imgUrl=null){
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=rotY;
  box([1.2,.9,.06],mats.gold,[0,0,0],g);
  let canvasMat=mat(0xeac8d4);
  if(imgUrl){const tex=texLoader.load(imgUrl);tex.colorSpace=THREE.SRGBColorSpace;canvasMat=new THREE.MeshBasicMaterial({map:tex});}
  box([1.0,.7,.08],canvasMat,[0,0,.02],g);house.add(g);
}
// 🖼️ ADD YOUR FRAME IMAGES HERE! 
// Drop 3 photos (e.g. pic1.jpg) into your public/ folder, then type their names below:
pictureFrame(-6.35,3.2,-3.5,Math.PI/2, '/assets/drafts/pic1.jpg');
pictureFrame(-6.35,3.2,.5,Math.PI/2, '/assets/drafts/pic2.jpg');
pictureFrame(6.35,3.2,-2,Math.PI*-.5, '/assets/drafts/pic3.jpg');
// Small display shelf on right wall
box([2.5,.12,.55],mats.brown,[6.32,2.2,-4.5],house);sphere(.12,mats.pink,[5.8,2.35,-4.5],[1,1,1],house);sphere(.1,mats.mint,[6.2,2.32,-4.5],[.8,1.2,.8],house);cylinder(.08,.1,.25,mats.purple,[6.6,2.38,-4.5],house,8);
// Tiny wall star above the back window area
sphere(.15,mats.gold,[0,4.5,-6.15],[1.3,.3,1],house);

// Balloons
function balloon(x,y,z,color,phase){ const b=sphere(.43,color,[x,y,z],[.85,1.12,.85]); b.userData.baseY=y;b.userData.phase=phase;balloons.push(b);lineBetween([x,y-.45,z],[x,y-1.55,z],0x8d7586); return b; }
balloon(-5,3,-4.7,mats.pink,0); balloon(-4.3,3.55,-4.9,mats.mint,1); balloon(-5.6,3.8,-4.8,mats.purple,2);
balloon(5.15,3.3,-4.8,mats.blue,2.8); balloon(4.5,3.8,-4.9,mats.pink,3.7); balloon(5.65,4,-4.7,mats.purple,4.4);

// Table
const table=new THREE.Group(); table.position.set(0,0,-2.55); scene.add(table);
roundedBox([5.5,.25,2.05],.15,mats.cream,[0,1.2,0],table); roundedBox([5.7,.09,2.2],.04,mats.pink,[0,1.37,0],table);
for(let x of [-2.35,2.35]) for(let z of [-.72,.72]) cylinder(.13,.17,1.2,mats.brown,[x,.6,z],table);
// cake & treats
cylinder(.78,.85,.6,mats.cream,[-1.55,1.7,0],table); cylinder(.54,.58,.4,mats.pink,[-1.55,2.18,0],table);
for(let i=0;i<5;i++){ const a=i/5*Math.PI*2; sphere(.08,mats.berry,[-1.55+Math.cos(a)*.36,2.42,Math.sin(a)*.36],[1,.7,1],table); }
cylinder(.025,.025,.4,mats.blue,[-1.55,2.55,0],table); sphere(.07,mats.gold,[-1.55,2.8,0],[.7,1.4,.7],table);

// Gift with animated lid and book
const gift=new THREE.Group(); gift.position.set(.55,1.38,-2.55); gift.scale.setScalar(.82); scene.add(gift);
roundedBox([1.5,1.05,1.3],.12,mats.mint,[0,.53,0],gift); roundedBox([.22,1.08,1.34],.06,mats.berry,[0,.54,0],gift); roundedBox([1.54,1.08,.22],.06,mats.berry,[0,.54,0],gift);
const lid=new THREE.Group(); lid.position.set(0,1.07,-.62); gift.add(lid); roundedBox([1.66,.22,1.45],.08,mats.mint,[0,.1,.62],lid); roundedBox([.24,.26,1.48],.06,mats.berry,[0,.14,.62],lid); roundedBox([1.7,.26,.22],.06,mats.berry,[0,.14,.62],lid);
// bow loops
const torusGeo=new THREE.TorusGeometry(.28,.08,10,24,Math.PI*1.6);
const bow1=new THREE.Mesh(torusGeo,mats.berry); bow1.position.set(-.18,.35,.6); bow1.rotation.set(Math.PI/2,0,.5); lid.add(bow1);
const bow2=bow1.clone(); bow2.position.x=.18; bow2.rotation.z=-.5; lid.add(bow2);
const book3d=new THREE.Group(); book3d.visible=false; book3d.position.set(0,1.12,0); gift.add(book3d); box([1.12,.12,.82],mats.berry,[0,0,0],book3d); box([1.03,.06,.75],mats.cream,[0,.08,0],book3d); box([.14,.18,.82],mats.gold,[-.5,.05,0],book3d);
// Pulsing gift glow — draws the eye toward Finn's present
const giftGlow=addLight(0xffd700,0,[.55,2.2,-2.55],5);
const giftRing=new THREE.Mesh(new THREE.TorusGeometry(.9,.025,12,48),new THREE.MeshBasicMaterial({color:0xffd700,transparent:true,opacity:0}));giftRing.position.set(.55,1.42,-2.55);giftRing.rotation.x=-Math.PI/2;scene.add(giftRing);

// Finn — a cheerful, softly rounded boy behind the table
const finn=new THREE.Group(); finn.position.set(2.35,0,-3.9); finn.rotation.y=-.08; scene.add(finn);
// legs / shoes
cylinder(.2,.22,.85,mats.dark,[-.31,.44,0],finn); cylinder(.2,.22,.85,mats.dark,[.31,.44,0],finn);
sphere(.27,mats.brown,[-.31,.1,.13],[1.2,.65,1.5],finn); sphere(.27,mats.brown,[.31,.1,.13],[1.2,.65,1.5],finn);
// rounded/chubby body, shirt, shorts
sphere(.83,mats.mint,[0,1.37,0],[1.02,1.05,.72],finn); box([1.32,.48,.72],mats.dark,[0,.92,0],finn);
// neck and head
cylinder(.2,.22,.28,mat(0xd99a76),[0,2.04,0],finn); sphere(.56,mat(0xe5aa84),[0,2.42,0],[1,1.08,.94],finn);
// ears, nose, eyes
sphere(.13,mat(0xe5aa84),[-.54,2.43,0],[.65,1,1],finn); sphere(.13,mat(0xe5aa84),[.54,2.43,0],[.65,1,1],finn);
sphere(.055,mats.dark,[-.19,2.49,.5],[1,1,.55],finn); sphere(.055,mats.dark,[.19,2.49,.5],[1,1,.55],finn); sphere(.065,mat(0xefb18e),[0,2.34,.55],[.8,.8,.55],finn);
// smile
const smile=new THREE.Mesh(new THREE.TorusGeometry(.15,.025,8,20,Math.PI),mats.dark); smile.position.set(0,2.24,.52); smile.rotation.z=Math.PI; finn.add(smile);
// boy's tousled hair cap and tufts
sphere(.55,mat(0x573c36),[0,2.72,-.02],[1.02,.55,1],finn);
for(let i=0;i<7;i++){ const a=(i/6-.5)*1.7; sphere(.16,mat(0x573c36),[Math.sin(a)*.44,2.79+Math.cos(a)*.08,.18+Math.cos(a)*.2],[1,.8,1],finn); }
// cheering arms on pivots
function arm(side){ const p=new THREE.Group(); p.position.set(side*.68,1.7,0); finn.add(p); const upper=cylinder(.16,.18,.82,mat(0xe5aa84),[side*.16,.35,0],p); upper.rotation.z=side*-.45; sphere(.18,mat(0xe5aa84),[side*.34,.72,0],[1,1,1],p); p.rotation.z=side*1.9; return p; }
const finnArmL=arm(-1), finnArmR=arm(1);
// party hat
const hat=new THREE.Mesh(new THREE.ConeGeometry(.34,.72,24),mats.purple); hat.position.set(0,3.12,0); hat.rotation.z=-.08; finn.add(hat); sphere(.1,mats.gold,[0,3.5,0],[1,1,1],finn);

// Finn name badge sprite
function nameSprite(text){
  const c=document.createElement('canvas'); c.width=512;c.height=160; const x=c.getContext('2d');
  x.fillStyle='rgba(47,31,46,.9)'; x.beginPath(); x.roundRect(64,20,384,100,45); x.fill();
  x.fillStyle='#ffd77d'; x.beginPath(); x.arc(105,70,8,0,Math.PI*2);x.fill();
  x.fillStyle='white'; x.font='700 48px Fredoka, sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(text,270,70);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; const s=new THREE.Sprite(new THREE.SpriteMaterial({map:t,transparent:true,depthTest:true})); s.scale.set(2.8,.88,1); return s;
}
const nameTag=nameSprite('FINN'); nameTag.position.set(0,3.85,0); finn.add(nameTag);

// One instanced confetti system keeps the reveal light on mobile GPUs.
const MAX_CONFETTI=isTouch?90:150,confetti=[];
const confettiGeo=new THREE.BoxGeometry(.045,.14,.025),confettiMat=new THREE.MeshBasicMaterial({vertexColors:true,toneMapped:false});
const confettiMesh=new THREE.InstancedMesh(confettiGeo,confettiMat,MAX_CONFETTI),confettiDummy=new THREE.Object3D();
confettiMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);confettiMesh.count=0;confettiMesh.frustumCulled=false;scene.add(confettiMesh);
const confettiColors=[C.pink,C.mint,C.purple,C.gold,C.blue];
function burstConfetti(origin,count=80){
  count=Math.min(count,MAX_CONFETTI-confetti.length);
  for(let i=0;i<count;i++)confetti.push({position:origin.clone(),vel:new THREE.Vector3((Math.random()-.5)*3.2,2.5+Math.random()*3,(Math.random()-.5)*3.2),rotation:new THREE.Vector3(Math.random()*3,Math.random()*3,Math.random()*3),life:2.2+Math.random(),color:new THREE.Color(confettiColors[i%confettiColors.length])});
}
function updateConfetti(dt){
  for(let i=confetti.length-1;i>=0;i--){const p=confetti[i];p.life-=dt;if(p.life<=0){confetti.splice(i,1);continue;}p.vel.y-=4.1*dt;p.position.addScaledVector(p.vel,dt);p.rotation.x+=dt*5;p.rotation.z+=dt*3;}
  confettiMesh.count=confetti.length;
  confetti.forEach((p,i)=>{confettiDummy.position.copy(p.position);confettiDummy.rotation.set(p.rotation.x,p.rotation.y,p.rotation.z);confettiDummy.scale.setScalar(Math.min(1,p.life*2));confettiDummy.updateMatrix();confettiMesh.setMatrixAt(i,confettiDummy.matrix);confettiMesh.setColorAt(i,p.color);});
  if(confetti.length){confettiMesh.instanceMatrix.needsUpdate=true;if(confettiMesh.instanceColor)confettiMesh.instanceColor.needsUpdate=true;}
}

function setObjective(text){ els.objective.textContent=text; const pill=els.objective.closest('.objective-pill'); pill.animate([{transform:'scale(.97)'},{transform:'scale(1.03)'},{transform:'scale(1)'}],{duration:480,easing:'ease-out'}); }
function showDialogue(text, seconds=4){ els.dialogueText.textContent=text; els.dialogue.classList.remove('hidden'); dialogueTimer=seconds; synth('voice'); }
function showToast(text){ els.toast.textContent=text; els.toast.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>els.toast.classList.add('hidden'),2200); }

function setupAudio(){
  if(audioCtx){audioCtx.resume?.();startBackgroundMusic();return;}
  audioCtx=new (window.AudioContext||window.webkitAudioContext)();masterGain=audioCtx.createGain();masterGain.gain.value=.20;masterGain.connect(audioCtx.destination);
  musicBus=audioCtx.createGain();musicBus.gain.value=.62;
  const musicFilter=audioCtx.createBiquadFilter();musicFilter.type='lowpass';musicFilter.frequency.value=1800;musicFilter.Q.value=.35;musicBus.connect(musicFilter);musicFilter.connect(masterGain);
  startBackgroundMusic();
}
const birthdayMelody=[523.25,659.25,783.99,659.25,587.33,698.46,880,698.46,659.25,783.99,987.77,783.99,587.33,698.46,783.99,0,
  783.99,698.46,659.25,587.33,523.25,587.33,659.25,523.25,440,523.25,587.33,523.25,440,392,349.23,0];
const birthdayBass=[130.81,110,174.61,98,146.83,130.81,116.54,98];
function musicTone(frequency,start,duration,level,type='sine'){
  if(!audioCtx||!musicBus||!frequency)return;
  const oscillator=audioCtx.createOscillator(),gain=audioCtx.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(frequency,start);
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(level,start+.045);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  oscillator.connect(gain);gain.connect(musicBus);oscillator.start(start);oscillator.stop(start+duration+.04);
}
function playMusicStep(){
  if(!audioCtx||audioCtx.state!=='running'||muted)return;
  const now=audioCtx.currentTime+.025,note=birthdayMelody[musicStep];musicTone(note,now,.38,.055,'sine');
  if(musicStep%4===0){const root=birthdayBass[Math.floor(musicStep/4)];musicTone(root,now,1.72,.026,'sine');musicTone(root*2,now+.02,1.55,.013,'triangle');}
  musicStep=(musicStep+1)%birthdayMelody.length;
}
function startBackgroundMusic(){if(musicTimer)return;playMusicStep();musicTimer=setInterval(playMusicStep,430);}
function synth(type='ping'){
  if(!audioCtx||muted)return; const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.connect(g);g.connect(masterGain);const t=audioCtx.currentTime;
  if(type==='open'){o.type='triangle';o.frequency.setValueAtTime(330,t);o.frequency.exponentialRampToValueAtTime(780,t+.35);g.gain.setValueAtTime(.32,t);g.gain.exponentialRampToValueAtTime(.001,t+.6);}
  else if(type==='gift'){o.type='sine';o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(659,t+.12);o.frequency.setValueAtTime(784,t+.25);g.gain.setValueAtTime(.4,t);g.gain.exponentialRampToValueAtTime(.001,t+.8);}
  else {const settings={jump:[280,460,.12,.22,'triangle'],land:[150,90,.1,.18,'sine'],page:[420,270,.13,.32,'triangle'],step:[110,80,.025,.08,'sine'],voice:[440,520,.12,.2,'sine'],ping:[600,720,.12,.2,'sine']}[type]||[600,720,.12,.2,'sine'];o.type=settings[4];o.frequency.setValueAtTime(settings[0],t);o.frequency.exponentialRampToValueAtTime(settings[1],t+settings[3]);g.gain.setValueAtTime(settings[2],t);g.gain.exponentialRampToValueAtTime(.001,t+settings[3]);} o.start(t);o.stop(t+.85);
}
let lastSparkleTime=0;const giftCenter=new THREE.Vector3(.55,1.8,-2.55);
function sparkleNearGift(elapsed){if(!audioCtx||muted||giftOpen||!enteredHouse)return;const d=camera.position.distanceTo(giftCenter);if(d<4.5&&elapsed-lastSparkleTime>2.8){lastSparkleTime=elapsed;const now=audioCtx.currentTime,o1=audioCtx.createOscillator(),g1=audioCtx.createGain();o1.type='sine';o1.frequency.setValueAtTime(1200+Math.random()*400,now);o1.frequency.exponentialRampToValueAtTime(800+Math.random()*200,now+.35);g1.gain.setValueAtTime(.035,now);g1.gain.exponentialRampToValueAtTime(.001,now+.42);o1.connect(g1);g1.connect(masterGain);o1.start(now);o1.stop(now+.5);}}

function startGame(){
  if(started)return;started=true;requestGameFullscreen();setupAudio();els.intro.classList.add('leaving');
  setTimeout(()=>{els.intro.classList.remove('visible','leaving');els.hud.classList.remove('hidden');if(isTouch)els.mobileControls.classList.remove('hidden');},reducedMotion?20:520);
  setObjective('ដើរតាមស្ករវង់មូលនឹងទៅ!');
}
function openDoor(){ if(doorOpen)return; doorOpen=true; synth('open'); setObjective('Go in bitchh!'); burstConfetti(new THREE.Vector3(0,3.5,3.8),45); setTimeout(()=>burstConfetti(new THREE.Vector3(0,4.3,3.4),25),220); }
function openGift(){ if(giftOpen)return; giftOpen=true; synth('gift'); setObjective('Opened'); burstConfetti(new THREE.Vector3(.55,2.3,-2.55),isTouch?75:115); book3d.visible=true; showDialogue('Happy 19th birthday, Mi Kaaa! I made this little book for you, hope u like it!',5); setTimeout(openBook,1250); }
function openBook(){ if(!giftOpen)return; clearKeys(); draggingLook=false; els.pause.classList.remove('visible'); els.bookModal.classList.remove('hidden'); document.body.classList.add('book-open'); pageSpread=0; mobilePage=0; renderBook(); }

const spreads=[
  [
    {k:'CHAPTER 01',t:'Birthday Wishes',type:'custom',html:`
      <div style="text-align: left; padding: 0 5px;">
        <div style="font-size: 13.5px; line-height: 32px; background-image: linear-gradient(to bottom, transparent 31px, #e5cbd6 32px); background-size: 100% 32px; color: #6e5564; margin-top: 10px; padding-bottom: 5px;">
          <b style="color: #d94f7d; font-size: 15px;">Happy Birthday to my amazing sisturrrr!🎂</b><br>
          I hope your day is full of happiness, laughter, and lots of cake.<br>
          Your foopa may be so fkin hard sometimes, but I guess that’s part of your nature lol<br>
          Keep being kind, strong, and the wonderful person you are.<br>
          Wishing you the best birthday ever—love you always kween domnak hang! 🎉
        </div>
      </div>
    `},
    {k:'FOR TRA ROTHLIKA',t:'',type:'custom',html:`
      <div style="display:flex; align-items:center; justify-content:center; height:100%; position:relative;">
        <div style="position:absolute; top:20px; left:20px; font-size:24px; opacity:0.6;">✨</div>
        <div style="position:absolute; bottom:40px; right:30px; font-size:32px; opacity:0.4;">💖</div>
        <div style="position:absolute; top:80px; right:40px; font-size:20px; opacity:0.7;">🎂</div>
        <div style="position:absolute; bottom:90px; left:30px; font-size:20px; opacity:0.5;">🍭</div>
        
        <div style="border: 2px dashed #f19eb8; padding: 30px; border-radius: 20px; background: rgba(255,240,245,0.4); text-align: center;">
          <div style="font-family: 'Fredoka', sans-serif; font-size: 14px; color: #d94f7d; font-weight: 600; opacity: 0.8; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">
            one sentences to you
          </div>
          <div style="font-family: 'Fredoka', sans-serif; font-size: 28px; color: #f27ba0; font-weight: 700; font-style: italic; text-shadow: 1px 1px 0px #fff;">
            "Forever <br> Beside U."
          </div>
        </div>
      </div>
    `}
  ],
  [
    {k:'',t:'',type:'custom',html:`
      <div style="height:100%; display:flex; align-items:center; justify-content:center; padding:0 20px;">
        <div style="width:100%; background:#fff; padding:12px 12px 48px 12px; border-radius:3px; box-shadow:0 15px 35px rgba(110,85,100,0.15), 0 5px 15px rgba(0,0,0,0.08); position:relative; transform:rotate(-2.5deg);">
          <div style="position:absolute; top:-12px; left:50%; transform:translateX(-50%) rotate(-4deg); width:95px; height:28px; background:rgba(255,252,240,0.95); border:1px solid rgba(0,0,0,0.04); box-shadow:0 2px 6px rgba(0,0,0,0.08); z-index:2;"></div>
          <img src="/assets/drafts/lika1.jpg" style="width:100%; height:270px; object-fit:cover; border-radius:2px; display:block;">
          <div style="position:absolute; bottom:14px; left:0; width:100%; text-align:center; color:#d94f7d; font-size:22px; font-weight:800; letter-spacing:0.5px; transform:rotate(-1deg);">her birthday pic</div>
        </div>
      </div>
    `},
    {k:'',t:'',type:'custom',html:`
      <div style="height:100%; display:flex; align-items:center; justify-content:center; padding:0 20px;">
        <div style="width:100%; background:#fff; padding:12px 12px 48px 12px; border-radius:3px; box-shadow:0 15px 35px rgba(110,85,100,0.15), 0 5px 15px rgba(0,0,0,0.08); position:relative; transform:rotate(3deg);">
          <div style="position:absolute; top:-10px; left:50%; transform:translateX(-50%) rotate(5deg); width:105px; height:28px; background:rgba(255,252,240,0.95); border:1px solid rgba(0,0,0,0.04); box-shadow:0 2px 6px rgba(0,0,0,0.08); z-index:2;"></div>
          <img src="/assets/drafts/lika2.png" style="width:100%; height:270px; object-fit:cover; border-radius:2px; display:block;">
          <div style="position:absolute; bottom:14px; left:0; width:100%; text-align:center; color:#d94f7d; font-size:22px; font-weight:800; letter-spacing:0.5px; transform:rotate(1deg);">our pic</div>
        </div>
      </div>
    `}
  ],
  [
    {k:'',t:'',type:'custom',html:`
      <div style="height:100%; display:flex; align-items:center; justify-content:center; padding:0 20px; position:relative; overflow:hidden;">
        <div style="position:absolute; top:5px; left:10px; font-family:'Comic Sans MS', cursive, sans-serif; font-size:22px; color:#ff0000; font-weight:900; text-shadow:2px 2px 0 #ffff00, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; transform:rotate(-15deg); z-index:3;">Confidenttt</div>
        <div style="position:absolute; bottom:15px; left:5px; font-family:Impact, charcoal, sans-serif; font-size:28px; color:#00ff00; text-transform:uppercase; font-weight:normal; text-shadow:2px 2px 0 #000, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff; transform:rotate(12deg); z-index:3; letter-spacing:1px;">Smirkkkk</div>
        <div style="position:absolute; top:40%; right:-10px; font-family:'Comic Sans MS', cursive; font-size:24px; color:#ff00ff; font-weight:bold; text-shadow:2px 2px 0 #00ffff, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; transform:rotate(-75deg); z-index:3;">Slayyyy</div>
        <div style="position:absolute; top:18%; left:-15px; font-family:Impact, charcoal, sans-serif; font-size:26px; color:#ffff00; font-weight:normal; text-shadow:2px 2px 0 #ff00ff, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; transform:rotate(80deg); z-index:3;">t'peav</div>
        <div style="position:absolute; bottom:25%; right:-5px; font-family:'Comic Sans MS', cursive; font-size:22px; color:#00ffff; font-weight:bold; text-shadow:2px 2px 0 #ff0000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; transform:rotate(25deg); z-index:3;">Confidenttt</div>
        <div style="position:absolute; top:5px; right:30px; font-family:Impact, charcoal, sans-serif; font-size:24px; color:#ffa500; font-weight:normal; text-shadow:2px 2px 0 #000, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff; transform:rotate(-5deg); z-index:3;">t'peav</div>
        <div style="position:absolute; bottom:5px; right:40px; font-family:'Comic Sans MS', cursive; font-size:20px; color:#ff00ff; font-weight:bold; text-shadow:2px 2px 0 #00ff00, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; transform:rotate(-20deg); z-index:3;">Smirkkkk</div>
        <div style="position:absolute; top:65%; left:10px; font-family:Impact, charcoal, sans-serif; font-size:27px; color:#0000ff; font-weight:normal; text-shadow:2px 2px 0 #ffff00, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff; transform:rotate(-45deg); z-index:3;">Slayyyy</div>
        <div style="position:absolute; top:40%; left:30px; font-family:'Comic Sans MS', cursive; font-size:30px; color:#00ff00; font-weight:900; text-shadow:3px 3px 0 #ff00ff, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; transform:rotate(10deg); z-index:4;">t'peav</div>
        
        <div style="width:230px; height:230px; background:#fff; padding:10px 10px 30px 10px; border-radius:3px; box-shadow:0 15px 35px rgba(110,85,100,0.15), 0 5px 15px rgba(0,0,0,0.08); position:relative; transform:rotate(-3deg); margin-top:-10px;">
          <div style="position:absolute; top:-10px; left:50%; transform:translateX(-50%) rotate(3deg); width:100px; height:28px; background:rgba(255,252,240,0.95); border:1px solid rgba(0,0,0,0.04); box-shadow:0 2px 6px rgba(0,0,0,0.08); z-index:2;"></div>
          <img src="/assets/drafts/lika3.png" style="width:100%; height:100%; object-fit:cover; border-radius:2px; display:block;">
        </div>
      </div>
    `},
    {k:'',t:'',type:'custom',html:`
      <div style="height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:15px; position:relative;">
        <div style="position:absolute; top:50%; left:50%; width:150%; height:150%; transform:translate(-50%, -50%); background:radial-gradient(circle, rgba(255,182,193,0.3) 0%, transparent 60%); pointer-events:none; z-index:0;"></div>
        <div style="width:92%; background:#fff; padding:16px 16px 20px 16px; border-radius:6px; box-shadow:0 25px 50px rgba(110,85,100,0.2), inset 0 0 0 1px rgba(0,0,0,0.05); position:relative; z-index:1; display:flex; flex-direction:column; align-items:center;">
          <div style="width:100%; padding:3px; background:linear-gradient(135deg, #ffd77d 0%, #e6c875 50%, #fdf0a6 100%); border-radius:4px; margin-bottom:20px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
            <img src="/assets/drafts/lika4.jpg" style="width:100%; height:260px; object-fit:cover; border-radius:2px; display:block; filter:contrast(1.05) brightness(1.02);">
          </div>
          <h2 style="color:#a87d92; font-size:26px; font-style:italic; font-weight:600; letter-spacing:1px; margin:0; text-align:center; font-family:Georgia, serif; text-shadow:0 1px 2px rgba(255,255,255,0.8);">To be continued...</h2>
          <div style="width:50px; height:2px; background:linear-gradient(90deg, transparent, #ff8eb5, transparent); margin:12px auto 0;"></div>
        </div>
        <div style="position:absolute; bottom:20px; right:25px; font-size:22px; opacity:0.9; z-index:2; filter:drop-shadow(0 0 8px #fff);">✨</div>
        <div style="position:absolute; top:20px; left:25px; font-size:26px; opacity:0.7; z-index:2; filter:drop-shadow(0 0 8px #fff);">✨</div>
      </div>
    `}
  ]
];
const bookPages=spreads.flat();
const singlePageBook=()=>mobileBookMedia.matches;
function placeholderHTML(p){
  if(p.type==='custom') return p.html;
  if(p.type==='wishes') return `<div class="placeholder-card"><div class="wishes-lines"><span></span><span></span><span></span><span></span><span></span><em>Birthday wishes will be written here.</em><b class="slot-tag">${p.label}</b></div></div>`;
  return `<div class="placeholder-card"><div><div class="slot-icon">${p.icon}</div><strong>${p.label.replace(' PLACEHOLDER','')}</strong><p>${p.desc}</p><b class="slot-tag">NOT FILLED YET</b></div></div>`;
}
function pageHTML(p,number){return `<div class="turn-page-inner"><div class="page-kicker">${p.k}</div><h2>${p.t}</h2><div class="page-content">${placeholderHTML(p)}</div><div class="page-number">${String(number).padStart(2,'0')}</div></div>`;}
function renderBook(index=pageSpread){
  if(!singlePageBook())pageSpread=index;
  else pageSpread=Math.floor(mobilePage/2);
  const [l,r]=spreads[pageSpread],showLeft=mobilePage%2===0;
  $('#left-kicker').textContent=l.k;$('#left-title').textContent=l.t;$('#left-content').innerHTML=placeholderHTML(l);$('#left-number').textContent=String(pageSpread*2+1).padStart(2,'0');
  $('#right-kicker').textContent=r.k;$('#right-title').textContent=r.t;$('#right-content').innerHTML=placeholderHTML(r);$('#right-number').textContent=String(pageSpread*2+2).padStart(2,'0');
  els.book.classList.toggle('single-page',singlePageBook());els.book.classList.toggle('page-left',singlePageBook()&&showLeft);els.book.classList.toggle('page-right',singlePageBook()&&!showLeft);
  $('#prev-page').disabled=(singlePageBook()?mobilePage===0:pageSpread===0)||bookTurning;$('#next-page').disabled=(singlePageBook()?mobilePage===bookPages.length-1:pageSpread===spreads.length-1)||bookTurning;
  const dots=$('#page-dots');dots.innerHTML='';const dotItems=singlePageBook()?bookPages:spreads;dotItems.forEach((_,i)=>{const active=singlePageBook()?i===mobilePage:i===pageSpread,b=document.createElement('button');b.className=active?'active':'';b.ariaLabel=singlePageBook()?`Go to page ${i+1}`:`Go to spread ${i+1}`;b.disabled=bookTurning;b.onclick=()=>singlePageBook()?turnMobilePage(i):turnPage(i);dots.appendChild(b);});
}
function finishTurn(next){if(!bookTurning)return;pageSpread=next;bookTurning=false;els.turnSheet.className='page-turn-sheet';els.turnFront.innerHTML='';els.turnBack.innerHTML='';renderBook(pageSpread);}
function turnPage(next){
  if(bookTurning||next<0||next>=spreads.length||next===pageSpread)return;
  bookTurning=true;const forwardTurn=next>pageSpread,current=spreads[pageSpread],target=spreads[next];
  if(forwardTurn){els.turnFront.innerHTML=pageHTML(current[1],pageSpread*2+2);els.turnBack.innerHTML=pageHTML(target[0],next*2+1);}
  else{els.turnFront.innerHTML=pageHTML(current[0],pageSpread*2+1);els.turnBack.innerHTML=pageHTML(target[1],next*2+2);}
  renderBook(pageSpread);els.turnSheet.classList.add('active',forwardTurn?'turn-forward':'turn-backward');synth('page');
  setTimeout(()=>renderBook(next),reducedMotion?1:360);
  els.turnSheet.addEventListener('animationend',()=>finishTurn(next),{once:true});
  if(reducedMotion)setTimeout(()=>finishTurn(next),20);
}
function finishMobileTurn(next){if(!bookTurning)return;mobilePage=next;pageSpread=Math.floor(next/2);bookTurning=false;els.turnSheet.className='page-turn-sheet';els.turnFront.innerHTML='';els.turnBack.innerHTML='';renderBook(pageSpread);}
function turnMobilePage(next){
  if(bookTurning||next<0||next>=bookPages.length||next===mobilePage)return;
  bookTurning=true;const forwardTurn=next>mobilePage,current=bookPages[mobilePage],target=bookPages[next];
  els.turnFront.innerHTML=pageHTML(current,mobilePage+1);els.turnBack.innerHTML=pageHTML(target,next+1);renderBook(pageSpread);
  els.turnSheet.classList.add('active',forwardTurn?'turn-forward':'turn-backward');synth('page');
  setTimeout(()=>{mobilePage=next;pageSpread=Math.floor(next/2);renderBook(pageSpread);},reducedMotion?1:360);
  els.turnSheet.addEventListener('animationend',()=>finishMobileTurn(next),{once:true});
  if(reducedMotion)setTimeout(()=>finishMobileTurn(next),20);
}
function stepBook(direction){if(singlePageBook())turnMobilePage(mobilePage+direction);else turnPage(pageSpread+direction);}

const interactionTargets={door:new THREE.Vector3(0,1.9,4.2),gift:new THREE.Vector3(.55,1.8,-2.1),book:new THREE.Vector3(.55,2.2,-2.3)};
const lookDirection=new THREE.Vector3(),targetDirection=new THREE.Vector3();
function canUse(target,maxDistance,minFacing=.2){if(camera.position.distanceTo(target)>maxDistance)return false;camera.getWorldDirection(lookDirection);targetDirection.copy(target).sub(camera.position).normalize();return lookDirection.dot(targetDirection)>minFacing;}
function updateInteraction(dt){
  let next=null,text='';
  if(!doorOpen&&canUse(interactionTargets.door,3.4,.08)){next='door';text='បើកទ្វាទៅកុំចាំប្រាប់ច្រើនពេក!';}
  else if(giftOpen&&canUse(interactionTargets.book,3.4,.08)){next='book';text='Review the book';}
  else if(!giftOpen&&enteredHouse&&canUse(interactionTargets.gift,3.5,.05)){next='gift';text='Open Finn’s gift';}
  activeInteraction=next;els.interact.classList.toggle('hidden',!next);els.crosshair.classList.toggle('active',!!next);els.mobileInteract.classList.toggle('ready',!!next);if(next)els.interactText.textContent=text;
  doorMaterial.emissiveIntensity=THREE.MathUtils.damp(doorMaterial.emissiveIntensity,next==='door'?.45:0,8,dt);
  const scale=next==='gift'||next==='book'?.86:.82;gift.scale.setScalar(THREE.MathUtils.damp(gift.scale.x,scale,8,dt));
}

function interact(){ if(activeInteraction==='door'){clearInput();clearLook();els.passcodeModal.classList.remove('hidden');els.passcodeInput.value='';els.passcodeError.style.display='none';els.passcodeInput.focus();} else if(activeInteraction==='gift')openGift(); else if(activeInteraction==='book')openBook(); }

const EYE_HEIGHT=1.98,playerPosition=new THREE.Vector3(0,0,15),horizontalVelocity=new THREE.Vector3(),desiredVelocity=new THREE.Vector3(),direction=new THREE.Vector3(),forward=new THREE.Vector3(),right=new THREE.Vector3(),mobileMove=new THREE.Vector2();
let mobileSprint=false,yaw=0,pitch=0,verticalOffset=0,verticalVelocity=0,grounded=true,bobPhase=0,landingKick=0,stepTimer=0,stickPointer=null;
camera.position.set(playerPosition.x,EYE_HEIGHT,playerPosition.z);camera.rotation.order='YXZ';
function clearKeys(){Object.keys(keys).forEach(k=>keys[k]=false);}
function clearInput(){clearKeys();mobileMove.set(0,0);horizontalVelocity.set(0,0,0);if(els.stickThumb)els.stickThumb.style.transform='translate3d(0,0,0)';}
function gameplayBlocked(){return els.pause.classList.contains('visible')||!els.bookModal.classList.contains('hidden')||!els.help.classList.contains('hidden')||!els.passcodeModal.classList.contains('hidden')||!els.installGuide.classList.contains('hidden');}
function positionBlocked(x,z){
  if(x<-17||x>17||z<-7.7||z>22)return true;
  if(z<4.58&&z>4.02&&(!doorOpen||Math.abs(x)>1.17))return true;
  if(z<4.35&&z>-6.45&&Math.abs(x)>6.02&&Math.abs(x)<6.92)return true;
  if(z<-5.92&&z>-6.72&&Math.abs(x)<6.75)return true;
  if(x>-3.2&&x<3.2&&z>-3.82&&z<-1.15)return true;
  return false;
}
function requestJump(){if(!started||gameplayBlocked()||!grounded)return;grounded=false;verticalVelocity=5.45;synth('jump');}
function applyLook(dx,dy){yaw-=dx*(isTouch?.0041:.00245);pitch=THREE.MathUtils.clamp(pitch-dy*(isTouch?.0036:.00225),-Math.PI*.46,Math.PI*.46);camera.rotation.set(pitch,yaw,0,'YXZ');}
function clearLook(){draggingLook=false;lookPointer=null;renderer.domElement.style.cursor='grab';}
function beginLook(e){if(!started||gameplayBlocked())return;draggingLook=true;lookPointer=e.pointerId;lastLookX=e.clientX;lastLookY=e.clientY;e.currentTarget.setPointerCapture?.(e.pointerId);renderer.domElement.style.cursor='grabbing';}
function moveLook(e){if(!draggingLook||e.pointerId!==lookPointer||gameplayBlocked())return;const dx=e.pointerType==='mouse'&&Number.isFinite(e.movementX)?e.movementX:e.clientX-lastLookX,dy=e.pointerType==='mouse'&&Number.isFinite(e.movementY)?e.movementY:e.clientY-lastLookY;lastLookX=e.clientX;lastLookY=e.clientY;applyLook(dx,dy);}
renderer.domElement.style.cursor='grab';
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')beginLook(e);});renderer.domElement.addEventListener('pointermove',moveLook);renderer.domElement.addEventListener('pointerup',clearLook);renderer.domElement.addEventListener('pointercancel',clearLook);
els.lookZone.addEventListener('pointerdown',beginLook);els.lookZone.addEventListener('pointermove',moveLook);els.lookZone.addEventListener('pointerup',clearLook);els.lookZone.addEventListener('pointercancel',clearLook);
function updateStick(e){if(e.pointerId!==stickPointer)return;const rect=els.moveStick.getBoundingClientRect(),dx=e.clientX-(rect.left+rect.width/2),dy=e.clientY-(rect.top+rect.height/2),radius=rect.width*.34,length=Math.hypot(dx,dy)||1,scale=Math.min(1,radius/length),x=dx*scale,y=dy*scale;mobileMove.set(x/radius,-y/radius);els.stickThumb.style.transform=`translate3d(${x}px,${y}px,0)`;}
els.moveStick.addEventListener('pointerdown',e=>{if(!started||gameplayBlocked())return;stickPointer=e.pointerId;els.moveStick.setPointerCapture?.(e.pointerId);updateStick(e);});els.moveStick.addEventListener('pointermove',updateStick);
function releaseStick(e){if(e.pointerId!==stickPointer)return;stickPointer=null;mobileMove.set(0,0);els.stickThumb.style.transform='translate3d(0,0,0)';}
els.moveStick.addEventListener('pointerup',releaseStick);els.moveStick.addEventListener('pointercancel',releaseStick);
els.mobileSprint.addEventListener('pointerdown',e=>{e.preventDefault();mobileSprint=!mobileSprint;els.mobileSprint.classList.toggle('active',mobileSprint);});
els.mobileJump.addEventListener('pointerdown',e=>{e.preventDefault();requestJump();});els.mobileInteract.addEventListener('pointerdown',e=>{e.preventDefault();interact();});
addEventListener('keydown',e=>{
  if(['KeyW','KeyA','KeyS','KeyD','KeyE','ShiftLeft','ShiftRight','Space','Escape','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(!els.bookModal.classList.contains('hidden')){if(e.code==='ArrowLeft')stepBook(-1);if(e.code==='ArrowRight')stepBook(1);if(e.code==='Escape')$('#book-close').click();return;}
  if(!els.help.classList.contains('hidden')){if(e.code==='Escape')$('[data-close="help"]').click();return;}
  if(!els.passcodeModal.classList.contains('hidden')){if(e.code==='Escape')$('[data-close="passcode"]').click();return;}
  if(!els.installGuide.classList.contains('hidden')){if(e.code==='Escape')$('[data-close="install"]').click();return;}
  if(e.code==='Escape'&&started){clearInput();clearLook();els.pause.classList.toggle('visible');return;}
  if(gameplayBlocked())return;keys[e.code]=true;if(e.code==='KeyE'&&!e.repeat)interact();if(e.code==='Space'&&!e.repeat)requestJump();
});
addEventListener('keyup',e=>keys[e.code]=false);addEventListener('blur',()=>{clearInput();clearLook();});document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();clearLook();}});
$('#start-btn').onclick=startGame;$('#resume-btn').onclick=()=>{clearInput();els.pause.classList.remove('visible');};$('#restart-btn').onclick=()=>location.reload();
$('#help-btn').onclick=()=>{clearInput();clearLook();els.pause.classList.remove('visible');els.help.classList.remove('hidden');};$('[data-close="help"]').onclick=()=>els.help.classList.add('hidden');
$('[data-close="passcode"]').onclick=()=>{clearInput();els.passcodeModal.classList.add('hidden');};
els.passcodeSubmit.onclick=()=>{if(els.passcodeInput.value==='230907'){els.passcodeModal.classList.add('hidden');openDoor();}else{els.passcodeError.style.display='block';synth('ping');}};
els.passcodeInput.onkeydown=e=>{if(e.code==='Enter')els.passcodeSubmit.click();};
els.sound.onclick=()=>{muted=!muted;els.sound.classList.toggle('muted',muted);els.sound.setAttribute('aria-pressed',String(muted));els.sound.textContent=muted?'♪':'♫';if(audioCtx?.state==='suspended'&&!muted)audioCtx.resume();if(masterGain)masterGain.gain.setTargetAtTime(muted?0:.18,audioCtx.currentTime,.04);};
$('#book-close').onclick=()=>{clearInput();els.bookModal.classList.add('hidden');document.body.classList.remove('book-open');};$('#prev-page').onclick=()=>stepBook(-1);$('#next-page').onclick=()=>stepBook(1);
let bookSwipeStart=null;els.book.addEventListener('pointerdown',e=>bookSwipeStart=e.clientX);els.book.addEventListener('pointerup',e=>{if(bookSwipeStart==null)return;const d=e.clientX-bookSwipeStart;bookSwipeStart=null;if(Math.abs(d)>55)stepBook(d<0?1:-1);});
function updatePlayer(dt){
  if(!started||gameplayBlocked())return;
  const inputX=THREE.MathUtils.clamp((Number(Boolean(keys.KeyD))-Number(Boolean(keys.KeyA)))+mobileMove.x,-1,1),inputZ=THREE.MathUtils.clamp((Number(Boolean(keys.KeyW))-Number(Boolean(keys.KeyS)))+mobileMove.y,-1,1),hasInput=Math.abs(inputX)+Math.abs(inputZ)>.04,sprinting=hasInput&&(keys.ShiftLeft||keys.ShiftRight||mobileSprint);
  camera.getWorldDirection(forward);forward.y=0;forward.normalize();right.crossVectors(forward,camera.up).normalize();direction.copy(forward).multiplyScalar(inputZ).addScaledVector(right,inputX);if(direction.lengthSq()>1)direction.normalize();
  desiredVelocity.copy(direction).multiplyScalar(sprinting?6.05:3.55);horizontalVelocity.lerp(desiredVelocity,1-Math.exp(-(hasInput?(grounded?9.5:3.2):(grounded?12:1.8))*dt));
  const nx=playerPosition.x+horizontalVelocity.x*dt,nz=playerPosition.z+horizontalVelocity.z*dt;if(!positionBlocked(nx,playerPosition.z))playerPosition.x=nx;else horizontalVelocity.x=0;if(!positionBlocked(playerPosition.x,nz))playerPosition.z=nz;else horizontalVelocity.z=0;
  verticalVelocity-=14.5*dt;verticalOffset+=verticalVelocity*dt;if(verticalOffset<=0){if(!grounded&&verticalVelocity<-1.2){landingKick=Math.min(.085,Math.abs(verticalVelocity)*.012);synth('land');}verticalOffset=0;verticalVelocity=0;grounded=true;}
  const speed=horizontalVelocity.length();if(grounded&&speed>.18){bobPhase+=dt*(sprinting?13.5:9.2);stepTimer-=dt;if(stepTimer<=0){synth('step');stepTimer=sprinting?.28:.42;}}else stepTimer=0;
  landingKick=THREE.MathUtils.damp(landingKick,0,9,dt);const bob=grounded&&speed>.18?Math.sin(bobPhase)*(sprinting?.035:.021):0;camera.position.set(playerPosition.x,EYE_HEIGHT+verticalOffset+bob-landingKick,playerPosition.z);camera.fov=THREE.MathUtils.damp(camera.fov,sprinting?72:68,7,dt);camera.updateProjectionMatrix();
  if(!enteredHouse&&playerPosition.z<3.7){enteredHouse=true;setObjective('Go to Finn');setTimeout(()=>showDialogue('ហាយប្អូនស្រី! ​បើកកាដូទៅ!',5),500);const vig=document.getElementById('vignette');vig.classList.add('warm-flash');setTimeout(()=>vig.classList.remove('warm-flash'),900);}if(enteredHouse&&!metFinn&&playerPosition.z<.35){metFinn=true;setObjective('Open the gift');}
}

function animate(){
  requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04),t=clock.elapsedTime;
  updatePlayer(dt);updateInteraction(dt);
  // Door motion
  const target=doorOpen?-Math.PI*.58:0;doorPivot.rotation.y=THREE.MathUtils.damp(doorPivot.rotation.y,target,4.5,dt);
  // Finn cheers continuously
  finnArmL.rotation.z=-.48+Math.sin(t*4)*.16;finnArmR.rotation.z=.48-Math.sin(t*4+.7)*.16;finn.position.y=Math.abs(Math.sin(t*2.2))*.055;nameTag.material.opacity=.92+Math.sin(t*2)*.08;
  // Gift opening animation
  if(giftOpen){lid.rotation.x=THREE.MathUtils.lerp(lid.rotation.x,-1.65,1-Math.exp(-4*dt));lid.position.y=THREE.MathUtils.lerp(lid.position.y,1.55,1-Math.exp(-3*dt));book3d.rotation.y=t*.35;book3d.position.y=1.3+Math.sin(t*2)*.08;}
  balloons.forEach(b=>{b.position.y=b.userData.baseY+Math.sin(t*.8+b.userData.phase)*.045;b.rotation.z=Math.sin(t*.7+b.userData.phase)*.035;});
  clouds.forEach(c=>{c.position.x+=c.userData.drift*dt;if(c.position.x>32)c.position.x=-32;});
  // Gift glow pulse draws the eye before opening; fades afterward
  if(!giftOpen&&enteredHouse){giftGlow.intensity=12+Math.sin(t*3)*8;giftRing.material.opacity=.25+Math.sin(t*2.5)*.15;giftRing.rotation.z=t*.3;}
  else if(giftOpen){giftGlow.intensity=THREE.MathUtils.damp(giftGlow.intensity,0,5,dt);giftRing.material.opacity=THREE.MathUtils.damp(giftRing.material.opacity,0,5,dt);}
  sparkleNearGift(t);
  updateConfetti(dt);
  if(dialogueTimer>0){dialogueTimer-=dt;if(dialogueTimer<=0)els.dialogue.classList.add('hidden');}
  renderer.render(scene,camera);
}
animate();

function resizeExperience(){
  syncAppHeight();const {width,height}=viewportSize();camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setPixelRatio(Math.min(devicePixelRatio,isTouch?1.35:1.85));renderer.setSize(width,height);
}
addEventListener('resize',resizeExperience);addEventListener('orientationchange',()=>{clearInput();setTimeout(resizeExperience,120); setTimeout(resizeExperience,300); setTimeout(resizeExperience,600); }); window.visualViewport?.addEventListener('resize',resizeExperience);document.addEventListener('fullscreenchange',resizeExperience);
mobileBookMedia.addEventListener?.('change',()=>{if(els.bookModal.classList.contains('hidden'))return;mobilePage=pageSpread*2;renderBook(pageSpread);});

// Non-advertised art-direction views for reviewing the scene without changing game progress.
const previewStage=new URLSearchParams(location.search).get('preview');
if(previewStage==='finn'||previewStage==='book'){
  started=true;doorOpen=true;enteredHouse=true;metFinn=true;
  els.intro.classList.remove('visible');els.hud.classList.remove('hidden');
  playerPosition.set(0,0,.6);camera.position.set(0,EYE_HEIGHT,.6);yaw=0;pitch=0;camera.lookAt(0,1.8,-4.1);setObjective('Open the gift on the table');
  if(previewStage==='book'){
    giftOpen=true;book3d.visible=true;els.bookModal.classList.remove('hidden');document.body.classList.add('book-open');mobilePage=0;renderBook();
  }
}
