THREE.TreeSwing = function() {
    var shaderMaterials = [];
    var windNoiseMap = new THREE.TextureLoader().load("images/Wind_Noise.png", function() {
        windNoiseMap.flipY = false;
        windNoiseMap.encoding = THREE.sRGBEncoding;
    });


    function init(object) {
        object.userData.material = object.material;
        //
        var materialShader = new THREE.ShaderMaterial( {
			uniforms: THREE.UniformsUtils.merge( [ THREE.UniformsLib[ 'fog' ], THREE.UniformsLib[ 'lights' ], {
                'time': {
                    value: 0.0
                },
                'colorTexture': { 
                    value: null 
                },
                "noiseAmount": {
                    value: new THREE.Vector3()
                },
                "windNoise": {
                    value: null
                },
                "windNoiseScale": {
                    value: 1.0
                }
            }]),
			vertexShader: `

            uniform vec3 noiseAmount;
            uniform float time;
            uniform sampler2D windNoise;
            uniform float windNoiseScale;
    
            attribute vec4 color;
    
            varying vec3 vPosition;
            varying vec4 vColor;
            varying vec2 vUv;
            varying vec4 worldPosition;

            #include <common>
			#include <fog_pars_vertex>

            void main()	{
    
                vUv = uv;
                vPosition = position;
                vColor = color;
    
                worldPosition =  (modelMatrix * vec4(position, 1.0)).xyzw;
                vec3 newPos = position;
                vec2 newUv = worldPosition.xz;
                newUv.xy += sin(time) + 1.0 ;
                vec3 wind = texture2D( windNoise, newUv.xy * windNoiseScale).rgb ;
    
                newPos.z += sin(time*2.0) * color.a * noiseAmount.z * color.r * wind.g;
                newPos.z += sin(time*0.5) * color.a * noiseAmount.z * color.g * wind.g;
                newPos.z += sin(time*1.5) * color.a * noiseAmount.z * color.b * wind.g;
    
                newPos.x += sin(time*1.0) * color.a * noiseAmount.x * color.r * wind.r;
                newPos.x += sin(time*0.5) * color.a * noiseAmount.x * color.g * wind.r;
                newPos.x += sin(time*2.5) * color.a * noiseAmount.x * color.b * wind.r;
    
                newPos.y += wind.r * noiseAmount.y * color.a ;
                newPos.y += wind.g * noiseAmount.y * color.a ;
                newPos.y += wind.b * noiseAmount.y * color.a ;
                
                vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );
                gl_Position = projectionMatrix * modelViewMatrix * vec4( newPos, 1.0 );

                
				#include <fog_vertex>
	
            }`,
			fragmentShader:`
    
            uniform float time;
            uniform sampler2D colorTexture;

            varying vec3 vPosition;
            varying vec4 vColor;
            varying vec2 vUv;
            varying vec4 worldPosition;

            #include <common>
			#include <fog_pars_fragment>
				

            void main()	{
    
                vec4 color = vec4(texture2D( colorTexture, vUv ).rgba );
                if (color.a < 0.5) discard;
    
                gl_FragColor = color;

				#include <fog_fragment>
            }`,
			side: THREE.DoubleSide,
			transparent: true,
            fog: true
		});
        
        materialShader.uniforms['time'].value = Math.random() * 1.5;
        materialShader.uniforms['colorTexture'].value = object.userData.material.map;
        materialShader.uniforms['windNoise'].value = windNoiseMap;
        materialShader.uniforms['noiseAmount'].value = new THREE.Vector3(1.5, 0, 1.5);

        object.material = materialShader;
        //
        shaderMaterials.push(materialShader);
    }

    function update(delta) {
        for(var i = 0; i < shaderMaterials.length; i ++) {
            shaderMaterials[i].uniforms['time'].value += delta;
        }
    }

    return {
        init: init,
        update: update
    }
}