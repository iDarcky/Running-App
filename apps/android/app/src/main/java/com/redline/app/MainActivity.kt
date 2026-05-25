package com.redline.app

import android.Manifest
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.os.Looper
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.*

class MainActivity : AppCompatActivity() {

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback

    private var isTracking = false
    private var lastLocation: Location? = null
    private var totalDistanceMeters = 0f
    private var startTimeMs = 0L

    private lateinit var tvDistance: TextView
    private lateinit var tvPace: TextView
    private lateinit var btnToggleTracking: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        tvDistance = findViewById(R.id.tvDistance)
        tvPace = findViewById(R.id.tvPace)
        btnToggleTracking = findViewById(R.id.btnToggleTracking)

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                for (location in locationResult.locations) {
                    updateLocation(location)
                }
            }
        }

        btnToggleTracking.setOnClickListener {
            if (isTracking) {
                stopTracking()
            } else {
                startTracking()
            }
        }
    }

    private fun startTracking() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION), 100)
            return
        }

        isTracking = true
        btnToggleTracking.text = "Stop Run"
        btnToggleTracking.setBackgroundColor(android.graphics.Color.DKGRAY)

        lastLocation = null
        totalDistanceMeters = 0f
        startTimeMs = System.currentTimeMillis()
        updateUI()

        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 2000)
            .setMinUpdateIntervalMillis(1000)
            .build()

        fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
    }

    private fun stopTracking() {
        isTracking = false
        btnToggleTracking.text = "Start Run"
        btnToggleTracking.setBackgroundColor(android.graphics.Color.parseColor("#EE0000"))
        fusedLocationClient.removeLocationUpdates(locationCallback)
    }

    private fun updateLocation(location: Location) {
        if (lastLocation != null) {
            val distance = lastLocation!!.distanceTo(location)
            totalDistanceMeters += distance
        }
        lastLocation = location
        updateUI()
    }

    private fun updateUI() {
        val distanceKm = totalDistanceMeters / 1000f
        tvDistance.text = String.format("%.2f km", distanceKm)

        if (distanceKm > 0.01f) {
            val elapsedMinutes = (System.currentTimeMillis() - startTimeMs) / 60000.0
            val paceMinutesPerKm = elapsedMinutes / distanceKm

            val minutes = paceMinutesPerKm.toInt()
            val seconds = ((paceMinutesPerKm - minutes) * 60).toInt()
            tvPace.text = String.format("%d:%02d /km", minutes, seconds)
        } else {
            tvPace.text = "0:00 /km"
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 100) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startTracking()
            } else {
                Toast.makeText(this, "Location permission is required to track runs.", Toast.LENGTH_LONG).show()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (isTracking) {
            fusedLocationClient.removeLocationUpdates(locationCallback)
        }
    }
}
