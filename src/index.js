import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

let mixer;

const scene = new THREE.Scene(); //场景
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100); //相机
const renderer = new THREE.WebGLRenderer({ antialias: true }); //渲染器
renderer.shadowMap.enabled = true; //是否开启阴影
renderer.setSize(window.innerWidth, window.innerHeight); //渲染器大小

document.body.appendChild(renderer.domElement); //绑定到dom元素上
scene.background = new THREE.Color(0.9, 0.9, 0.9); //场景背景色

const directionLight = new THREE.DirectionalLight(0xffffff, 0.8); //定向光源
directionLight.castShadow = true; //投射阴影
scene.add(directionLight); //添加到场景中

directionLight.shadow.mapSize.width = 5120; //方向 光
directionLight.shadow.mapSize.height = 5120;

const shadowDistance = 50; //阴影距离
directionLight.shadow.camera.near = 0.2;
directionLight.shadow.camera.far = 100;
directionLight.shadow.camera.left = shadowDistance;
directionLight.shadow.camera.right = shadowDistance;
directionLight.shadow.camera.top = shadowDistance;
directionLight.shadow.camera.bottom = shadowDistance;
directionLight.shadow.bias = -0.0001;

new GLTFLoader().load('../resources/models/GameManage.glb', (gltf) => {
	scene.add(gltf.scene);
	gltf.scene.traverse((child) => {
		child.castShadow = true;
		child.receiveShadow = true;
	});
});


let playMesh;
let playerMixer;
let actionIdle;
let actionWalk;
let actionRun;
new GLTFLoader().load('../resources/models/Xbot.glb', (gltf) => {
	playMesh = gltf.scene;
	scene.add(playMesh);
	gltf.scene.traverse((child) => {
		child.castShadow = true;
		child.receiveShadow = true;
	});
	playMesh.position.set(0, 0, 3.5); //设置模型位置
	playMesh.rotateY(Math.PI); //模型翻转
	playMesh.add(camera); //给模型添加相机
	camera.position.set(0, 2, -6); //相机位置
	camera.lookAt(new THREE.Vector3(0, 2, 3));
	const pointLight = new THREE.PointLight(0xffffff, 1);
	scene.add(pointLight);
	playMesh.add(pointLight);
	pointLight.position.set(0, 2, -1);
	playerMixer = new THREE.AnimationMixer(gltf.scene);
	const clipIdle = THREE.AnimationUtils.subclip(gltf.animations[0], 'idle', 0, 250);
	actionIdle = playerMixer.clipAction(clipIdle);
	actionIdle.play();
	const clipWalk = THREE.AnimationUtils.subclip(gltf.animations[6], 'walk', 0, 250);
	actionWalk = playerMixer.clipAction(clipWalk);
	const clipRun = THREE.AnimationUtils.subclip(gltf.animations[3], 'run', 0, 250);
	actionRun = playerMixer.clipAction(clipRun);
});

let isWalk = true;//true为静止 false为走
let isrun = true; //true为静止 false为跑
let angleOfView = false;
window.addEventListener('keydown', (e) => {
	if (e.key === 'w') {
		movement();
		if (isWalk) {
			crossPlay(actionIdle, actionWalk);
			isWalk = false;
		}
	}
	if (e.key === 's') {
		playMesh.translateZ(-0.1);
		if (isWalk) {
			crossPlay(actionIdle, actionWalk);
			isWalk = false;
		}
	}
	if (e.key === 'a') {
		playMesh.translateX(0.01);
		playMesh.rotateY(Math.PI / 150);
		if (isWalk) {
			crossPlay(actionIdle, actionWalk);
			isWalk = false;
		}
	}
	if (e.key === 'd') {
		playMesh.rotateY(Math.PI / -150);
		playMesh.translateX(-0.01);
		if (isWalk) {
			crossPlay(actionIdle, actionWalk);
			isWalk = false;
		}
	}
	if (e.key === 'Shift') {
		palyRun();
		if (isrun) {
			crossPlay(actionIdle, actionRun);
			isrun = false;
		}
	}
	if (e.key === 'y') {
		if (angleOfView) {
			camera.position.set(0, 2, 0);
			angleOfView = false;
		} else {
			camera.position.set(0, 2, -6);
			angleOfView = true;
		}
	}
	if (e.code === 'Space') {
		playMesh.translateY(2);
		playMesh.translateZ(2);
	}
});
window.addEventListener('keyup', (e) => {
	if (e.key === 'w' || 's' || 'a' || 'd') {
		if (!isWalk) {
			crossPlay(actionWalk, actionIdle);
			isWalk = true;
		}
	}
	if (e.code === 'Space') {
		playMesh.translateY(-2);
	}
	if (e.code === 'ShiftLeft') {
		console.log(e.code);
		if (!isrun) {
			crossPlay(actionRun, actionIdle);
			isrun = true;
		}
	}
});

let prePos;
// 鼠标旋转修改镜头方向
window.addEventListener('mousemove', (e) => {
	if (prePos) {
		playMesh.rotateY(-(e.clientX - prePos) * 0.01);
	}
	prePos = e.clientX;
});

function crossPlay(curAction, newAction) {
	curAction.fadeOut(0.5);
	newAction.reset();
	newAction.setEffectiveWeight(1);
	newAction.play();
	newAction.fadeIn(0.5);
}
const playerHalfHeight = new THREE.Vector3(0, 0.8, 0);

function movement() {
	const curPos = playMesh.position.clone();
	playMesh.translateZ(1);
	const frontPos = playMesh.position.clone();
	playMesh.translateZ(-1);
	const frontVector3 = frontPos.sub(curPos).normalize();
	const raycasterFront = new THREE.Raycaster(playMesh.position.clone().add(playerHalfHeight), frontVector3);
	const collisionResultsFrontObjs = raycasterFront.intersectObjects(scene.children);
	if (collisionResultsFrontObjs && collisionResultsFrontObjs[0] && collisionResultsFrontObjs[0].distance > 1) {
		playMesh.translateZ(0.1);
	}
}
function palyRun() {
	const curPos = playMesh.position.clone();
	playMesh.translateZ(1);
	const frontPos = playMesh.position.clone();
	playMesh.translateZ(-1);
	const frontVector3 = frontPos.sub(curPos).normalize();
	const raycasterFront = new THREE.Raycaster(playMesh.position.clone().add(playerHalfHeight), frontVector3);
	const collisionResultsFrontObjs = raycasterFront.intersectObjects(scene.children);
	if (collisionResultsFrontObjs && collisionResultsFrontObjs[0] && collisionResultsFrontObjs[0].distance > 1) {
		playMesh.translateZ(0.2);
	}
}
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight; // 在窗口调整大小
	camera.updateProjectionMatrix(); // 更新投影矩阵
	renderer.setSize(window.innerWidth, window.innerHeight);
}
function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	window.addEventListener('resize', onWindowResize);
	// controls.update();
	if (mixer) {
		mixer.update(0.02);
	}
	if (playerMixer) {
		playerMixer.update(0.015);
	}
}
animate();
