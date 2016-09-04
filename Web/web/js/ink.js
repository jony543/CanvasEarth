var WILL = {
    backgroundColor: Module.Color.WHITE,
    color: Module.Color.from(204, 204, 204),

    init: function(width, height) {
        this.initInkEngine(width, height);
        this.initEvents();
        //debugger;
    },

    saveAsImage: function() {
        //debugger;
        //var pixels = this.canvas.readPixels(Module.RectTools.create(0,0,200,200));
        //var tmpCanvas = document.createElement('canvas');
        //tmpCanvas.width = 200; // this.canvas.width;
        //tmpCanvas.height = 200; //this.canvas.height;
        //var context = tmpCanvas.getContext('2d');
        //var imgData = context.createImageData(200,200); //this.canvas.width, this.canvas.height);
        //imgData.data.set(pixels);
        //
        //document.body.appendChild(tmpCanvas);
        //
        //return tmpCanvas.toDataURL('image/png');

        return this.canvas.surface.toDataURL('image/png');
    },

    initInkEngine: function(width, height) {
        this.canvas = new Module.InkCanvas(document.getElementById("canvas"), width, height, {preserveDrawingBuffer: true});
        this.canvas.clear(this.backgroundColor);

        this.brush = new Module.DirectBrush();

        this.speedPathBuilder = new Module.SpeedPathBuilder();
        this.speedPathBuilder.setNormalizationConfig(182, 3547);
        this.speedPathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);

        if (window.PointerEvent) {
            this.pressurePathBuilder = new Module.PressurePathBuilder();
            this.pressurePathBuilder.setNormalizationConfig(0.195, 0.88);
            this.pressurePathBuilder.setPropertyConfig(Module.PropertyName.Width, 2.05, 34.53, 0.72, NaN, Module.PropertyFunction.Power, 1.19, false);
        }

        this.strokeRenderer = new Module.StrokeRenderer(this.canvas, this.canvas);
        this.strokeRenderer.configure({brush: this.brush, color: this.color});
    },

    initEvents: function() {
        //var self = this;

        var self = this;

        $(Module.canvas).on("mousedown", function(e) {self.beginStroke(e);});
        $(Module.canvas).on("mousemove", function(e) {self.moveStroke(e);});
        $(document).on("mouseup", function(e) {self.endStroke(e);});

        Module.canvas.addEventListener("touchstart", function(e) {self.beginStroke(e);});
        Module.canvas.addEventListener("touchmove", function(e) {self.moveStroke(e);});
        document.addEventListener("touchend", function(e) {self.endStroke(e);});

        document.ontouchmove = function(e) {
            e.preventDefault();
        }
    },

    initImageLayer: function(url, w, h) {
        //debugger;
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
                this.canvas.blend(this.imageLayer, {
                    mode: Module.BlendMode.NONE,
                    transform: Module.MatTools.makeScale(scale)
                });
            },
            this
        );
    },

    getPressure: function(e) {
        return (window.PointerEvent && e instanceof PointerEvent && e.pressure !== 0.5)?e.pressure:NaN;
    },

    getXYfromMouseEvent: function(evt){
        var x = evt.pageX - $('#canvas').offset().left;
        var y = evt.pageY - $('#canvas').offset().top;

        return {x: x, y: y};
    },

    beginStroke: function(e) {
        //if (e.button != 0) return;
        if (["mousedown", "mouseup"].contains(e.type) && e.button != 0) return;
        if (e.changedTouches) e = e.changedTouches[0];

        this.inputPhase = Module.InputPhase.Begin;
        this.pressure = this.getPressure(e);
        this.pathBuilder = isNaN(this.pressure)?this.speedPathBuilder:this.pressurePathBuilder;

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
        var pathBuilderValue = isNaN(this.pressure)?Date.now() / 1000:this.pressure;

        var pathPart = this.pathBuilder.addPoint(this.inputPhase, pos, pathBuilderValue);
        var pathContext = this.pathBuilder.addPathPart(pathPart);

        this.pathPart = pathContext.getPathPart();
    },

    drawPath: function() {
        this.strokeRenderer.draw(this.pathPart, this.inputPhase == Module.InputPhase.End);
    },

    clear: function() {
        this.canvas.clear(this.backgroundColor);
    }
};

Module.addPostScript(function() {
    WILL.init(1600, 300);
});