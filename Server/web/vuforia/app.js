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
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\nNw==\n=KU/j\n-----END PGP MESSAGE-----"
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
