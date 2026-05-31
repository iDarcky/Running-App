package com.redline.app

import android.Manifest
import android.content.BroadcastReceiver
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.ServiceConnection
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Polyline
import org.osmdroid.views.overlay.Marker

class RunFragment : Fragment() {

    private lateinit var tvDistance: TextView
    private lateinit var tvPace: TextView
    private lateinit var tvDuration: TextView
    private lateinit var tvCalories: TextView
    private lateinit var btnPlayPause: ImageButton
    private lateinit var btnStop: ImageButton
    private lateinit var mapView: MapView
    private lateinit var routeOverlay: Polyline
    private var currentMarker: Marker? = null

    private var trackingService: TrackingService? = null
    private var isBound = false

    private val connection = object : ServiceConnection {
        override fun onServiceConnected(className: ComponentName, service: IBinder) {
            val binder = service as TrackingService.LocalBinder
            trackingService = binder.getService()
            isBound = true
            syncUIWithService()
        }

        override fun onServiceDisconnected(arg0: ComponentName) {
            isBound = false
            trackingService = null
        }
    }

    private val trackingUpdateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            syncUIWithService()
        }
    }

    private val locationUpdateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            val lat = intent?.getDoubleExtra("latitude", 0.0)
            val lon = intent?.getDoubleExtra("longitude", 0.0)
            if (lat != null && lon != null && lat != 0.0 && lon != 0.0) {
                val geoPoint = GeoPoint(lat, lon)

                // If it's the first point in a new run (or view just created), center the map
                if (routeOverlay.actualPoints.isEmpty()) {
                    mapView.controller.setCenter(geoPoint)
                }

                routeOverlay.addPoint(geoPoint)

                if (currentMarker == null) {
                    currentMarker = Marker(mapView)
                    mapView.overlays.add(currentMarker)
                }
                currentMarker?.position = geoPoint
                currentMarker?.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)

                mapView.controller.animateTo(geoPoint)
                mapView.invalidate()
            }
        }
    }

    // Timer for UI updates
    private val handler = android.os.Handler(Looper.getMainLooper())
    private val timerRunnable = object : Runnable {
        override fun run() {
            trackingService?.let {
                if (it.isTracking && !it.isPaused) {
                    val elapsedSeconds = (System.currentTimeMillis() - it.startTimeMs) / 1000
                    val minutes = elapsedSeconds / 60
                    val seconds = elapsedSeconds % 60
                    tvDuration.text = String.format("%02d:%02d", minutes, seconds)
                }
            }
            handler.postDelayed(this, 1000)
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

        mapView.setTileSource(TileSourceFactory.MAPNIK)
        mapView.setMultiTouchControls(true)
        mapView.controller.setZoom(16.0)
        routeOverlay = Polyline()
        routeOverlay.outlinePaint.color = android.graphics.Color.parseColor("#EE0000")
        routeOverlay.outlinePaint.strokeWidth = 10f
        mapView.overlays.add(routeOverlay)

        btnPlayPause.setOnClickListener {
            trackingService?.let { service ->
                if (!service.isTracking) {
                    requestPermissionsAndStart()
                } else if (!service.isPaused) {
                    sendActionToService("ACTION_PAUSE_TRACKING")
                } else {
                    sendActionToService("ACTION_RESUME_TRACKING")
                }
            } ?: run {
                requestPermissionsAndStart()
            }
        }

        btnStop.setOnClickListener {
            trackingService?.let { service ->
                val distanceKm = service.totalDistanceMeters / 1000f
                val paceStr = tvPace.text.toString()

                sendActionToService("ACTION_STOP_TRACKING")

                if (distanceKm > 0.01f) {
                    service.saveRun(distanceKm, "$paceStr /km")
                    Toast.makeText(requireContext(), "Run saved to Log!", Toast.LENGTH_SHORT).show()
                }

                resetUI()
            }
        }

        // Bind to service
        val intent = Intent(requireContext(), TrackingService::class.java)
        requireContext().bindService(intent, connection, Context.BIND_AUTO_CREATE)
    }

    private fun requestPermissionsAndStart() {
        val permissionsToRequest = mutableListOf<String>()

        if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(Manifest.permission.ACCESS_FINE_LOCATION)
            permissionsToRequest.add(Manifest.permission.ACCESS_COARSE_LOCATION)
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                permissionsToRequest.add(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(requireActivity(), permissionsToRequest.toTypedArray(), 100)
        } else {
            startTracking()
        }
    }

    private fun startTracking() {
        resetUI()
        val intent = Intent(requireContext(), TrackingService::class.java)
        intent.action = "ACTION_START_TRACKING"
        ContextCompat.startForegroundService(requireContext(), intent)
    }

    private fun sendActionToService(action: String) {
        val intent = Intent(requireContext(), TrackingService::class.java)
        intent.action = action
        ContextCompat.startForegroundService(requireContext(), intent)
    }

    private fun syncUIWithService() {
        trackingService?.let { service ->
            if (service.isTracking) {
                btnStop.visibility = if (service.isPaused) View.VISIBLE else View.GONE
                btnPlayPause.setImageResource(if (service.isPaused) R.drawable.ic_play else R.drawable.ic_pause)

                val distanceKm = service.totalDistanceMeters / 1000f
                tvDistance.text = String.format("%.2f", distanceKm)
                tvCalories.text = Math.round(distanceKm * 60).toString()

                if (!service.isPaused) {
                    val elapsedSeconds = (System.currentTimeMillis() - service.startTimeMs) / 1000
                    val minutes = elapsedSeconds / 60
                    val seconds = elapsedSeconds % 60
                    tvDuration.text = String.format("%02d:%02d", minutes, seconds)
                }

                if (distanceKm > 0.01f) {
                    val elapsedMinutes = (System.currentTimeMillis() - service.startTimeMs) / 60000.0
                    val paceMinutesPerKm = elapsedMinutes / distanceKm

                    val pMinutes = paceMinutesPerKm.toInt()
                    val pSeconds = ((paceMinutesPerKm - pMinutes) * 60).toInt()
                    tvPace.text = String.format("%d:%02d", pMinutes, pSeconds)
                } else {
                    tvPace.text = "--:--"
                }
            } else {
                resetUI()
            }
        }
    }

    private fun resetUI() {
        tvDistance.text = "0.00"
        tvDuration.text = "00:00"
        tvPace.text = "--:--"
        tvCalories.text = "0"
        btnPlayPause.setImageResource(R.drawable.ic_play)
        btnStop.visibility = View.GONE
        routeOverlay.setPoints(emptyList())
        if (currentMarker != null) {
            mapView.overlays.remove(currentMarker)
            currentMarker = null
        }
        mapView.invalidate()
    }

    override fun onResume() {
        super.onResume()
        mapView.onResume()

        LocalBroadcastManager.getInstance(requireContext()).registerReceiver(
            trackingUpdateReceiver, IntentFilter("TRACKING_UPDATE")
        )
        LocalBroadcastManager.getInstance(requireContext()).registerReceiver(
            locationUpdateReceiver, IntentFilter("TRACKING_LOCATION_UPDATE")
        )

        handler.post(timerRunnable)
        syncUIWithService() // Sync immediately in case service state changed
    }

    override fun onPause() {
        super.onPause()
        mapView.onPause()
        LocalBroadcastManager.getInstance(requireContext()).unregisterReceiver(trackingUpdateReceiver)
        LocalBroadcastManager.getInstance(requireContext()).unregisterReceiver(locationUpdateReceiver)
        handler.removeCallbacks(timerRunnable)
    }

    override fun onDestroyView() {
        super.onDestroyView()
        if (isBound) {
            requireContext().unbindService(connection)
            isBound = false
        }
    }
}
