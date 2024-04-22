const instances = 60;
let velocities = [];
let update_times = [];
const positions = [];
const offsets = [];
const colors = [];
const uvs = [];

let speedScale = 0.4;
let fontVectors = new FontVector();
let textPositions = [];

function InitCrown() {
    const vector = new THREE.Vector4();

    //create position
    positions.push(-0.12 , -0.24, 0);
    positions.push(0.12, -0.24, 0);
    positions.push(-0.12, 0.24, 0);
    positions.push(0.12 , -0.24, 0);
    positions.push(0.12, 0.24, 0);
    positions.push(-0.12, 0.24, 0);

    //create uv
    uvs.push(0 , 0);
    uvs.push(1, 0);
    uvs.push(0, 1);
    uvs.push(1 , 0);
    uvs.push(1, 1);
    uvs.push(0, 1);

    // instanced attributes

    for (let i = 0; i < instances; i++) {

        // offsets

        offsets.push((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6);

        // velocity
        let vel = new THREE.Vector3((Math.random() - 0.5), 0, (Math.random() - 0.5));
        velocities.push(vel.x, vel.y, vel.z);

        //
        update_times.push(getUpdateVelocityTime());

        // colors

        colors.push(Math.random(), Math.random(), Math.random(), Math.random());

    }

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.instanceCount = instances; // set so its initalized for dat.GUI, will be set in first draw otherwise

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(uvs), 2));
    geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
    geometry.setAttribute('color', new THREE.InstancedBufferAttribute(new Float32Array(colors), 4));

    // material
    
    const material = new THREE.RawShaderMaterial({

        uniforms: {
            'time': { value: 1.0 },
            'sineTime': { value: 1.0 },
            'cameraPos': { value: camera.position },
            'tex': { value: THREE.ImageUtils.loadTexture( "./textures/humans/human.png" )}
        },
        vertexShader: `
        precision highp float;
    
        uniform float sineTime;
        uniform float time;
        uniform vec3 cameraPos;
    
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
    
        attribute vec3 position;
        attribute vec3 offset;
        attribute vec4 color;
        attribute vec2 uv;
        attribute vec2 velocity;
    
        varying vec3 vPosition;
        varying vec4 vColor;
        varying vec2 vUv;
        
        mat3 lookAtPoint(vec3 eye, vec3 at) {

            vec3 localUp = vec3(0, 1, 0); // temp sop space up vector
            vec3 fwd = normalize(at - eye); // direction to look at position
            vec3 right = normalize(cross(localUp, fwd)); // right vector of direction
            vec3 up = normalize(cross(fwd, right)); // up vector of direction
        
            return mat3(right, up, fwd);
        }

        float random(vec2 p){
            return fract(sin(dot(p.xy ,vec2(12.9898,78.233))) * 43758.5453);
        }

        vec2 spriteUVSelector( vec2 uv, vec2 tile, float frames, float time, float offset ) {

            float t = floor(frames * mod( time, 1.0 ) );
            t += offset;
        
            uv.x += mod(t, tile.x);
            uv.y -= floor(t / tile.x);
        
            uv.y -= 1.0;
            uv /= tile;
            uv.y += 1.0;
            
            return uv;
            
        }

        void main(){
            //random position
            vec3 p = offset;
            
            //look at camera
            vPosition = position + p;

            //
            gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
            
            //send to fragment shader
            vColor = color;
            vUv = uv;
            float offsetUV = abs(velocity.x) > 0.005 ? 16.0 : 0.0;

            vUv = spriteUVSelector( vUv, vec2( 16.0, 2.0 ), 16.0, time, offsetUV );

            if( offsetUV > 0.0 && velocity.x < 0.00 ) {
                vUv.x = 1.0 - vUv.x;
            }
        }`,
        fragmentShader: `
        precision highp float;
    
        uniform float time;
        uniform sampler2D tex;

        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec4 vColor;
    
        void main() {
    
            vec2 computeUv = vUv;
            vec4 color = vec4( vColor );
            color = texture2D(tex, computeUv);
            
            if( color.w < 0.5 ) {

                discard;
                
            }
            gl_FragColor = color;
    
        }`,
        side: THREE.DoubleSide,
        forceSinglePass: true,
        transparent: true

    });

    //

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = 1;
    scene.add(mesh);

    //

    setTimeout(function() {
        if(fontVectors) {
            textPositions.push(shuffle(fontVectors.getPointsOfChar('C', instances, 0.2)))
            textPositions.push(shuffle(fontVectors.getPointsOfChar('D', instances, 0.2)))
            textPositions.push(shuffle(fontVectors.getPointsOfChar('I', instances, 0.2)))
            textPositions.push(shuffle(fontVectors.getPointsOfChar('T', instances, 0.2)))
        }
    }, 1000);

    
}

