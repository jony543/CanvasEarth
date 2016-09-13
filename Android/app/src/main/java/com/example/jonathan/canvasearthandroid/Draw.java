package com.example.jonathan.canvasearthandroid;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.opengl.GLES20;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.util.Log;
import android.view.MotionEvent;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.graphics.Color;
import android.view.View;

import com.wacom.ink.path.PathBuilder;
import com.wacom.ink.path.PathUtils;
import com.wacom.ink.path.PressurePathBuilder;
import com.wacom.ink.path.SpeedPathBuilder;
import com.wacom.ink.rasterization.BlendMode;
import com.wacom.ink.rasterization.InkCanvas;
import com.wacom.ink.rasterization.Layer;
import com.wacom.ink.rasterization.SolidColorBrush;
import com.wacom.ink.rasterization.StrokePaint;
import com.wacom.ink.rasterization.StrokeRenderer;
import com.wacom.ink.rendering.EGLRenderingContext.EGLConfiguration;
import com.wacom.ink.smooth.MultiChannelSmoothener;

import java.nio.FloatBuffer;

public class Draw extends AppCompatActivity {
    private InkCanvas inkCanvas;

    private Layer viewLayer;
    private Layer strokesLayer;
    private Layer currentFrameLayer;
    private Layer imageLayer;

    private PressurePathBuilder pathBuilder;
    private int pathStride;

    private StrokePaint paint;
    private SolidColorBrush brush;
    private StrokeRenderer strokeRenderer;
    private MultiChannelSmoothener smoothener;

    private boolean smooth = false;
    private boolean drawPreliminary;

