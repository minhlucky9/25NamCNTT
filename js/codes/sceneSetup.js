

init();
animate();

function init() {

    container = document.getElementById('mainScene');

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(1.7, 3, 4);
    camera.rotation.set( -0.7, 0.33, 0.261);
  
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

    //LoadPlayer();

    //

    initLight();

    window.addEventListener('resize', onWindowResize);

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
    
    render();
    stats.update();

    if(mixer) {
        mixer.update( delta );
    }

    //UpdateCrowdRandomWalk(delta);
    UpdateCrowdTextLineUp(delta);
}

function render() {

    const time = performance.now();

    const object = scene.children[0];

    
    object.material.uniforms['time'].value = time * 0.005;
    object.material.uniforms['sineTime'].value = Math.sin(object.material.uniforms['time'].value * 0.05);

    renderer.render(scene, camera);

}