function getUpdateVelocityTime() {
    return Math.max(Math.random() * 2, 1);
}

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

function smoothstep(edge0, edge1, x) {
    let k = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return k * k * (3 - 2 * k); 
}

let textId = -1;
let curTime = Infinity;
let transitionTime = 1.2;
let holdTime = 1;
function UpdateCrowdTextLineUp(delta) {
    if(textPositions.length <= 0) 
        return;
    
    //check condition to update velocity
    let updateVelocity = false;

    curTime = curTime + delta;
    if(curTime > transitionTime + holdTime) {
        updateVelocity = true;
        curTime = 0;
        textId  = (textId + 1) % textPositions.length;
    }

    //calculate velocity and move 
    let moveTime = 1 - Math.min(curTime, transitionTime) / transitionTime;


    for (let i = 0; i < instances; i++) {
        
        let curPos = new THREE.Vector3(offsets[i * 3], offsets[i * 3 + 1], offsets[i * 3 + 2]);

        let textPos = textPositions[textId][0];
        if(i < textPositions[textId].length ) {
            textPos = textPositions[textId][i];
        }
        
        if(updateVelocity) {
            let vel = curPos.clone().sub(textPos);
            velocities[i * 3] = -vel.x;
            velocities[i * 3 + 2] = vel.z;
        } 
        
        // offsets
        offsets[i * 3] = textPos.x - (velocities[i * 3]) * moveTime; 
        offsets[i * 3 + 1] = textPos.y + (velocities[i * 3 + 1]) * moveTime; 
        offsets[i * 3 + 2] = textPos.z + (velocities[i * 3 + 2]) * moveTime; 
    }

    if(moveTime == 0) {
        let velos = [];
        scene.children[0].geometry.setAttribute('velocity', new THREE.InstancedBufferAttribute(new Float32Array(velos), 3));
        return;
    }
    //
    scene.children[0].geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
    scene.children[0].geometry.setAttribute('velocity', new THREE.InstancedBufferAttribute(new Float32Array(velocities), 3));
    
    
}

function UpdateCrowdRandomWalk(delta) {
    let velocitiesFinal = [];
    for (let i = 0; i < instances; i++) {
        let updateVelocity = false;
        let curPos = new THREE.Vector3(offsets[i * 3], offsets[i * 3 + 1], offsets[i * 3 + 2]);
        update_times[i] -= delta;

        if(update_times[i] < 0) {
            updateVelocity = true;
            update_times[i] = getUpdateVelocityTime();
        }

        if(updateVelocity) {
            let vel = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5);
            //vel.normalize();
            velocities[i * 3] = vel.x;
            velocities[i * 3 + 2] = vel.z;
        }

        //centre avoid
        let distance = curPos.length();
        let dirOut = curPos.normalize();
        
        let velocityOut = dirOut.clone().multiplyScalar( smoothstep(1.2, 1, distance) );
        
        //center gravity
        let velocityIn = dirOut.clone().negate().multiplyScalar( smoothstep(3, 3.5, distance) );

        let veloFinal = new THREE.Vector3(velocities[i * 3], velocities[i * 3 + 1], velocities[i * 3 + 2]).add( velocityIn ).add( velocityOut).normalize();
        
        // offsets
        offsets[i * 3] += veloFinal.x * delta * speedScale; 
        offsets[i * 3 + 1] += veloFinal.y * delta * speedScale; 
        offsets[i * 3 + 2] += veloFinal.z * delta * speedScale; 

        //velocities
        velocitiesFinal[i * 3] = veloFinal.x;
        velocitiesFinal[i * 3 + 1] = veloFinal.y;
        velocitiesFinal[i * 3 + 2] = veloFinal.z;

    }

    //
    scene.children[0].geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
    scene.children[0].geometry.setAttribute('velocity', new THREE.InstancedBufferAttribute(new Float32Array(velocitiesFinal), 3));
}

function shuffle(array) {
    let currentIndex = array.length;
  
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
  
      // Pick a remaining element...
      let randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}