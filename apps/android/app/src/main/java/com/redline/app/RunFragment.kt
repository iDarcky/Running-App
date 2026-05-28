package com.redline.app

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.os.Bundle
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.fragment.app.Fragment
import com.google.android.gms.location.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class RunFragment : Fragment() {

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback

    private var isTracking = false
    private var lastLocation: Location? = null
    private var totalDistanceMeters = 0f
    private var startTimeMs = 0L

    private lateinit var tvDistance: TextView
    private lateinit var tvPace: TextView
    private lateinit var btnToggleTracking: Button

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_run, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        tvDistance = view.findViewById(R.id.tvDistance)
        tvPace = view.findViewById(R.id.tvPace)
        btnToggleTracking = view.findViewById(R.id.btnToggleTracking)

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(requireContext())

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
        if (ActivityCompat.checkSelfPermission(requireContext(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION), 100)
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

        val distanceKm = totalDistanceMeters / 1000f
        if (distanceKm > 0.01f) {
            saveRun(distanceKm, tvPace.text.toString())
            Toast.makeText(requireContext(), "Run saved to Log!", Toast.LENGTH_SHORT).show()
        }
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

    private fun saveRun(distanceKm: Float, pace: String) {
        val prefs = requireContext().getSharedPreferences("redline_prefs", Context.MODE_PRIVATE)
        val json = prefs.getString("run_history", null)

        val runHistory = mutableListOf<Run>()
        if (json != null) {
            val type = object : TypeToken<List<Run>>() {}.type
            val savedRuns: List<Run> = Gson().fromJson(json, type)
            runHistory.addAll(savedRuns)
        }

        val newRun = Run(System.currentTimeMillis(), distanceKm, pace)
        runHistory.add(0, newRun) // Add to top

        val editor = prefs.edit()
        val newJson = Gson().toJson(runHistory)
        editor.putString("run_history", newJson)
        editor.apply()
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 100) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                startTracking()
            } else {
                Toast.makeText(requireContext(), "Location permission is required to track runs.", Toast.LENGTH_LONG).show()
            }
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        if (isTracking) {
            fusedLocationClient.removeLocationUpdates(locationCallback)
        }
    }
}
