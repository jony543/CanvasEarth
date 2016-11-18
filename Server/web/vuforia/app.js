/// <reference types="@argonjs/argon" />
/// <reference types="three" />
/// <reference types="dat-gui" />
/// <reference types="stats" />
// set up Argon
var app = Argon.init();
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
    if (!available) {
        console.re.warn("vuforia not available on this platform.");
        return;
    }
    // tell argon to initialize vuforia for our app, using our license information.
    app.vuforia.init({
        encryptedLicenseData: "-----BEGIN PGP MESSAGE-----\nVersion: OpenPGP.js v2.3.2\nComment: http://openpgpjs.org\n\nwcFMA+gV6pi+O8zeAQ/+JSW7oR80BIKmFQUuPSp+aFBfHJrz1/2gqZjSvc8o\nTlo0/zNMp7zmI87Aw98zg2lzjdBOQVz4R5nErhzDa99Nwl261aj+1+QVU4IC\n1wZhV7hWMqv1bqb0g+04kioTOmUCTpj17J7GCLfHTj3HVts1MnnEIo0xvplS\nl8zl7H3C2TtIp6brAroEkdtcey84sOi71eTJdUPk3pbHRH16YpvCIuCdj+iI\nUEQofSiLFOgg+8OqLhlencJFAsgKGUIW/Duiskx/I9jWRhr3C9Apj4nOUpIO\nedZ1PSpSpZFr9SFK85n2QeSAQ0vbtUF/D5QXGVAX8ccbO3m5JRdpP102FchK\nhrOfMSRrVp+Rwz3VDUAhvr1TVKpG1kuRUQAoSZvEpEJ5MtdBmYbYxorKjD6l\nJmpvDv+uJrLbglrRDP50AFauiMMXUcaEgwjgpzSNeFG0jJCBVfHDP68kvnmz\n/k3e8RGtOi1+a2HzLwPAxnfE902bR55+xD6HDSFvP7P3eORsWKBIaqmieHEu\nvC3Vnlnsob3FhmhHtfAYvMb3m0DmnyzTK6ihN2zACw2Lzmhd8l5wwcipkm4x\nx6N2MdroC22ojGv1KrQRmyTuMtm7TS3ea9MdtLf9T5WpytWkAhozHefDumF0\nV2fRXooHelvzlr33/g5FWgUEkQb6a5dvDzkf4KxuCkLBwU4DAGn1enGTza0Q\nB/44+LWSmtkdXnWi0INVWr5HdG3pWUX7bpavxbaorBwT4h5j5O0wIQOR8XyD\nrK8M+MOn3QnILltuYxBBku2UIaJnsfEX2BtZr2bn0f8i/B8lEliueh9u26+a\n29MAbaUmpTyAVA4VTJasTxPg+SyzUwbnGzm229/ZwbJQX0WOF9HFghu71KWd\nHbBG1Wj/qSu1ZIENT+LNJAJF/aE3GpWYmEsAyYeHcQNCbu2FxQmiPy3r7dXM\n1iGrFJOEQzxCW1e7JyhFCAl/UvnRzF2a0BMIBYyAUsp96/vXddq5+W7TmJOj\nu3NEtsohPQKQ3EMS/siEF4ePnfE7uXdDzwjTPk2X11KGB/4+c0NrHtoh85iN\nPOkoNJbCOmvl3dlY6iRKUFGD0AFEzxmnIBNZRvZlz12RYSdqf0qTEEeUVjSG\nPCOjZpAGLJyHdjDM12DS++liRdAf3PJ+tAahbHSE3AO0hiNT/oqf8fAPmnXN\nnGozefpc5LSxmM4b6g84vS9W8/rmcpBqHQA9IZyBbWdwgqn98BssPJsG9h4R\niN1VMgqtnsNw8nWsKiueHMFejafUIES2iY6XJRfmwALcE/Xcrj+GCGPiAgUL\nPfbks3Lt5s2z/f76eT4yXXBB7lBImRe8Nz5mAac8KZ4kMzMIxmyfmczBH1vw\nfSocZFCitSDr509R1DjkzFxCFNoywcFMA47tt+RhMWHyAQ/+OVkdy3DqyC0i\n+xVXjqRXQSi9OnbymIMdQQMQbYeMshZB669DBtdYPdpcfaukfzo+ocOJuoCu\nptzsbsfhEn9YsWQMU1ADzr7+yBjZlGV3X8/Lqb9o8tg4UyywJQ3X61/IbxpL\nnl61ocqQYov9gISAMyO4ifntxyk+if7aTHQYYglmDBR8HiNTZALQ3/BLLjKU\ng+8tqXXiPQqUCvHDx6w1c8SnF5MhjyGBtu08Z3yCxK2hBV7aBypg4IEJx0/n\nQvCLDpqjfLD+ASscP24nh4jk4wdcCWGkNhrCAsUIXHSBbCCRdXj7EYLJ7bvE\nBsOCqDgOWvRbIOvV7o4HNIlnfBVems5Pi3F9xdNLFKYuKiZ7PDYgOOxnyIJ3\nxh+qAfp7fPuyKywDHhPiFUQY/5mIYK3bTEwLs+epHg/h2V9A2lXFW+5fcGau\nxEWPLbqfwielnJoRPHi8Oou/7reQ6kMqQhbgE65zpwa27C2PF84/EkiGNZXm\nfWcUbuT8cg00DB0MNnfGkdZ18UbRb3aEtzcaaouhXlHmXNS0IMnydQ2YRUDV\n/egUbXty83hElVLPktveZxyCLkJl/hFCBz1c11eBkMxdFSdQ5iErlpxd2Gzu\nudUUg2e6TbeAzj+MzCFYxIgVNqUqCFjch285y1GVTKguSdJZNq7fcemKpJkm\nTFH0W7AWATHSwb0B3F+gn/i/PgVEuxteRXgpY8BPi12SD6ALvspof9a6wDgr\nECWCQ2j2a8RrsFjjm21jAQabWtZgdct2sJ2oNUfLtvwhpBH+HrWhUAp8wDCI\nuXzDUNoEyXJ/MOq3otGWFA1fP+nP9G6C4cmC1WTPEfaVOaoJ+iVUIUUR/oc9\nCcfzNlhSNsMtcTgvpYhAou085AWCrTmXDo2eYnbb1X7pTiLLU/38h7chlwo1\nONiAImvgEgwhuW7WihX8CCzAXhkZwegcpoO9PagqMXZZC3+j4LXPIL1dQAoC\nEHQ6FQIv+PvkROQB5XUAfKxN4LhAJviHpLQF4mHriXViW6XU60VojdwtVGHt\nsvxtYHanvlII/8bLzzGq2OpMxedrheJhJJ6UW1dkxKbTBMclpAcY92YaQ8Hg\n6+zm6Uk8TMy1033eM7kjUTrwe5a+yRMRcspaXp3Y3DbPgHjsgr6QkCacyJk6\n4imPh7q+zURj1TTeFmzt6K48kTBnngJWbj2j/3uDBXzhzBhgzZqdaNBJcQHL\n4qQxdkxDwiEa8r73Vo5w3Bk7ZBs7m6jwtvzwOBhQVkuAZzQLipyhA8YGntlc\nPiLzUPt0U56vn3BJ+/L2r0MkeuNQtn+uqcCqGEt5b2bfolkSvFOTUG7jfCCU\nQ5RY/fUAuIyvVQH8CylbEAd/KsxbTQMkGSRtFhczpXAS19TAVnRBz7YdJ42/\nr3yc/DVg5hxwPOEbor8krngVE8fvaLSoxVn7trC13SaT3GxeBZkmllWy5iBb\nWpFNI3IZlGWeYtBFkV8I9n5Mh3wm0l3YmFBvRfWwceNG/Wv+2Mxj77LnRpyX\n+oml9MCiqFKGIzlqlEP+hUFB\n=zJIx\n-----END PGP MESSAGE-----"
    }).then(function (api) {
        // the vuforia API is ready, so we can start using it.
        // tell argon to download a vuforia dataset.  The .xml and .dat file must be together
        // in the web directory, even though we just provide the .xml file url here
        api.objectTracker.createDataSet("../resources/datasets/ArgonTutorial.xml").then(function (dataSet) {
            // the data set has been succesfully downloaded
            // tell vuforia to load the dataset.
            dataSet.load().then(function () {
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
                console.re.log("could not load dataset: " + err.message);
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