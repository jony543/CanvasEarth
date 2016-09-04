package com.example.jonathan.canvasearthandroid;

import android.os.PersistableBundle;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;

import com.wikitude.architect.ArchitectView;
import com.wikitude.architect.StartupConfiguration;

import java.io.IOException;

public class Augment extends AppCompatActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
            super.onCreate(savedInstanceState);
            setContentView(R.layout.activity_augment);

            this.architectView = (ArchitectView)this.findViewById(R.id.architectView );
            final StartupConfiguration config = new StartupConfiguration(LICENSE_KEY);
            this.architectView.onCreate( config );
    }

    @Override
    public void onPostCreate(Bundle savedInstanceState, PersistableBundle persistentState) {
        super.onPostCreate(savedInstanceState, persistentState);
        try {
            this.architectView.load("192.168.1.6:8080"); //todo add path to HTML
        } catch (IOException e) {
            e.printStackTrace();
        }

    }

    private ArchitectView architectView;
    //todo should be on the layout xml
    private static final String LICENSE_KEY="HBY4VY3dgxwDZ20lvKyft3ooKW8kchyMcLIozA9XlNCe1J4zZ1eA6+LY+WGHEnSphtF3j8X/2XmOTQWmBdLbLSp5ctTmsmnu8KJVGEdKNK/dZY32t7MBJAYj3EG1ELQnnL4OGQ41RZz9bYuXAtf7V/ZC0fokr/Y5Cw9tKrIvWEhTYWx0ZWRfX98A4dV4G/DEwk8IjuEoK02LcCIsPCEMNkmQuiROTqJc3hP2zbi6KRpoIyKzqTqp3XAVlzAWMQzY29JX+0kSUvN2H5wYN8XZjNaqPNONWRX2XhvnVG2AoX7EvMgq2+Zjm7GJ/etghBPaUqA+KOellXlwp8UqI4NvPrBR9BOrFYEY7W30bD2ftPihxP6EabruLSYGErW5dIjGWpl1Et8Z687+5wGuRJqXcQMhf/MbXeEHNQ0X+njg9G6gex3NIlKDLMPH2Rzrvvqs6+fomtuBj75YLiQzBVojMmjJaJVSswxOOooij6Pk9JwBxKqD/Ic/GEy6MCLPrmORqGPrDnIU/5Oijoioo4K6Ii+ocEtxpX30ulY5AgL1CW9fxnc5CT33IZ2jb9Qh2jP5aRh6X0Youl0r8m57QBo66vI5+MwKMjkkBNe8qHjefexhOYcGhJq0cdIgvG0dxwbUlfNo6pCXVl9IuMZu0jKa458ggUlCEkGzO6RAJLWBGak=";

}
