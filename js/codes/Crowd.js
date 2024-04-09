function InitCrown() {
    const vector = new THREE.Vector4();

    const instances = 100;

    const positions = [];
    const offsets = [];
    const colors = [];


    positions.push(-0.1 , 0, 0);
    positions.push(0.1, 0, 0);
    positions.push(-0.1, 0.4, 0);
    positions.push(0.1 , 0, 0);
    positions.push(0.1, 0.4, 0);
    positions.push(-0.1, 0.4, 0);

    // instanced attributes

    for (let i = 0; i < instances; i++) {

        // offsets

        offsets.push(Math.random() - 0.5, 0, Math.random() - 0.5);

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
            'sineTime': { value: 1.0 }
        },
        vertexShader: `
        precision highp float;
    
        uniform float sineTime;
    
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
    
        attribute vec3 position;
        attribute vec3 offset;
        attribute vec4 color;

    
        varying vec3 vPosition;
        varying vec4 vColor;
    
        void main(){
            
            //random position
            vPosition = offset * 10.0 + position;
            
            
            //random move

            vColor = color;
            
            //look at camera
            //gl_Position = projectionMatrix * modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0) + vec4( vPosition, 1.0 );
            gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
    
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
}
    