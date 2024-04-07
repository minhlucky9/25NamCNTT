Ammo.Physics = function () {
    var loaded = false, debug = false;
    var tmpTrans, tmpPos, tmpQuat, ammoTmpPos, ammoTmpQuat;
    var physicsWorld, rigidBodies = [];
    var FLAGS = { CF_DYNAMIC_OBJECT: 0, CF_KINEMATIC_OBJECT: 2 }, STATE = { DISABLE_DEACTIVATION: 4 };

    Ammo().then(start)
    function start() {
        tmpTrans = new Ammo.btTransform();
        tmpPos = new THREE.Vector3();
        tmpQuat = new THREE.Quaternion();
        ammoTmpPos = new Ammo.btVector3();
        ammoTmpQuat = new Ammo.btQuaternion();

        setupPhysicsWorld();

    }
    function setupPhysicsWorld() {
        let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
            dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
            overlappingPairCache = new Ammo.btDbvtBroadphase(),
            solver = new Ammo.btSequentialImpulseConstraintSolver();

        physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
        physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

        console.log("Physic world init");
        loaded = true;
    }

    function checkContact(physicsBody, cbResult) {

        physicsWorld.contactTest(physicsBody, cbResult);

    }
    //=============================================================================//
    function update(deltaTime) {
        // Step world
        physicsWorld.stepSimulation(deltaTime);
        // Update rigid bodies
        for (let i = 0; i < rigidBodies.length; i++) {
            let objThree = rigidBodies[i];
            let objAmmo = objThree.userData.physicsBody;
            let ms = objAmmo.getMotionState();
            if (ms) {
                ms.getWorldTransform(tmpTrans);
                let p = tmpTrans.getOrigin();
                //let q = tmpTrans.getRotation();
                objThree.position.set(p.x(), p.y() - objThree.userData.colliderOffset, p.z());
                //objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
            }
        }
    }

    //=============================================================================//
    function createRigidbody(object, shape, mass, params) {

        let colShape, margin = 0.2, friction = 0, rollFriction = 0;
        //=============================================================//
        if (debug) { createHelper(object, shape, params); }
        if (params.friction) { friction = params.friction; }
        if (params.rollFriction) { rollFriction = params.rollFriction; }
        if (shape == "Sphere") { colShape = new Ammo.btSphereShape(params.radius); }
        else if (shape == "Capsule") { colShape = new Ammo.btCapsuleShape(params.radius, params.height); }
        else if (shape == "Cone") { colShape = new Ammo.btConeShape(params.radius, params.height); }
        else { colShape = new Ammo.btBoxShape(new Ammo.btVector3(params.width * 0.5, params.height * 0.5, params.depth * 0.5)); }
        //=============================================================//
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setRotation(new Ammo.btQuaternion(params.quaternion.x, params.quaternion.y, params.quaternion.z, params.quaternion.w));
        transform.setOrigin(new Ammo.btVector3(params.position.x, params.position.y, params.position.z));
        let motionState = new Ammo.btDefaultMotionState(transform);
        colShape.setMargin(margin);
        let localInertia = new Ammo.btVector3(0, 0, 0);
        colShape.calculateLocalInertia(mass, localInertia);
        let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);
        //=============================================================//
        body.setFriction(friction);
        body.setRollingFriction(rollFriction);
        if (mass > 0) {
            body.setActivationState(STATE.DISABLE_DEACTIVATION);
            object.userData.physicsBody = body;
            rigidBodies.push(object);
        }
        else if (params.isKinematic) {
            body.setActivationState(STATE.DISABLE_DEACTIVATION);
            body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);
            object.userData.physicsBody = body;
        }
        //=============================================================//
        body.threeObject = object;
        physicsWorld.addRigidBody(body);

    }

    function createMeshRigidbody(object, mass, params) {
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(params.position.x, params.position.y, params.position.z));
        transform.setRotation(new Ammo.btQuaternion(params.quaternion.x, params.quaternion.y, params.quaternion.z, params.quaternion.w));
        const motionState = new Ammo.btDefaultMotionState(transform);

        // Vertices and indices are parsed by GLTF parser by loaders.gl
        const vertices = params.vertices;
        const indices = params.indices;

        const mesh = new Ammo.btTriangleMesh(true, true);
        mesh.setScaling(new Ammo.btVector3(params.scale.x, params.scale.y, params.scale.z));
        for (let i = 0; i * 3 < indices.length; i++) {
            mesh.addTriangle(
                new Ammo.btVector3(vertices[indices[i * 3] * 3], vertices[indices[i * 3] * 3 + 1], vertices[indices[i * 3] * 3 + 2]),
                new Ammo.btVector3(vertices[indices[i * 3 + 1] * 3], vertices[indices[i * 3 + 1] * 3 + 1], vertices[indices[i * 3 + 1] * 3 + 2]),
                new Ammo.btVector3(vertices[indices[i * 3 + 2] * 3], vertices[indices[i * 3 + 2] * 3 + 1], vertices[indices[i * 3 + 2] * 3 + 2]),
                false
            );
        }
        const shape = new Ammo.btBvhTriangleMeshShape(mesh, true, true);

        const localInertia = new Ammo.btVector3(0, 0, 0);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);
        //=============================================================//
        if (mass > 0) {
            body.setActivationState(STATE.DISABLE_DEACTIVATION);
            object.userData.physicsBody = body;
            rigidBodies.push(object);
        }
        else if (params.isKinematic) {
            body.setActivationState(STATE.DISABLE_DEACTIVATION);
            body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT);
            object.userData.physicsBody = body;
        }
        //=============================================================//
        body.threeObject = object;
        physicsWorld.addRigidBody(body);
        //
        if (debug) {
            var geometry = new THREE.BufferGeometry();
            // create a simple square shape. We duplicate the top left and bottom right
            // vertices because each vertex needs to appear once per triangle.
            var verticesDebug = [];

            for (let i = 0; i * 3 < indices.length; i++) {
                verticesDebug.push(vertices[indices[i * 3] * 3]);
                verticesDebug.push(vertices[indices[i * 3] * 3 + 1]);
                verticesDebug.push(vertices[indices[i * 3] * 3 + 2]);
                verticesDebug.push(vertices[indices[i * 3 + 1] * 3]);
                verticesDebug.push(vertices[indices[i * 3 + 1] * 3 + 1]);
                verticesDebug.push(vertices[indices[i * 3 + 1] * 3 + 2]);
                verticesDebug.push(vertices[indices[i * 3 + 2] * 3]);
                verticesDebug.push(vertices[indices[i * 3 + 2] * 3 + 1]);
                verticesDebug.push(vertices[indices[i * 3 + 2] * 3 + 2]);

            }

            // itemSize = 3 because there are 3 values (components) per vertex
            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verticesDebug), 3));
            var material = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
            var meshColliderDebug = new THREE.Mesh(geometry, material);
            meshColliderDebug.scale.set(params.scale.x, params.scale.y, params.scale.z);
            meshColliderDebug.quaternion.set(params.quaternion.x, params.quaternion.y, params.quaternion.z, params.quaternion.w);
            scene.add(meshColliderDebug);
        }
    }

    function createHelper(object, shape, params) {
        let colShape = new THREE.Object3D();
        if (shape == "Sphere") { colShape = new THREE.Mesh(new THREE.SphereGeometry(params.radius, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true })); }
        else if (shape == "Capsule") { colShape = new THREE.Mesh(new THREE.CylinderGeometry(params.radius, params.radius, params.height, 12), new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true })); }
        else { colShape = new THREE.Mesh(new THREE.BoxGeometry(params.width, params.height, params.depth), new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true })); }

        if (object) {
            colShape.position.set(0, object.userData.colliderOffset * 1 / object.scale.y, 0);
            colShape.scale.set(1 / object.scale.x, 1 / object.scale.y, 1 / object.scale.z);
            object.add(colShape);
        }
        else {
            colShape.position.set(params.position.x, params.position.y, params.position.z);
            colShape.quaternion.set(params.quaternion.x, params.quaternion.y, params.quaternion.z, params.quaternion.w);
            scene.add(colShape);
        }
    }
    //=============================================================================//
    function moveInDirection(object, direction, speed) {
        let resultantImpulse = new Ammo.btVector3(direction.x, direction.y, direction.z);
        resultantImpulse.op_mul(speed);
        let physicsBody = object.userData.physicsBody;
        if (physicsBody.getCollisionFlags() == 2) { physics.setType(object, "Dynamic"); }
        physicsBody.setLinearVelocity(resultantImpulse);
    }
    function applyForceInDirection(object, direction, speed) {
        let force = new Ammo.btVector3(direction.x, direction.y, direction.z);
        force.op_mul(speed);

        let physicsBody = object.userData.physicsBody;
        if (physicsBody.getCollisionFlags() == 2) { physics.setType(object, "Dynamic"); }
        physicsBody.applyForce(force, object.position.clone());
    }
    function setKPosition(object, pos) {
        let physicsBody = object.userData.physicsBody;
        if (physicsBody.getCollisionFlags() == 0) { physics.setType(object, "Kinematic"); }

        object.position.set(pos.x, pos.y, pos.z);
        object.getWorldPosition(tmpPos);
        object.getWorldQuaternion(tmpQuat);

        let ms = physicsBody.getMotionState();
        if (ms) {
            ammoTmpPos.setValue(tmpPos.x, tmpPos.y, tmpPos.z);
            ammoTmpQuat.setValue(tmpQuat.x, tmpQuat.y, tmpQuat.z, tmpQuat.w);

            tmpTrans.setIdentity();
            tmpTrans.setOrigin(ammoTmpPos);
            tmpTrans.setRotation(ammoTmpQuat);
            ms.setWorldTransform(tmpTrans);
        }
    }
    //=============================================================================//
    function setDebug(bool) { debug = bool; }
    function setType(object, name) {
        if (name == "Kinematic") { object.userData.physicsBody.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJECT); }
        if (name == "Dynamic") { object.userData.physicsBody.setCollisionFlags(FLAGS.CF_DYNAMIC_OBJECT); }
    }
    return {
        setDebug: setDebug,
        update: update,
        createRigidbody: createRigidbody,
        createMeshRigidbody: createMeshRigidbody,
        setLinearVelocity: moveInDirection,
        setPosition: setKPosition,
        setType: setType,
        applyForce: applyForceInDirection,
        checkContact: checkContact,
        loaded: loaded
    }
}
