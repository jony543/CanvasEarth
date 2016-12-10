var WILL = {
    backgroundColor: Module.Color.WHITE,
    color: Module.Color.from(0, 0, 0),
    brushWidth: 10,

    init: function(width, height) {
        this.initInkEngine(width, height);
        this.initEvents();
        //debugger;
    },

    getImageCanvas: function(layer, rect) {
        var tempCanvas = document.createElement("canvas");
        var context = tempCanvas.getContext("2d");

        if (!layer) {
            layer = this.canvas;
        }

        if (!rect) {
            rect = layer.bounds;
        }

        tempCanvas.width = rect.width;
        tempCanvas.height = rect.height;

        var pixels = layer.readPixels(rect);

        // Copy the pixels to a 2D canvas
        var imageData = context.createImageData(rect.width, rect.height);
        imageData.data.set(pixels);
        context.putImageData(imageData, 0, 0);

        return tempCanvas.toDataURL('image/png');
    },

    saveArt: function() {
        return this.getImageCanvas(this.strokesLayer, this.canvas.bounds);
    },

    saveBackground: function() {
        return this.getImageCanvas(this.backgroundLayer, this.canvas.bounds);
    },

    initInkEngine: function(width, height) {
        this.width = width;
        this.height = height;

        this.canvas = new Module.InkCanvas(document.getElementById("canvas"), width, height, {preserveDrawingBuffer: true});
        this.canvas.clear(this.backgroundColor);

        this.backgroundLayer = this.canvas.createLayer();
        this.strokesLayer = this.canvas.createLayer();


        this.brush = new Module.DirectBrush();

        this.speedPathBuilder = new Module.SpeedPathBuilder();
        this.speedPathBuilder.setNormalizationConfig(182, 3547);
        this.speedPathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);

        if (window.PointerEvent) {
            this.pressurePathBuilder = new Module.PressurePathBuilder();
            this.pressurePathBuilder.setNormalizationConfig(0.195, 0.88);
            this.pressurePathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);
        }

        this.strokeRenderer = new Module.StrokeRenderer(this.canvas, this.strokesLayer);
        // this.strokeRenderer.configure({brush: this.brush, color: this.color});
        this.strokeRenderer.configure({width: this.brushWidth, brush: this.brush, color: this.color});

    },

    initEvents: function() {
        //var self = this;

        var self = this;

        $(Module.canvas).on("mousedown", function(e) {
            // console.re.log('mousdown');
            e.preventDefault();
            self.beginStroke(e);
        });
        $(Module.canvas).on("mousemove", function(e) {
            // console.re.log('mousemove');
            e.preventDefault();
            self.moveStroke(e);}
        );
        $(document).on("mouseup", function(e) {
            // console.re.log('mousemove');
            e.preventDefault();
            self.endStroke(e);
        });

        Module.canvas.addEventListener("touchstart", function(e) {
            // console.re.log('touchstart');
            // console.re.log(e);
          self.beginStroke(e);
        });
        Module.canvas.addEventListener("touchmove", function(e) {
            // console.re.log('touchmove');
            // console.re.log(e);
          self.moveStroke(e);
        });
        document.addEventListener("touchend", function(e) {
            // console.re.log('touchend');
            // console.re.log(e);
          self.endStroke(e);
        });

        document.ontouchmove = function(e) {
            e.preventDefault();
        }
    },

    initImageLayer: function(url, w, h) {
        this.canvasUrl = url;
        this.canvasWidth = w;
        this.canvasHeight = h;

        var scale = Math.min(this.canvas.height/h, this.canvas.width/w);

        Module.GLTools.prepareTexture(
            Module.GLTools.createTexture(GLctx.CLAMP_TO_EDGE, GLctx.LINEAR),
            url,
            function(texture) {
                this.imageLayer = this.canvas.createLayer(
                    {
                        texture: texture,
                        ownGlResources: true
                    });
                this.backgroundLayer.blend(this.imageLayer, {
                    mode: Module.BlendMode.NONE,
                    transform: Module.MatTools.makeScale(scale)
                });

                this.canvas.blend(this.backgroundLayer);
            },
            this
        );
    },

    getPressure: function(e) {
        return (window.PointerEvent && e instanceof PointerEvent && e.pressure !== 0.5)?e.pressure:NaN;
    },

    getXYfromMouseEvent: function(evt){
        // console.re.log(JSON.stringify(evt));
        
        var x = evt.pageX - $('#canvas').offset().left;
        var y = evt.pageY - $('#canvas').offset().top;

        // console.re.log('x: ' + x + ', y: ' + y);

        return {x: x, y: y};
    },

    beginStroke: function(e) {
      console.log("stroke began");
        //if (e.button != 0) return;
        if (["mousedown", "mouseup"].contains(e.type) && e.button != 0) return;
        if (e.changedTouches) e = e.changedTouches[0];
        this.inputPhase = Module.InputPhase.Begin;
        this.pressure = this.getPressure(e);
        this.pathBuilder = this.speedPathBuilder; //isNaN(this.pressure)?this.speedPathBuilder:this.pressurePathBuilder;

        this.buildPath(this.getXYfromMouseEvent(e)); //{x: e.clientX, y: e.clientY});
        this.drawPath();
    },

    moveStroke: function(e) {
        //if (!this.inputPhase) return;
        if (!this.inputPhase) return;
        if (e.changedTouches) e = e.changedTouches[0];

        this.inputPhase = Module.InputPhase.Move;
        this.pointerPos = this.getXYfromMouseEvent(e); // {x: e.clientX, y: e.clientY};
        this.pressure = this.getPressure(e);

        //if (WILL.frameID != WILL.canvas.frameID) {
            var self = this;

            //WILL.frameID = WILL.canvas.requestAnimationFrame(function() {
                //if (self.inputPhase && self.inputPhase == Module.InputPhase.Move) {
                    self.buildPath(self.pointerPos);
                    self.drawPath();
                //}
            //}, true);
        //}
    },

    endStroke: function(e) {
        //if (!this.inputPhase) return;
        if (!this.inputPhase) return;
        if (e.changedTouches) e = e.changedTouches[0];

        this.inputPhase = Module.InputPhase.End;
        this.pressure = this.getPressure(e);

        this.buildPath(this.getXYfromMouseEvent(e)); //{x: e.clientX, y: e.clientY});
        this.drawPath();

        delete this.inputPhase;
    },

    buildPath: function(pos) {
        var pathPart = this.pathBuilder.addPoint(this.inputPhase, pos, 1); //Math.floor(Date.now() / 1000));
        var pathContext = this.pathBuilder.addPathPart(pathPart);

        this.pathPart = pathContext.getPathPart();
    },

    drawPath: function() {
        this.strokeRenderer.draw(this.pathPart, this.inputPhase == Module.InputPhase.End);
        this.strokeRenderer.blendUpdatedArea();
    },

    clear: function() {
        this.canvas.clear(this.backgroundColor);
    },

    setcolor: function(color) {
        this.color = color;
        this.strokeRenderer.configure({brush: this.brush, color: this.color});
    }
};


