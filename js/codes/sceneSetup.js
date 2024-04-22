

init();
animate();

function init() {

    container = document.getElementById('mainScene');

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 2, 5.6);
    camera.rotation.set( -0.46, 0, 0);
  
    scene = new THREE.Scene();

    // geometry

    InitCrown();

    //

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    //

    stats = new Stats();
    container.appendChild(stats.dom);

    //

    LoadStaticObj("/models/plane.glb");

    //

    LoadPlayer();

    //

    initLight();

    window.addEventListener('resize', onWindowResize);

    window.addEventListener("keydown", onKeyDown);
}

function onKeyDown(e) {
    if(e.key == " ") {
        lineUpAnimation = !lineUpAnimation;

        if(lineUpAnimation) {
            curTime = Infinity;
            textId = -1;
            player.scale.set(0,0,0);
        } else {
            player.scale.set(1.7,1.7,1.7);
        }
    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

//

function animate() {

    requestAnimationFrame(animate);
    let delta = clock.getDelta();
    
    delta = Math.min(delta, 0.02);

    render();
    stats.update();

    if(mixer) {
        mixer.update( delta );
    }

    if(lineUpAnimation) {
        UpdateCrowdTextLineUp(delta);
    } else {
        UpdateCrowdRandomWalk(delta);
    }
    
}

function render() {

    const time = performance.now();

    const object = scene.children[0];

    
    object.material.uniforms['time'].value = time * 0.0015;
    object.material.uniforms['sineTime'].value = Math.sin(object.material.uniforms['time'].value * 0.05);

    renderer.render(scene, camera);

}