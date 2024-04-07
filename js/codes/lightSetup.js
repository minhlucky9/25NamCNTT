function initLight() {


    shadowLight = new THREE.DirectionalLight(0xffffff, 1);
    shadowLight.position.set(5, 10, 7.5);
    if (shadow) {
        shadowLight.castShadow = true;
        shadowLight.shadow.mapSize.width = 1024;
        shadowLight.shadow.mapSize.height = 1024;
        shadowLight.shadow.bias = 0.0001;
        shadowLight.shadow.normalBias = 0.1;
        shadowLight.shadow.camera.far = 100;
        shadowLight.shadow.camera.right = 10;
        shadowLight.shadow.camera.left = -10;
        shadowLight.shadow.camera.top = 10;
        shadowLight.shadow.camera.bottom = -10;
        if (debug) { scene.add(new THREE.CameraHelper(shadowLight.shadow.camera)); }
    }
    scene.add(shadowLight);
}