var imageUrl = "images/city hall.jpg";
var canvasWidth = $("#canvas").width();
var canvasHeight = $("#canvas").height();

Module.addPostScript(function() {
    WILL.init(canvasWidth, canvasHeight);
});

$("#files").change(function() {
    //Get the photo from the input form
    var input = document.getElementById('files');
    var files = input.files;
    if (files && files.length > 0) {
        var file = files[0];

        var urlReader = new FileReader();

        var _URL = window.URL || window.webkitURL;
        img = new Image();
        img.onload = function (imgData) {
            var w = imgData.target.width;
            var h = imgData.target.height;
            urlReader.onload = function(event){
                imageUrl = event.target.result;
                WILL.initImageLayer(imageUrl, w, h);
            };
            urlReader.readAsDataURL(file);
        };
        img.src = _URL.createObjectURL(file);
    }
});

var shareBtn = document.getElementById('share-art');
shareBtn.addEventListener('click', function (e) {
    var imageSource = WILL.saveArt();
    var canvasSource = WILL.saveBackground();
    var image_name = "myArt_" + new Date().getMilliseconds(); // TODO - define a proper name

    // test
    // window.open(WILL.saveBackground());
    // location.reload();

    $.ajax({url: "/art/augment",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ artName: image_name, artData: imageSource, canvasData: canvasSource }),
        success: function(data, status, xhr) {
            location.reload();
        }
    });

});

var myPalette = [
    ["#000","#444","#666","#999","#eee","#f3f3f3","#fff"],
    ["#f00","#f90","#ff0","#0f0","#00f","#90f","#f0f"],
    ["#ea9999","#f9cb9c","#ffe599","#b6d7a8","#9fc5e8","#b4a7d6","#d5a6bd"],
    ["#e06666","#f6b26b","#ffd966","#93c47d","#6fa8dc","#8e7cc3","#c27ba0"],
    ["#c00","#e69138","#f1c232","#6aa84f","#3d85c6","#674ea7","#a64d79"],
    ["#900","#b45f06","#bf9000","#38761d","#0b5394","#351c75","#741b47"],
    ["#600","#783f04","#7f6000","#274e13","#073763","#20124d","#4c1130"]
];

var paletteDiv = document.getElementById('paletteContainer');
var showPaletteBtn = document.getElementById('show-palette-btn');
showPaletteBtn.addEventListener('click', function (e) {
    $(showPaletteBtn).hide();
    $(paletteDiv).show();
});
var closePaletteBtn = document.getElementById('close-palette');
closePaletteBtn.addEventListener('click', function (e) {
    $(showPaletteBtn).show();
    $(paletteDiv).hide();
});

$("#showPaletteOnly").spectrum({
    color: "#000",
    showPaletteOnly: true,
    flat: true,
    change: function(color) {
        var rgb = color.toRgb();
        WILL.setcolor(Module.Color.from(rgb.r, rgb.g, rgb.b, rgb.a));
        $(showPaletteBtn.children[0]).css('background-color', color.toHexString());
    },
    palette: myPalette
});