const instances = 60;
let velocities = [];
let update_times = [];
const positions = [];
const offsets = [];
const colors = [];
let speedScale = 1;

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
        let vel = new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5);
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

    initHersheyFont();
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

function UpdataCrown(delta) {

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

let fontCurves = [];

function initHersheyFont() {
    let loader = new THREE.FileLoader();

    loader.load("/fonts/hershey/rowmans.jhf", function(font) {
        
        let lines = font.split('\n');

        for(let i = 0; i < lines.length; i ++){
            let descriptor = lines[i];
            let R = 'R'.charCodeAt(0);
            let number = parseInt(descriptor.substr(0, 5));
            let left = descriptor[8].charCodeAt(0) - R;
            let right = descriptor[9].charCodeAt(0) - R;
            let numVertices = parseInt(descriptor.substr(5, 3), 10) - 1;
            
            let curves = [];
            let currentPath = [];
            for(let v = 0; v < numVertices; v++) {
                const x = descriptor[10 + v * 2].charCodeAt(0) - R
                const y = descriptor[11 + v * 2].charCodeAt(0) - R
                if ((x === -50) && (y === 0)) {
                    curves.push(currentPath)
                    currentPath = []
                } else {
                    currentPath.push([x, y])
                }
            }
            curves.push(currentPath)

            fontCurves['' + number] = curves;
        }

        let points = getPointsOfChar('H', 60, 0.2);
        console.log(points);
        
        for (let i = 0; i < instances; i++) {
            if(points[i]) {
                offsets[i * 3] = points[i].x;
                offsets[i * 3 + 1] = points[i].y;
                offsets[i * 3 + 2] = points[i].z;
            } else {
                offsets[i * 3] = points[0].x;
                offsets[i * 3 + 1] = points[0].y;
                offsets[i * 3 + 2] = points[0].z;
            } 
            
        }
        
        scene.children[0].geometry.setAttribute('offset', new THREE.InstancedBufferAttribute(new Float32Array(offsets), 3));
    })
}

function IsExistInArray(point, array) {
    
    for(let i = 0; i < array.length; i++) {
        if(point.x == array[i].x && point.y == array[i].y && point.z == array[i].z )
        {
            return true;
        }
    }

    return false;
}

function getPointsOfChar(char, nb_point, scale) {
    let vectors_of_char = fontCurves[rowmans_dict[char]];
    //calculate total length
    let length = 0;
    let results = [];
    for(let i = 0 ; i < vectors_of_char.length; i ++) {
        let vector = vectors_of_char[i];

        for(let j = 0; j < vector.length - 1; j ++) 
        {
            //point 1 and 2
            let p1 = new THREE.Vector3(vector[j][0], 0, vector[j][1]);
            let p2 = new THREE.Vector3(vector[j + 1][0], 0, vector[j + 1][1]);
            
            //if(!IsExistInArray(p1, results)) {results.push(p1.clone().multiplyScalar(scale));}
            //if(!IsExistInArray(p2, results)) {results.push(p2.clone().multiplyScalar(scale));}

            length += p2.distanceTo(p1);
        }
    }  
    
    let segmentLength = length / (nb_point);
    
    for(let i = 0 ; i < vectors_of_char.length; i ++) {
        let vector = vectors_of_char[i];

        for(let j = 0; j < vector.length - 1; j ++) 
        {
            //point 1 and 2
            let p1 = new THREE.Vector3(vector[j][0], 0, vector[j][1]);
            let p2 = new THREE.Vector3(vector[j + 1][0], 0, vector[j + 1][1]);
            let dir = p2.clone().sub(p1).normalize();
            let length = p2.distanceTo(p1);
            dir.normalize();

            let k = 1;
            while(true) {
                let currentLength = k * segmentLength;
                if(currentLength >= length) break;
            
                let p = p1.clone().add( dir.clone().multiplyScalar(currentLength) ).multiplyScalar(scale);
                results.push(p);
                k++;
            }
        }
        
    }  

    return results;
}

let rowmans_dict = {
  'A': 501,
  'B': 502,
  'C': 503,
  'D': 504,
  'E': 505,
  'F': 506,
  'G': 507,
  'H': 508,
  'I': 509,
  'J': 510,
  'K': 511,
  'L': 512,
  'M': 513,
  'N': 514,
  'O': 515,
  'P': 516,
  'Q': 517,
  'R': 518,
  'S': 519,
  'T': 520,
  'U': 521,
  'V': 522,
  'W': 523,
  'X': 524,
  'Y': 525,
  'Z': 526,
  'a': 601,
  'b': 602,
  'c': 603,
  'd': 604,
  'e': 605,
  'f': 606,
  'g': 607,
  'h': 608,
  'i': 609,
  'j': 610,
  'k': 611,
  'l': 612,
  'm': 613,
  'n': 614,
  'o': 615,
  'p': 616,
  'q': 617,
  'r': 618,
  's': 619,
  't': 620,
  'u': 621,
  'v': 622,
  'w': 623,
  'x': 624,
  'y': 625,
  'z': 626,
  ' ': 699,
  '0': 700,
  '1': 701,
  '2': 702,
  '3': 703,
  '4': 704,
  '5': 705,
  '6': 706,
  '7': 707,
  '8': 708,
  '9': 709,
  '.': 710,
  ',': 711,
  ':': 712,
  ';': 713,
  '!': 714,
  '?': 715,
  '"': 717,
  '°': 718,
  '$': 719,
  '/': 720,
  '(': 721,
  ')': 722,
  '|': 723,
  '-': 724,
  '+': 725,
  '=': 726,
  '\'': 731,
  '#': 733,
  '&': 734,
  '\\': 804,
  '_': 999,
  '*': 2219,
  '[': 2223,
  ']': 2224,
  '{': 2225,
  '}': 2226,
  '<': 2241,
  '>': 2242,
  '~': 2246,
  '%': 2271,
  '@': 2273
}