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
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.fragment.app.Fragment
import com.google.android.gms.location.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Polyline
import org.osmdroid.views.overlay.Marker

class RunFragment : Fragment() {

    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback

    private var isTracking = false
    private var isPaused = false
    private var lastLocation: Location? = null
    private var totalDistanceMeters = 0f
    private var startTimeMs = 0L
    private var pausedTimeMs = 0L

    private lateinit var tvDistance: TextView
    private lateinit var tvPace: TextView
    private lateinit var tvDuration: TextView
    private lateinit var tvCalories: TextView
    private lateinit var btnPlayPause: ImageButton
    private lateinit var btnStop: ImageButton
    private lateinit var mapView: MapView
    private lateinit var routeOverlay: Polyline
    private var currentMarker: Marker? = null

    // For duration formatting thread
    private val handler = android.os.Handler(Looper.getMainLooper())
    private val timerRunnable = object : Runnable {
        override fun run() {
            if (isTracking && !isPaused) {
                updateDurationUI()
                handler.postDelayed(this, 1000)
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        Context.MODE_PRIVATE.let {
            Configuration.getInstance().load(requireContext(), requireContext().getSharedPreferences("osmdroid", it))
        }
        return inflater.inflate(R.layout.fragment_run, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        tvDistance = view.findViewById(R.id.tvDistance)
        tvPace = view.findViewById(R.id.tvPace)
        tvDuration = view.findViewById(R.id.tvDuration)
        tvCalories = view.findViewById(R.id.tvCalories)
        btnPlayPause = view.findViewById(R.id.btnPlayPause)
        btnStop = view.findViewById(R.id.btnStop)
        mapView = view.findViewById(R.id.mapView)

        // Setup Map
        mapView.setTileSource(TileSourceFactory.MAPNIK)
        mapView.setMultiTouchControls(true)
        mapView.controller.setZoom(16.0)
        routeOverlay = Polyline()
        routeOverlay.outlinePaint.color = android.graphics.Color.parseColor("#EE0000")
        routeOverlay.outlinePaint.strokeWidth = 10f
        mapView.overlays.add(routeOverlay)

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(requireContext())

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                if (!isPaused) {
                    for (location in locationResult.locations) {
                        updateLocation(location)
                    }
                }
            }
        }

        btnPlayPause.setOnClickListener {
            if (!isTracking) {
                startTracking()
            } else if (!isPaused) {
                pauseTracking()
            } else {
                resumeTracking()
            }
        }

        btnStop.setOnClickListener {
            stopTracking()
        }
    }

    private fun startTracking() {
        if (ActivityCompat.checkSelfPermission(requireContext(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION), 100)
            return
        }

        isTracking = true
        isPaused = false
        btnPlayPause.setImageResource(R.drawable.ic_pause)
        btnStop.visibility = View.GONE

        lastLocation = null
        totalDistanceMeters = 0f
        startTimeMs = System.currentTimeMillis()
        routeOverlay.setPoints(emptyList())
        mapView.invalidate()

        updateUI()
        handler.post(timerRunnable)

        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 2000)
            .setMinUpdateIntervalMillis(1000)
            .build()

        fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
    }

    private fun pauseTracking() {
        isPaused = true
        btnPlayPause.setImageResource(R.drawable.ic_play)
        btnStop.visibility = View.VISIBLE
        pausedTimeMs = System.currentTimeMillis()
    }

    private fun resumeTracking() {
        isPaused = false
        btnPlayPause.setImageResource(R.drawable.ic_pause)
        btnStop.visibility = View.GONE

        // Adjust start time to account for pause duration
        startTimeMs += (System.currentTimeMillis() - pausedTimeMs)
        handler.post(timerRunnable)
    }

    private fun stopTracking() {
        isTracking = false
        isPaused = false
        btnPlayPause.setImageResource(R.drawable.ic_play)
        btnStop.visibility = View.GONE

        fusedLocationClient.removeLocationUpdates(locationCallback)
        handler.removeCallbacks(timerRunnable)

        val distanceKm = totalDistanceMeters / 1000f
        if (distanceKm > 0.01f) {
            saveRun(distanceKm, tvPace.text.toString())
            Toast.makeText(requireContext(), "Run saved to Log!", Toast.LENGTH_SHORT).show()
        }

        // Reset UI for next run
        tvDistance.text = "0.00"
        tvDuration.text = "00:00"
        tvPace.text = "--:--"
        tvCalories.text = "0"
        routeOverlay.setPoints(emptyList())
        if (currentMarker != null) {
            mapView.overlays.remove(currentMarker)
            currentMarker = null
        }
        mapView.invalidate()
    }

    private fun updateLocation(location: Location) {
        val geoPoint = GeoPoint(location.latitude, location.longitude)

        if (lastLocation != null) {
            val distance = lastLocation!!.distanceTo(location)
            totalDistanceMeters += distance
        } else {
            // First location, center map
            mapView.controller.setCenter(geoPoint)
        }

        lastLocation = location
        routeOverlay.addPoint(geoPoint)

        // Update Marker
        if (currentMarker == null) {
            currentMarker = Marker(mapView)
            mapView.overlays.add(currentMarker)
        }
        currentMarker?.position = geoPoint
        currentMarker?.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)

        // Follow user
        mapView.controller.animateTo(geoPoint)
        mapView.invalidate()

        updateUI()
    }

    private fun updateDurationUI() {
        val elapsedSeconds = (System.currentTimeMillis() - startTimeMs) / 1000
        val minutes = elapsedSeconds / 60
        val seconds = elapsedSeconds % 60
        tvDuration.text = String.format("%02d:%02d", minutes, seconds)
    }

    private fun updateUI() {
        val distanceKm = totalDistanceMeters / 1000f
        tvDistance.text = String.format("%.2f", distanceKm)

        tvCalories.text = Math.round(distanceKm * 60).toString()

        if (distanceKm > 0.01f) {
            val elapsedMinutes = (System.currentTimeMillis() - startTimeMs) / 60000.0
            val paceMinutesPerKm = elapsedMinutes / distanceKm

            val minutes = paceMinutesPerKm.toInt()
            val seconds = ((paceMinutesPerKm - minutes) * 60).toInt()
            tvPace.text = String.format("%d:%02d", minutes, seconds)
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

        val newRun = Run(System.currentTimeMillis(), distanceKm, "$pace /km")
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

    override fun onResume() {
        super.onResume()
        mapView.onResume()
    }

    override fun onPause() {
        super.onPause()
        mapView.onPause()
    }

    override fun onDestroyView() {
        super.onDestroyView()
        if (isTracking) {
            fusedLocationClient.removeLocationUpdates(locationCallback)
            handler.removeCallbacks(timerRunnable)
        }
    }
}
