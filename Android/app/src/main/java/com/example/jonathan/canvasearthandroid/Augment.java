package com.example.jonathan.canvasearthandroid;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.location.LocationListener;
import android.net.Uri;
import android.os.Environment;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.widget.Toast;

import com.wikitude.architect.ArchitectView;
import com.wikitude.architect.ArchitectView.ArchitectUrlListener;
import com.wikitude.architect.StartupConfiguration;

import java.io.File;
import java.io.FileOutputStream;


public class Augment extends AbstractArchitectActivity {
    @Override
    protected StartupConfiguration.CameraPosition getCameraPosition() {
        return StartupConfiguration.CameraPosition.DEFAULT;
    }

    @Override
    protected boolean hasGeo() {
        return false;
    }

    @Override
    protected boolean hasIR() {
        return true;
    }

    @Override
    public String getActivityTitle() {
        return "Augment";
    }

    @Override
    public String getARchitectWorldPath() {
        return "http://172.16.68.205:8080/index.html";
    }

    @Override
    public ArchitectUrlListener getUrlListener() {
        return new ArchitectUrlListener() {

            @Override
            public boolean urlWasInvoked(String uriString) {
                Uri invokedUri = Uri.parse(uriString);

                // pressed "More" button on POI-detail panel
                if ("markerselected".equalsIgnoreCase(invokedUri.getHost())) {
                    final Intent poiDetailIntent = new Intent(Augment.this, SamplePoiDetailActivity.class);
                    poiDetailIntent.putExtra(SamplePoiDetailActivity.EXTRAS_KEY_POI_ID, String.valueOf(invokedUri.getQueryParameter("id")) );
                    poiDetailIntent.putExtra(SamplePoiDetailActivity.EXTRAS_KEY_POI_TITILE, String.valueOf(invokedUri.getQueryParameter("title")) );
                    poiDetailIntent.putExtra(SamplePoiDetailActivity.EXTRAS_KEY_POI_DESCR, String.valueOf(invokedUri.getQueryParameter("description")) );
                    Augment.this.startActivity(poiDetailIntent);
                    return true;
                }

                // pressed snapshot button. check if host is button to fetch e.g. 'architectsdk://button?action=captureScreen', you may add more checks if more buttons are used inside AR scene
                else if ("button".equalsIgnoreCase(invokedUri.getHost())) {
                    Augment.this.architectView.captureScreen(ArchitectView.CaptureScreenCallback.CAPTURE_MODE_CAM_AND_WEBVIEW, new ArchitectView.CaptureScreenCallback() {

                        @Override
                        public void onScreenCaptured(final Bitmap screenCapture) {
                            if ( ContextCompat.checkSelfPermission(Augment.this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED ) {
                                Augment.this.screenCapture = screenCapture;
                                ActivityCompat.requestPermissions(Augment.this, new String[]{Manifest.permission.WRITE_EXTERNAL_STORAGE}, WIKITUDE_PERMISSIONS_REQUEST_EXTERNAL_STORAGE);
                            } else {
                                Augment.this.saveScreenCaptureToExternalStorage(screenCapture);
                            }
                        }
                    });
                }
                return true;
            }
        };
    }
    protected void saveScreenCaptureToExternalStorage(Bitmap screenCapture) {
        if ( screenCapture != null ) {
            // store screenCapture into external cache directory
            final File screenCaptureFile = new File(Environment.getExternalStorageDirectory().toString(), "screenCapture_" + System.currentTimeMillis() + ".jpg");

            // 1. Save bitmap to file & compress to jpeg. You may use PNG too
            try {

                final FileOutputStream out = new FileOutputStream(screenCaptureFile);
                screenCapture.compress(Bitmap.CompressFormat.JPEG, 90, out);
                out.flush();
                out.close();

                // 2. create send intent
                final Intent share = new Intent(Intent.ACTION_SEND);
                share.setType("image/jpg");
                share.putExtra(Intent.EXTRA_STREAM, Uri.fromFile(screenCaptureFile));

                // 3. launch intent-chooser
                final String chooserTitle = "Share Snaphot";
                Augment.this.startActivity(Intent.createChooser(share, chooserTitle));

            } catch (final Exception e) {
                // should not occur when all permissions are set
                Augment.this.runOnUiThread(new Runnable() {

                    @Override
                    public void run() {
                        // show toast message in case something went wrong
                        Toast.makeText(Augment.this, "Unexpected error, " + e, Toast.LENGTH_LONG).show();
                    }
                });
            }
        }
    }

    @Override
    public int getContentViewId() {
        return R.layout.activity_augment;
    }

    @Override
    public String getWikitudeSDKLicenseKey() {
      return LICENSE_KEY;
    }

    @Override
    public int getArchitectViewId() {
        return R.id.architectView;
    }

    @Override
    public ILocationProvider getLocationProvider(LocationListener locationListener) {
        return null;
    }

    @Override
    public ArchitectView.SensorAccuracyChangeListener getSensorAccuracyListener() {
        return null;
    }

    @Override
    public float getInitialCullingDistanceMeters() {
        return 0;
    }

    protected Bitmap screenCapture = null;

    private static final int WIKITUDE_PERMISSIONS_REQUEST_EXTERNAL_STORAGE = 3;
//
//    @SuppressLint("NewApi")
//    @Override
//    protected void onCreate(Bundle savedInstanceState) {
//        super.onCreate(savedInstanceState);
//        setContentView(R.layout.activity_augment);
//        this.architectView = (ArchitectView)this.findViewById(R.id.architectView );
//        final StartupConfiguration config = new StartupConfiguration(LICENSE_KEY);
//        try {
//			/* first mandatory life-cycle notification */
//            this.architectView.onCreate( config );
//        } catch (RuntimeException rex) {
//            this.architectView = null; //todo when we create a logger, use it.
//        }
//
//    }
//
//    @Override
//    public void onPostCreate(Bundle savedInstanceState, PersistableBundle persistentState) {
//        super.onPostCreate(savedInstanceState, persistentState);
//        if (this.architectView != null) {
//            this.architectView.onPostCreate();
//            try {
//                this.architectView.load("http://192.168.1.6:8080"); //todo add path to HTML
//            } catch (IOException e) {
//                e.printStackTrace();
//            }
//        }
//    }
//
//    @Override
//    protected void onResume() {
//        super.onResume();
//        this.architectView.onResume();
//    }
//
//    @Override
//    protected void onDestroy() {
//        super.onDestroy();
//        this.architectView.onDestroy();
//    }
//
//    @Override
//    public void onLowMemory() {
//        super.onLowMemory();
//        this.architectView.onLowMemory();
//    }
//
//    @Override
//    protected void onPause() {
//        super.onPause();
//        this.architectView.onPause();
//    }
//
//
//    /* --- Private Methods --- */
//
////    private ArchitectUrlListener getUrlListener() {
////        return new ArchitectUrlListener() {
////            @Override
////            public boolean urlWasInvoked(String s) {
////                Uri invokedUri = Uri.parse(s);
////
////                // pressed "More" button on POI-detail panel
////                if ("markerselected".equalsIgnoreCase(invokedUri.getHost())) {
////                    final Intent poiDetailIntent = new Intent(this, SamplePoiDetailActivity.class);
////                    poiDetailIntent.putExtra(SamplePoiDetailActivity.EXTRAS_KEY_POI_ID, String.valueOf(invokedUri.getQueryParameter("id")) );
////                    poiDetailIntent.putExtra(SamplePoiDetailActivity.EXTRAS_KEY_POI_TITILE, String.valueOf(invokedUri.getQueryParameter("title")) );
////                    poiDetailIntent.putExtra(SamplePoiDetailActivity.EXTRAS_KEY_POI_DESCR, String.valueOf(invokedUri.getQueryParameter("description")) );
////                    Augment.this.startActivity(poiDetailIntent);
////                    return true;
////                }
////            }
////        }
////    }
//    /* --- Private Members --- */
//
//
//    private ArchitectView architectView;
////     location listener receives location updates and must forward them to the architectView
//    private LocationListener locationListener;
//    private ArchitectUrlListener urlListener;
//
//    //todo should be on the layout xml
    private static final String LICENSE_KEY="HBY4VY3dgxwDZ20lvKyft3ooKW8kchyMcLIozA9XlNCe1J4zZ1eA6+LY+WGHEnSphtF3j8X/2XmOTQWmBdLbLSp5ctTmsmnu8KJVGEdKNK/dZY32t7MBJAYj3EG1ELQnnL4OGQ41RZz9bYuXAtf7V/ZC0fokr/Y5Cw9tKrIvWEhTYWx0ZWRfX98A4dV4G/DEwk8IjuEoK02LcCIsPCEMNkmQuiROTqJc3hP2zbi6KRpoIyKzqTqp3XAVlzAWMQzY29JX+0kSUvN2H5wYN8XZjNaqPNONWRX2XhvnVG2AoX7EvMgq2+Zjm7GJ/etghBPaUqA+KOellXlwp8UqI4NvPrBR9BOrFYEY7W30bD2ftPihxP6EabruLSYGErW5dIjGWpl1Et8Z687+5wGuRJqXcQMhf/MbXeEHNQ0X+njg9G6gex3NIlKDLMPH2Rzrvvqs6+fomtuBj75YLiQzBVojMmjJaJVSswxOOooij6Pk9JwBxKqD/Ic/GEy6MCLPrmORqGPrDnIU/5Oijoioo4K6Ii+ocEtxpX30ulY5AgL1CW9fxnc5CT33IZ2jb9Qh2jP5aRh6X0Youl0r8m57QBo66vI5+MwKMjkkBNe8qHjefexhOYcGhJq0cdIgvG0dxwbUlfNo6pCXVl9IuMZu0jKa458ggUlCEkGzO6RAJLWBGak=";

}
