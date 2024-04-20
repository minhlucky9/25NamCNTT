let mixer;
let clips;
let player;

function LoadPlayer(loadingManager = null) {
    var loader;

    if (loadingManager == null) {
        loader = new THREE.GLTFLoader();
    } else {
        loader = new THREE.GLTFLoader(loadingManager);
    }

  
    loader.load("/models/baku.glb", function (obj) {
        player = obj.scene;
        
        player.rotation.set(0, -0.61, 0);
        player.position.z = 1;
        player.scale.set(1.7,1.7,1.7);

        player.traverse(function (child) {
            if (child.isMesh) {
                if (shadow) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            }
        })

        scene.add(player);

        //set up animation
        mixer = new THREE.AnimationMixer( player.children[0].children[0] );
        clips = obj.animations;

        // Play a specific animation
        let clip = THREE.AnimationClip.findByName( clips, 'section_4_jump' );
        let action = mixer.clipAction( clip );
        action.play();
    })
}

