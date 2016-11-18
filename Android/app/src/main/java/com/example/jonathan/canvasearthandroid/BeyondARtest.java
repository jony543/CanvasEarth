package com.example.jonathan.canvasearthandroid;

import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.widget.Toast;

import com.beyondar.android.fragment.BeyondarFragmentSupport;
import com.beyondar.android.view.OnClickBeyondarObjectListener;
import com.beyondar.android.world.BeyondarObject;
import com.beyondar.android.world.World;

import java.util.ArrayList;

public class BeyondARtest extends AppCompatActivity {
    private BeyondarFragmentSupport m_BeyondarFragment;
    private World m_World;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_beyond_artest);

        m_BeyondarFragment = (BeyondarFragmentSupport) getSupportFragmentManager().findFragmentById(R.id.beyondarFragment);

        m_World = BeyondARTestWorld.generateObjects(this);

        // Finally we add the Wold data in to the fragment
        m_BeyondarFragment.setWorld(m_World);

        // We also can see the Frames per seconds
//        m_BeyondarFragment.showFPS(true);
    }
}