    private Bitmap canvasBitmap;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_draw);

        Bundle b = getIntent().getExtras();
        canvasBitmap = b.getParcelable("Canvas");
        if (canvasBitmap == null) {
            // load test bitmap to canvas
            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inSampleSize = 1;
            opts.inScaled = false;
            canvasBitmap = BitmapFactory.decodeResource(getResources(), R.drawable.tree_of_life, opts);
        }

        pathBuilder = new PressurePathBuilder(); // new SpeedPathBuilder();
        pathBuilder.setNormalizationConfig(100.0f, 4000.0f);
        pathBuilder.setMovementThreshold(2.0f);
        pathBuilder.setPropertyConfig(PathBuilder.PropertyName.Width, 5f, 10f, 5f, 10f, PathBuilder.PropertyFunction.Power, 1.0f, false);
        pathStride = pathBuilder.getStride();

        drawPreliminary = smooth; // if using smoothing algorithm then also draw preliminary path to avoid lag. See Wacom documentation for details.

        SurfaceView surfaceView = (SurfaceView) findViewById(R.id.surfaceview);
        surfaceView.getHolder().addCallback(new SurfaceHolder.Callback(){
            @Override
            public void surfaceChanged(SurfaceHolder holder, int format, int width, int height) {
                if (inkCanvas!=null && !inkCanvas.isDisposed()){
                    releaseResources();
                }

                inkCanvas = InkCanvas.create(holder, new EGLConfiguration());

                viewLayer = inkCanvas.createViewLayer(width, height);
                strokesLayer = inkCanvas.createLayer(width, height);
                currentFrameLayer = inkCanvas.createLayer(width, height);
                imageLayer = inkCanvas.createLayer(width, height);

                inkCanvas.clearLayer(currentFrameLayer, Color.TRANSPARENT);

                brush = new SolidColorBrush();

                paint = new StrokePaint();
                paint.setStrokeBrush(brush);	// Solid color brush.
                paint.setColor(Color.BLUE);		// Blue color.
                paint.setWidth(Float.NaN);		// Expected variable width.

                smoothener = new MultiChannelSmoothener(pathStride);
                smoothener.enableChannel(2);

                strokeRenderer = new StrokeRenderer(inkCanvas, paint, pathStride, width, height);

                setBitmapCanvas(canvasBitmap);

                renderView();
            }

            private void setBitmapCanvas(Bitmap bitmap){
                inkCanvas.loadBitmap(imageLayer, bitmap, GLES20.GL_LINEAR, GLES20.GL_CLAMP_TO_EDGE);
                inkCanvas.setTarget(viewLayer);
                inkCanvas.drawLayer(imageLayer, BlendMode.BLENDMODE_OVERWRITE);
                inkCanvas.invalidate();
            }

            @Override
            public void surfaceCreated(SurfaceHolder holder) {
            }

            @Override
            public void surfaceDestroyed(SurfaceHolder holder) {
                releaseResources();
            }
        });

        surfaceView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                buildPath(event);
                drawStroke(event);
                renderView();
                return true;            }
        });
    }

    private void renderView() {
        inkCanvas.setTarget(viewLayer);
        // Copy the current frame layer in the view layer to present it on the screen.
        inkCanvas.drawLayer(currentFrameLayer, BlendMode.BLENDMODE_NORMAL);
        inkCanvas.invalidate();
    }

    private void buildPath(MotionEvent event){
        if (event.getAction()!=MotionEvent.ACTION_DOWN
                && event.getAction()!=MotionEvent.ACTION_MOVE
                && event.getAction()!=MotionEvent.ACTION_UP){
            return;
        }

        PathUtils.Phase phase = PathUtils.getPhaseFromMotionEvent(event);
        // Add the current input point to the path builder
        FloatBuffer part = pathBuilder.addPoint(phase, event.getX(), event.getY(), event.getEventTime());
        int partSize = pathBuilder.getPathPartSize();
        Log.d(this.getClass().getSimpleName(), "xx(1): path size=" + pathBuilder.getPathSize() + " | pos=" + pathBuilder.getPathLastUpdatePosition() + " | added_size=" + pathBuilder.getAddedPointsSize());

        if (partSize>0){
            if (smooth){
                // Smooth the returned control points (aka path part).
                MultiChannelSmoothener.SmoothingResult smoothingResult = smoothener.smooth(part, partSize, (phase== PathUtils.Phase.END));
                // Add the smoothed control points to the path builder.
                pathBuilder.addPathPart(smoothingResult.getSmoothedPoints(), smoothingResult.getSize());
            } else {
                // Add the returned control points (aka path part) to the path builder.
                pathBuilder.addPathPart(part, partSize);
            }
        }

        if (smooth && drawPreliminary) {
            // Create a preliminary path.
            FloatBuffer preliminaryPath = pathBuilder.createPreliminaryPath();
            // Smoothen the preliminary path's control points (return inform of a path part).
            MultiChannelSmoothener.SmoothingResult preliminarySmoothingResult = smoothener.smooth(preliminaryPath, pathBuilder.getPreliminaryPathSize(), true);
            // Add the smoothed preliminary path to the path builder.
            pathBuilder.finishPreliminaryPath(preliminarySmoothingResult.getSmoothedPoints(), preliminarySmoothingResult.getSize());

            Log.d(this.getClass().getSimpleName(), "xx(2): path size=" + pathBuilder.getPathSize() + " | pos=" + pathBuilder.getPathLastUpdatePosition() + " | added_size=" + pathBuilder.getAddedPointsSize());
        }
    }

    private void drawStroke(MotionEvent event){
        strokeRenderer.drawPoints(pathBuilder.getPathBuffer(), pathBuilder.getPathLastUpdatePosition(), pathBuilder.getAddedPointsSize(), event.getAction()==MotionEvent.ACTION_UP);
        if (drawPreliminary) {
            strokeRenderer.drawPrelimPoints(pathBuilder.getPreliminaryPathBuffer(), 0, pathBuilder.getFinishedPreliminaryPathSize());
        }
        if (event.getAction()!=MotionEvent.ACTION_UP){
            inkCanvas.setTarget(currentFrameLayer, strokeRenderer.getStrokeUpdatedArea());
            inkCanvas.clearColor(Color.TRANSPARENT);
            inkCanvas.drawLayer(strokesLayer, BlendMode.BLENDMODE_NORMAL);
            strokeRenderer.blendStrokeUpdatedArea(currentFrameLayer, BlendMode.BLENDMODE_NORMAL);
        } else {
            strokeRenderer.blendStroke(strokesLayer, BlendMode.BLENDMODE_NORMAL);
            inkCanvas.setTarget(currentFrameLayer);
            inkCanvas.clearColor(Color.TRANSPARENT);
            inkCanvas.drawLayer(strokesLayer, BlendMode.BLENDMODE_NORMAL);
        }
    }

    private void releaseResources(){
        strokeRenderer.dispose();
        inkCanvas.dispose();
    }
}
