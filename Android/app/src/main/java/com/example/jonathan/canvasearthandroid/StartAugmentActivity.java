package com.example.jonathan.canvasearthandroid;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.widget.Toast;

public class StartAugmentActivity extends AppCompatActivity {
    private static final int CANVAS_EARTH_PERMISSIONS_REQUEST_CAMERA = 1;
    private static final int CANVAS_EARTH_PERMISSIONS_REQUEST_GPS = 2;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_start_augment);

        if ( ContextCompat.checkSelfPermission(this, android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED ) {
            ActivityCompat.requestPermissions(this, new String[]{android.Manifest.permission.CAMERA}, CANVAS_EARTH_PERMISSIONS_REQUEST_CAMERA);
        } else {
            if ( ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED ) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, CANVAS_EARTH_PERMISSIONS_REQUEST_GPS);
            } else {
                loadAugment();
            }
        }
    }

    private void loadAugment() {
        Intent augmentIntent = new Intent(StartAugmentActivity.this, BeyondARtest.class);
        startActivity(augmentIntent);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        switch (requestCode) {
            case CANVAS_EARTH_PERMISSIONS_REQUEST_CAMERA: {
                if ( grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED ) {
                    if ( ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED ) {
                        ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, CANVAS_EARTH_PERMISSIONS_REQUEST_GPS);
                    } else {
                        loadAugment();
                    }
                } else {
                    Toast.makeText(this, "Sorry, augmented reality doesn't work without reality.\n\nPlease grant camera permission.", Toast.LENGTH_LONG).show();
                }
                return;
            }
            case CANVAS_EARTH_PERMISSIONS_REQUEST_GPS: {
                if ( grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED ) {
                    loadAugment();
                } else {
                    Toast.makeText(this, "Sorry, this example requires access to your location in order to work properly.\n\nPlease grant location permission.", Toast.LENGTH_SHORT).show();
                }
                return;
            }
        }
    }
}
