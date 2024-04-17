const instances = 60;
let velocities = [];
let update_times = [];
const positions = [];
const offsets = [];
const colors = [];
let speedScale = 0.7;
let fontVectors = new FontVector();
let textPositions = [];

function InitCrown() {
    const vector = new THREE.Vector4();

    positions.push(-0.1 , -0.2, 0);
    positions.push(0.1, -0.2, 0);
    positions.push(-0.1, 0.2, 0);
    positions.push(0.1 , -0.2, 0);
    positions.push(0.1, 0.2, 0);
    positions.push(-0.1, 0.2, 0);

    // instanced attributes

    for (let i = 0; i < instances; i++) {

        // offsets

        offsets.push((Math.random() - 0.5) * 5, 0, (Math.random() - 0.5) * 5);

        // velocity
        let vel = new THREE.Vector3(0, 0, 0);
        velocities.push(vel.x, vel.y, vel.z);

        //
        update_times.push(getUpdateVelocityTime());

        // colors

        colors.push(Math.random(), Math.random(), Math.random(), Math.random());

    }

    const geometry = new THREE.InstancedBufferGeometry();
    geometry.instanceCount = instances; // set so its initalized for dat.GUI, will be set in first draw otherwise

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

    geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
    geometry.setAttribute('color', new THREE.InstancedBufferAttribute(new Float32Array(colors), 4));

    // material
    
    const material = new THREE.RawShaderMaterial({

        uniforms: {
            'time': { value: 1.0 },
            'sineTime': { value: 1.0 },
            'cameraPos': { value: camera.position }
        },
        vertexShader: `
        precision highp float;
    
        uniform float sineTime;
        uniform vec3 cameraPos;
    
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
    
        attribute vec3 position;
        attribute vec3 offset;
        attribute vec4 color;

    
        varying vec3 vPosition;
        varying vec4 vColor;
        
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

        void main(){
            //random position
            vec3 p = offset;
            
            //look at camera
            mat3 lookAtMat = lookAtPoint(p, cameraPos);
            vPosition = lookAtMat * position + p;

            //random move

            
            
            //
            gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
            
            //send to fragment shader
            vColor = color;
        }`,
        fragmentShader: `
        precision highp float;
    
        uniform float time;
    
        varying vec3 vPosition;
        varying vec4 vColor;
    
        void main() {
    
            vec4 color = vec4( vColor );
            color.r += sin( vPosition.x * 10.0 + time ) * 0.5;
    
            gl_FragColor = color;
    
        }`,
        side: THREE.DoubleSide,
        forceSinglePass: true,
        transparent: true

    });

    //

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    //

    setTimeout(function() {
        if(fontVectors) {
            textPositions.push(shuffle(fontVectors.getPointsOfChar('M', instances, 0.2)))
            textPositions.push(shuffle(fontVectors.getPointsOfChar('I', instances, 0.2)))
            textPositions.push(shuffle(fontVectors.getPointsOfChar('N', instances, 0.2)))
            textPositions.push(shuffle(fontVectors.getPointsOfChar('H', instances, 0.2)))
        }
    }, 1000);

    
}

function getUpdateVelocityTime() {
    return Math.max((Math.random() - 0.5) * 4, 1);
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
let transitionTime = 1.5;
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
            velocities[i * 3] = vel.x;
            velocities[i * 3 + 2] = vel.z;
        } 

        // offsets
        offsets[i * 3] = textPos.x + (velocities[i * 3]) * moveTime; 
        offsets[i * 3 + 1] = textPos.y + (velocities[i * 3 + 1]) * moveTime; 
        offsets[i * 3 + 2] = textPos.z + (velocities[i * 3 + 2]) * moveTime; 
    }

    //
    scene.children[0].geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
}

function UpdateCrowdRandomWalk(delta) {

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
        
        let velocityOut = dirOut.clone().multiplyScalar( smoothstep(1.5, 1, distance) );
        
        //center gravity
        let velocityIn = dirOut.clone().negate().multiplyScalar( smoothstep(3, 3.5, distance) );

        // offsets
        
        offsets[i * 3] += (velocities[i * 3] + velocityOut.x + velocityIn.x) * delta * speedScale; 
        offsets[i * 3 + 1] += (velocities[i * 3 + 1] + velocityOut.y + velocityIn.y) * delta * speedScale; 
        offsets[i * 3 + 2] += (velocities[i * 3 + 2] + velocityOut.z + velocityIn.z) * delta * speedScale; 
    }

    //
    scene.children[0].geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
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