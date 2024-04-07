
function LoadStaticObj(url, loadingManager = null) {
    var loader;

    if (loadingManager == null) {
        loader = new THREE.GLTFLoader();
    } else {
        loader = new THREE.GLTFLoader(loadingManager);
    }

    var texture = new THREE.TextureLoader().load('/textures/illust.jpg');
    texture.center.set(0.5, 0.5);
    texture.flipY = true;
    //texture.encoding = THREE.sRGBEncoding;

    loader.load(url, function (obj) {
        obj.scene.position.set(5.77, 11, -9);

        obj.scene.traverse(function (child) {
            if (child.isMesh) {
                if (shadow) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
                
                child.material.map = texture;
            }
        })

        scene.add(obj.scene);
    })
}