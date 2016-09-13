package com.example.jonathan.canvasearthandroid;

import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.database.Cursor;
import android.graphics.BitmapFactory;
import android.media.ExifInterface;
import android.net.Uri;
import android.os.Environment;
import android.provider.MediaStore;
import android.support.v7.app.AlertDialog;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.graphics.Bitmap;
import android.widget.ImageView;
import android.widget.TextView;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;

public class SelectImageFromGalleryActivity extends AppCompatActivity {
    private final static int SELECT_PHOTO = 100;

    private ImageView imageView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_select_image_from_gallery);

        imageView = (ImageView) findViewById(R.id.imageView);

        Intent photoPickerIntent = new Intent(Intent.ACTION_PICK);
        photoPickerIntent.setType("image/*");
        startActivityForResult(photoPickerIntent, SELECT_PHOTO);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == SELECT_PHOTO && resultCode == RESULT_OK && data != null) {
            Uri pickedImage = data.getData();
            try {
                Bitmap bitmap =
                        MediaStore.Images.Media.getBitmap(this.getContentResolver(), pickedImage);
                        //BitmapFactory.decodeStream(new FileInputStream(new File(pickedImage))); //, options);
                imageView.setImageBitmap(bitmap);
            } catch (FileNotFoundException ex) {

            } catch (IOException ex) {

            }
        }
    }

    private void ShowDialog(String msg){
        Context context = this.getBaseContext();
        AlertDialog.Builder alertDialogBuilder = new AlertDialog.Builder(context);

        final TextView textView = new TextView(context);
        textView.setText(msg);
        alertDialogBuilder.setView(textView);

        // set dialog message
        alertDialogBuilder.setCancelable(false).setPositiveButton("OK", new DialogInterface.OnClickListener() {
            public void onClick(DialogInterface dialog, int id) {
            }
        });

        // create alert dialog
        AlertDialog alertDialog = alertDialogBuilder.create();
        // show it
        alertDialog.show();
    }
}
