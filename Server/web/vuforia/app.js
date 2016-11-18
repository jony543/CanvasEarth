/// <reference types="@argonjs/argon" />
/// <reference types="three" />
/// <reference types="dat-gui" />
/// <reference types="stats" />
// set up Argon


console.re.log('remote log test');


var app = Argon.init();
console.re.log("init fuck off");
// set up THREE.  Create a scene, a perspective camera and an object
// for the user's location
var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera();
var userLocation = new THREE.Object3D();
scene.add(camera);
scene.add(userLocation);
// We use the standard WebGLRenderer when we only need WebGL-based content
var renderer = new THREE.WebGLRenderer({
    alpha: true,
    logarithmicDepthBuffer: true
});
// account for the pixel density of the device
renderer.setPixelRatio(window.devicePixelRatio);
app.view.element.appendChild(renderer.domElement);
// to easily control stuff on the display
var hud = new THREE.CSS3DArgonHUD();
// We put some elements in the index.html, for convenience. 
// Here, we retrieve the description box and move it to the 
// the CSS3DArgonHUD hudElements[0].  We only put it in the left
// hud since we'll be hiding it in stereo
var description = document.getElementById('description');
hud.hudElements[0].appendChild(description);
app.view.element.appendChild(hud.domElement);
// let's show the rendering stats
var stats = new Stats();
hud.hudElements[0].appendChild(stats.dom);
// Tell argon what local coordinate system you want.  The default coordinate
// frame used by Argon is Cesium's FIXED frame, which is centered at the center
// of the earth and oriented with the earth's axes.  
// The FIXED frame is inconvenient for a number of reasons: the numbers used are
// large and cause issues with rendering, and the orientation of the user's "local
// view of the world" is different that the FIXED orientation (my perception of "up"
// does not correspond to one of the FIXED axes).  
// Therefore, Argon uses a local coordinate frame that sits on a plane tangent to 
// the earth near the user's current location.  This frame automatically changes if the
// user moves more than a few kilometers.
// The EUS frame cooresponds to the typical 3D computer graphics coordinate frame, so we use
// that here.  The other option Argon supports is localOriginEastNorthUp, which is
// more similar to what is used in the geospatial industry
app.context.setDefaultReferenceFrame(app.context.localOriginEastUpSouth);
// create a bit of animated 3D text that says "argon.js" to display 
var uniforms = {
    amplitude: { type: "f", value: 0.0 }
};
var argonTextObject = new THREE.Object3D();
argonTextObject.position.z = -0.5;
userLocation.add(argonTextObject);
var loader = new THREE.FontLoader();
loader.load('../resources/fonts/helvetiker_bold.typeface.js', function (font) {
    var textGeometry = new THREE.TextGeometry("argon.js", {
        font: font,
        size: 40,
        height: 5,
        curveSegments: 3,
        bevelThickness: 2,
        bevelSize: 1,
        bevelEnabled: true
    });
    textGeometry.center();
    var tessellateModifier = new THREE.TessellateModifier(8);
    for (var i = 0; i < 6; i++) {
        tessellateModifier.modify(textGeometry);
    }
    var explodeModifier = new THREE.ExplodeModifier();
    explodeModifier.modify(textGeometry);
    var numFaces = textGeometry.faces.length;
    var bufferGeometry = new THREE.BufferGeometry().fromGeometry(textGeometry);
    var colors = new Float32Array(numFaces * 3 * 3);
    var displacement = new Float32Array(numFaces * 3 * 3);
    var color = new THREE.Color();
    for (var f = 0; f < numFaces; f++) {
        var index = 9 * f;
        var h = 0.07 + 0.1 * Math.random();
        var s = 0.5 + 0.5 * Math.random();
        var l = 0.6 + 0.4 * Math.random();
        color.setHSL(h, s, l);
        var d = 5 + 20 * (0.5 - Math.random());
        for (var i = 0; i < 3; i++) {
            colors[index + (3 * i)] = color.r;
            colors[index + (3 * i) + 1] = color.g;
            colors[index + (3 * i) + 2] = color.b;
            displacement[index + (3 * i)] = d;
            displacement[index + (3 * i) + 1] = d;
            displacement[index + (3 * i) + 2] = d;
        }
    }
    bufferGeometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
    bufferGeometry.addAttribute('displacement', new THREE.BufferAttribute(displacement, 3));
    var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: "\n            uniform float amplitude;\n            attribute vec3 customColor;\n            attribute vec3 displacement;\n            varying vec3 vNormal;\n            varying vec3 vColor;\n            void main() {\n                vNormal = normal;\n                vColor = customColor;\n                vec3 newPosition = position + normal * amplitude * displacement;\n                gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );\n            }\n        ",
        fragmentShader: "\n            varying vec3 vNormal;\n            varying vec3 vColor;\n            void main() {\n                const float ambient = 0.4;\n                vec3 light = vec3( 1.0 );\n                light = normalize( light );\n                float directional = max( dot( vNormal, light ), 0.0 );\n                gl_FragColor = vec4( ( directional + ambient ) * vColor, 1.0 );\n            }\n        "
    });
    var textMesh = new THREE.Mesh(bufferGeometry, shaderMaterial);
    argonTextObject.add(textMesh);
    argonTextObject.scale.set(0.001, 0.001, 0.001);
    argonTextObject.position.z = -0.50;
    // add an argon updateEvent listener to slowly change the text over time.
    // we don't have to pack all our logic into one listener.
    app.context.updateEvent.addEventListener(function () {
        uniforms.amplitude.value = 1.0 + Math.sin(Date.now() * 0.001 * 0.5);
    });
});
app.vuforia.isAvailable().then(function (available) {
    // vuforia not available on this platform
    console.re.log("vuforia initialization...." + available);
    if (!available) {
        console.warn("vuforia not available on this platform.");
        return;
    }
    // tell argon to initialize vuforia for our app, using our license information.
    app.vuforia.init({
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\n\n=69cp\n-----END PGP MESSAGE-----"
    }).then(function (api) {
        console.re.log('vuforia init finished');
        // the vuforia API is ready, so we can start using it.
        // tell argon to download a vuforia dataset.  The .xml and .dat file must be together
        // in the web directory, even though we just provide the .xml file url here 
        api.objectTracker.createDataSet("../resources/datasets/GVUBrochure.xml").then(function (dataSet) {
            // the data set has been succesfully downloaded
            // tell vuforia to load the dataset.
            console.re.log('dataset created');
            dataSet.load().then(function () {
                console.re.log("dataset loaded");
                // when it is loaded, we retrieve a list of trackables defined in the
                // dataset and set up the content for the target
                var trackables = dataSet.getTrackables();
                // tell argon we want to track a specific trackable.  Each trackable
                // has a Cesium entity associated with it, and is expressed in a 
                // coordinate frame relative to the camera.  Because they are Cesium
                // entities, we can ask for their pose in any coordinate frame we know
                // about.
                var gvuBrochureEntity = app.context.subscribeToEntityById(trackables["GVUBrochure"].id);
                // create a THREE object to put on the trackable
                var gvuBrochureObject = new THREE.Object3D;
                scene.add(gvuBrochureObject);
                // the updateEvent is called each time the 3D world should be
                // rendered, before the renderEvent.  The state of your application
                // should be updated here.
                app.context.updateEvent.addEventListener(function () {
                    // get the pose (in local coordinates) of the gvuBrochure target
                    var gvuBrochurePose = app.context.getEntityPose(gvuBrochureEntity);
                    // if the pose is known the target is visible, so set the
                    // THREE object to the location and orientation
                    if (gvuBrochurePose.poseStatus & Argon.PoseStatus.KNOWN) {
                        gvuBrochureObject.position.copy(gvuBrochurePose.position);
                        gvuBrochureObject.quaternion.copy(gvuBrochurePose.orientation);
                    }
                    // when the target is first seen after not being seen, the 
                    // status is FOUND.  Here, we move the 3D text object from the
                    // world to the target.
                    // when the target is first lost after being seen, the status 
                    // is LOST.  Here, we move the 3D text object back to the world
                    if (gvuBrochurePose.poseStatus & Argon.PoseStatus.FOUND) {
                        gvuBrochureObject.add(argonTextObject);
                        argonTextObject.position.z = 0;
                    }
                    else if (gvuBrochurePose.poseStatus & Argon.PoseStatus.LOST) {
                        argonTextObject.position.z = -0.50;
                        userLocation.add(argonTextObject);
                    }
                });
            }).catch(function (err) {
                console.log("could not load dataset: " + err.message);
            });
            // activate the dataset.
            api.objectTracker.activateDataSet(dataSet);
        });
    }).catch(function (err) {
        console.re.log("vuforia failed to initialize: " + err.message);
    });
});
// the updateEvent is called each time the 3D world should be
// rendered, before the renderEvent.  The state of your application
// should be updated here.
app.context.updateEvent.addEventListener(function () {
    // get the position and orientation (the "pose") of the user
    // in the local coordinate frame.
    var userPose = app.context.getEntityPose(app.context.user);
    // assuming we know the user's pose, set the position of our 
    // THREE user object to match it
    if (userPose.poseStatus & Argon.PoseStatus.KNOWN) {
        userLocation.position.copy(userPose.position);
    }
});
// renderEvent is fired whenever argon wants the app to update its display
app.renderEvent.addEventListener(function () {
    // update the rendering stats
    stats.update();
    // if we have 1 subView, we're in mono mode.  If more, stereo.
    var monoMode = (app.view.getSubviews()).length == 1;
    // set the renderer to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    var viewport = app.view.getViewport();
    renderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);
    // there is 1 subview in monocular mode, 2 in stereo mode    
    for (var _i = 0, _a = app.view.getSubviews(); _i < _a.length; _i++) {
        var subview = _a[_i];
        // set the position and orientation of the camera for 
        // this subview
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);
        // the underlying system provide a full projection matrix
        // for the camera. 
        camera.projectionMatrix.fromArray(subview.projectionMatrix);
        // set the viewport for this view
        var _b = subview.viewport, x = _b.x, y = _b.y, width = _b.width, height = _b.height;
        renderer.setViewport(x, y, width, height);
        // set the webGL rendering parameters and render this view
        renderer.setScissor(x, y, width, height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);
        // adjust the hud, but only in mono
        if (monoMode) {
            hud.setViewport(x, y, width, height, subview.index);
            hud.render(subview.index);
        }
    }
});
