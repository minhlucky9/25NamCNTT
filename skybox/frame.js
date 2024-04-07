
$(document).ready(function () {
    const host = "https://1.55.212.49:3000/";
    const urlParams = new URLSearchParams(window.location.search);
    var modelname = urlParams.get('m');
    var width = $('#final-canvas').width();
    var height = $('#final-canvas').height();

    var canvas = document.getElementById("final-canvas");
    const container = document.getElementById("canvasContainer");
    const mainRenderer = new THREE.WebGLRenderer();

    mainRenderer.setSize(width, height);
    mainRenderer.shadowMap.enabled = true;
    mainRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mainRenderer.setPixelRatio(window.devicePixelRatio);

    //container.appendChild(mainRenderer.domElement);

    //card item
    var card_frame = new Image(width, height);
    card_frame.src = "images/card/Rarelity_Card_frame/rarity_0005_mythical.png";
    var origin_text = new Image();
    origin_text.src = "images/card/Origin.png";
    var star_holder = new Image();
    star_holder.src = "images/card/star/Star_holder.png";
    var gradient = new Image();
    gradient.src = "images/card/star/gardient.png";
    var star = new Image();
    star.src = "images/card/star/star-_0003_4.png";
    var className = new Image();
    className.src = "images/card/Clan_name_text/name_0000_Shroomies.png";
    var elementalIcon = new Image();
    elementalIcon.src = "images/card/elemental_icon/element_0000_water.png";
    var classIcon = new Image();
    classIcon.src = "images/card/class_icon/class_0000_mage.png";

    var magicFont = new FontFace('magicFont', 'url(font/MagicSchoolOne.ttf)');
    magicFont.load().then(function(font){
        document.fonts.add(font);
    });
    //init scene
    //other variable


    var currentBody;
    var modelInfos = [];

    //setup scene
    var scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        50,
        width / height,
        0.1,
        1000
    );
   
    camera.position.x = -0.441;
    camera.position.y = 0.384;
    camera.position.z = 1.397;


    //setup controls
    const controls = new THREE.OrbitControls(camera, canvas);
    controls.target = new THREE.Vector3(0, 0.5, 0);
    controls.enablePan = false;
    controls.enableDamping=true;
    controls.maxDistance = 2.2;
    controls.minDistance = 1.8;
    controls.zoomSpeed = 1;
    controls.minAzimuthAngle = -Math.PI / 20;
    controls.maxAzimuthAngle = Math.PI / 20;
    controls.minPolarAngle = Math.PI / 2;
    controls.maxPolarAngle = Math.PI / 1.7;

    //init object to scene
    // Instantiate a loader
    const gltfLoader = new THREE.GLTFLoader();
    const txtureLoader = new THREE.TextureLoader();

    //init light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.castShadow = false;
    directionalLight.position.set(2, 20, 2);
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    // directionalLight.shadow.camera.near = 0.5;
    // directionalLight.shadow.camera.far = 300;
    // directionalLight.shadow.camera.top = 50;
    // directionalLight.shadow.camera.bottom = -1;
    // directionalLight.shadow.camera.left = -1;
    // directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.bias = -0.001;
    //scene.add(directionalLight);
    const light = new THREE.HemisphereLight(0x5b4710, 0x5044a7, 2);
    scene.add(light);

    const directionalLight2 = new THREE.DirectionalLight(0x83aef2, 0.5);
    directionalLight2.position.set(10, 0, -3);
    scene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0xf2e196, 0.5);
    directionalLight2.position.set(-10, 0, -3);
    //scene.add(directionalLight3);

    const spotLight = new THREE.SpotLight(0xfcf2bb, 0.3, 10, Math.PI / 14, 1, 2);
    spotLight.position.set(0.8, 3, 0.8);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.shadow.bias = -0.004;
    scene.add(spotLight);



    //const spotLightHelper = new THREE.SpotLightHelper( spotLight );
    //scene.add( spotLightHelper );

    function LoadModelEnvironment(index) {

        //load environment
        const cubeTextLoader = new THREE.CubeTextureLoader();
        cubeTextLoader.setPath(enviMap[index]);

        const textureCube = cubeTextLoader.load([
            "px.png",
            "nx.png",
            "py.png",
            "ny.png",
            "pz.png",
            "nz.png",
        ]);

        scene.background = textureCube;
        scene.environment = textureCube;

        //load models
        gltfLoader.load("models/envi/deadwood.glb", function (glb) {
            model = glb.scene;
            model.traverse(function (child) {
                child.receiveShadow = true;
                child.castShadow = true;
            })
            model.scale.set(0.01, 0.01, 0.01);
            //
            model.position.z -= 0.2;
            scene.add(model);
        })
    }

    function LoadBody(modelUrl) {

        if (currentBody) {
            removeModelFromScene(currentBody);
        }

        gltfLoader.load(host + modelUrl, function (gltf) {

            currentBody = gltf.scene;
            currentBody.scale.set(0.01, 0.01, 0.01);
            var center = new THREE.Vector3();
            new THREE.Box3().setFromObject(gltf.scene).getCenter(center);
            currentBody.position.set(-center.x, -center.y, -center.z);

            UpdateCharacterDetails();

            //addmodel to scene
            scene.add(currentBody);

            //animation setting
            mixer = new THREE.AnimationMixer(currentBody);

            for (var i = 0; i < gltf.animations.length; i++) {
                var action = mixer.clipAction(gltf.animations[i]);
                action.play();
            }


        });
    }

    function LoadOther(modelInfo) {

        switch (modelInfo.partHero_content) {
            case "Model":
                gltfLoader.load(host + modelInfo.partHeroModel, function (glb) {
                    model = glb.scene;
                    modelInfo.model = model;
                    //
                    model.rotation.x -= Math.PI / 2;
                    UpdateCharacterDetails();

                })
                break;

            case "Texture":
                txtureLoader.load(host + modelInfo.partHeroTexture, function (texture) {
                    modelInfo.texture = texture;
                    //
                    modelInfo.texture.center.set(0.5, 0.5);
                    modelInfo.texture.rotation = Math.PI;

                    UpdateCharacterDetails();

                })
                break;
        }



    }

    function LoadGetModel() {
        $.post(host + "api/getmodel",
        { 
          "modelname": modelname
        },
        function (data, status) {
          if (status == "success") {

            if(data.part_info) {
                modelInfos = data.part_info;
                //
                for(var i = 0; i < data.part_info.length; i ++) {
                    $('.slot-equip #' + data.part_info[i].partHero_type).attr("src", host + data.part_info[i].partHeroPNG);
                    if (data.part_info[i].partHero_type == "B") {
                        LoadBody(data.part_info[i].partHeroModel);
                    } else {
                        LoadOther(data.part_info[i]);
                    }
                }
            } else {
                alert(data);
            }
            
          } 
        });

    }


    function UpdateCharacterDetails() {

        if (currentBody) {
            currentBody.traverse(function (child) {
                child.castShadow = true;
                child.receiveShadow = true;

                for (var i = 0; i < modelInfos.length; i++) {
                    if (modelInfos[i].partHero_type != "B") {
                        if (child.name == modelInfos[i].partHero_location && modelInfos[i].model && modelInfos[i].partHero_content == "Model") {
                            child.children = [];
                            //
                            modelInfos[i].model.parent = child;
                            child.children.push(modelInfos[i].model);
                        }

                        if (child.name == modelInfos[i].partHero_location && modelInfos[i].texture && modelInfos[i].partHero_content == "Texture") {
                            child.material.map = modelInfos[i].texture;
                        }
                    }
                }

            })
        }
    }

    //post-processing
    const renderScene = new THREE.RenderPass(scene, camera);
    const bloomComposer = new THREE.EffectComposer(mainRenderer);

    const paramsPostProcessing = {
        exposure: 2,
        bloomStrength: 0.7,
        bloomThreshold: 0.1,
        bloomRadius: 1,
    };

    //bloom
    const bloomPass = new THREE.UnrealBloomPass(new THREE.Vector2(width, height), 1.5, 0.4, 0.85);
    bloomPass.threshold = paramsPostProcessing.bloomThreshold;
    bloomPass.strength = paramsPostProcessing.bloomStrength;
    bloomPass.radius = paramsPostProcessing.bloomRadius;


    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);


    //animation
    var mixer;
    var clock = new THREE.Clock();

    var enviMap = {
        0: "skybox/deadwood/"
    };

    LoadModelEnvironment(0);
    LoadGetModel();

    function removeModelFromScene(model) {
        scene.remove(model);
        model.traverse(function (child) {
            if (child.isMesh) {
                child.geometry.dispose();
                //dispose texture
                if (child.material.map) {
                    child.material.map.dispose();
                }

                if (child.material.metalnessMap) {
                    child.material.metalnessMap.dispose();
                }

                if (child.material.normalMap) {
                    child.material.normalMap.dispose();
                }

                if (child.material.roughnessMap) {
                    child.material.roughnessMap.dispose();
                }

                if (child.material.emissiveMap) {
                    child.material.emissiveMap.dispose();
                }

                if (child.material.alphaMap) {
                    child.material.alphaMap.dispose();
                }
            }
        })

    };


    animate();
    //

    function animate() {

        requestAnimationFrame(animate);
        render();

    }

    function render() {
        //render texture
        controls.update();
        if (mixer) {
            mixer.update(0.025);
        }

        mainRenderer.render(scene, camera);
        bloomComposer.render();
    
        var ctx = canvas.getContext("2d");
        ctx.drawImage(mainRenderer.domElement, 0, 0);
        
        
        ctx.drawImage(gradient, 0, height * 0.8 , width, height * 0.2);
        ctx.drawImage(star_holder, 0, height * 0.91 , width, height * 0.05);
        ctx.drawImage(star, width * 0.34, height * 0.915, width * 0.32, height * 0.04);
        ctx.drawImage(origin_text, width * 0.375, height * 0.07, width * 0.25, height * 0.1);
        ctx.drawImage(className, width * 0.25, height * 0.75, width * 0.5, height * 0.15);
        ctx.drawImage(elementalIcon, width * 0.08, height * 0.82, width * 0.1, height * 0.075);
        ctx.drawImage(classIcon, width * 0.82, height * 0.82, width * 0.1, height * 0.075);
        ctx.drawImage(card_frame, 0, 0, width, height);
        //draw text
        ctx.font = '20px magicFont';
        ctx.fillStyle = "#ff9d3b";
        ctx.textAlign = "center";
        ctx.fillText('#165489', width * 0.5, height * 0.895);

    }

    // setInterval(function() {
    //     console.log(mainRenderer.info);
        
    // }, 4000)

    var i = 0;
    setInterval(function(){
        i = i % 10 + 1;
        card_frame.src = "images/card/Rarelity_Card_frame/frame_sequence/Asset " + i + ".png";
        i += 1;
    }, 150)


    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize() {

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        mainRenderer.setSize($('#final-canvas').width(), $('#final-canvas').height());
        
    }
})

