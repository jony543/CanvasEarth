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
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\n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\n=WxNl\n-----END PGP MESSAGE-----"
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
