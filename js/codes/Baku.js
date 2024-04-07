let mixer;
let clips;

function LoadPlayer(loadingManager = null) {
    var loader;

    if (loadingManager == null) {
        loader = new THREE.GLTFLoader();
    } else {
        loader = new THREE.GLTFLoader(loadingManager);
    }

  
    loader.load("/models/baku.glb", function (obj) {
        let mesh = obj.scene;
        
        mesh.rotation.set(0, -0.61, 0);
        mesh.scale.set(2,2,2);

        mesh.traverse(function (child) {
            if (child.isMesh) {
                if (shadow) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            }
        })

        scene.add(mesh);

        console.log(mesh);

        //set up animation
        mixer = new THREE.AnimationMixer( mesh.children[0].children[0] );
        clips = obj.animations;

        // Play a specific animation
        let clip = THREE.AnimationClip.findByName( clips, 'section_4_jump' );
        let action = mixer.clipAction( clip );
        action.play();
    })
}

