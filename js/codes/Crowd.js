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

    initTextOrganize();
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

function initTextOrganize() {
    let loader = new THREE.FontLoader();

    loader.load("/helvetiker_bold.typeface.json", function(font) {
        console.log(font);
        let size = 5;
        let scale = size / font.data.resolution;
        let offsetX = offsetY = -size / 2;
        let shapePath = createPath("X", scale, offsetX, offsetY, font.data);

        //current path
       
        let ppoints = shapePath.path.currentPath.getPoints();

        const curve = new THREE.SplineCurve( ppoints);
        
        const points = curve.getPoints( 50 );
        const geometry = new THREE.BufferGeometry().setFromPoints( points );
        
        const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
        
        // Create the final object to add to the scene
        const splineObject = new THREE.Line( geometry, material );
        splineObject.rotation.x = Math.PI / 2;
        scene.add( splineObject );
        
        console.log(points)
    })
}

function createPath( char, scale, offsetX, offsetY, data ) {

	const glyph = data.glyphs[ char ] || data.glyphs[ '?' ];

	if ( ! glyph ) {

		console.error( 'THREE.Font: character "' + char + '" does not exists in font family ' + data.familyName + '.' );

		return;

	}

	const path = new THREE.ShapePath();

	let x, y, cpx, cpy, cpx1, cpy1, cpx2, cpy2;

	if ( glyph.o ) {

		const outline = glyph._cachedOutline || ( glyph._cachedOutline = glyph.o.split( ' ' ) );

		for ( let i = 0, l = outline.length; i < l; ) {

			const action = outline[ i ++ ];

			switch ( action ) {

				case 'm': // moveTo

					x = outline[ i ++ ] * scale + offsetX;
					y = outline[ i ++ ] * scale + offsetY;

					path.moveTo( x, y );

					break;

				case 'l': // lineTo

					x = outline[ i ++ ] * scale + offsetX;
					y = outline[ i ++ ] * scale + offsetY;

					path.lineTo( x, y );

					break;

				case 'q': // quadraticCurveTo

					cpx = outline[ i ++ ] * scale + offsetX;
					cpy = outline[ i ++ ] * scale + offsetY;
					cpx1 = outline[ i ++ ] * scale + offsetX;
					cpy1 = outline[ i ++ ] * scale + offsetY;

					path.quadraticCurveTo( cpx1, cpy1, cpx, cpy );

					break;

				case 'b': // bezierCurveTo

					cpx = outline[ i ++ ] * scale + offsetX;
					cpy = outline[ i ++ ] * scale + offsetY;
					cpx1 = outline[ i ++ ] * scale + offsetX;
					cpy1 = outline[ i ++ ] * scale + offsetY;
					cpx2 = outline[ i ++ ] * scale + offsetX;
					cpy2 = outline[ i ++ ] * scale + offsetY;

					path.bezierCurveTo( cpx1, cpy1, cpx2, cpy2, cpx, cpy );

					break;

			}

		}

	}

	return { offsetX: glyph.ha * scale, path: path };

}