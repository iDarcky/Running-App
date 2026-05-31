package com.redline.app

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.os.Binder
import android.os.Build
import android.os.IBinder
import android.os.Looper
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import com.google.android.gms.location.*
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class TrackingService : Service() {

    private val binder = LocalBinder()
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback

    var isTracking = false
        private set
    var isPaused = false
        private set
    var totalDistanceMeters = 0f
        private set
    var startTimeMs = 0L
        private set
    private var pausedTimeMs = 0L

    var lastLocation: Location? = null
        private set

    private val CHANNEL_ID = "TrackingServiceChannel"
    private val NOTIFICATION_ID = 1

    // For duration formatting thread
    private val handler = android.os.Handler(Looper.getMainLooper())
    private val timerRunnable = object : Runnable {
        override fun run() {
            if (isTracking && !isPaused) {
                updateNotification()
                broadcastUpdate()
                handler.postDelayed(this, 1000)
            }
        }
    }

    inner class LocalBinder : Binder() {
        fun getService(): TrackingService = this@TrackingService
    }

    override fun onCreate() {
        super.onCreate()
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
        createNotificationChannel()

        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                if (!isPaused) {
                    for (location in locationResult.locations) {
                        updateLocation(location)
                    }
                }
            }
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            "ACTION_START_TRACKING" -> startTracking()
            "ACTION_PAUSE_TRACKING" -> pauseTracking()
            "ACTION_RESUME_TRACKING" -> resumeTracking()
            "ACTION_STOP_TRACKING" -> stopTracking()
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder {
        return binder
    }

    private fun startTracking() {
        if (isTracking) return

        isTracking = true
        isPaused = false
        totalDistanceMeters = 0f
        startTimeMs = System.currentTimeMillis()
        lastLocation = null

        startForeground(NOTIFICATION_ID, createNotification())

        val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 2000)
            .setMinUpdateIntervalMillis(1000)
            .build()

        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, Looper.getMainLooper())
        }

        handler.post(timerRunnable)
        broadcastUpdate()
    }

    private fun pauseTracking() {
        if (!isTracking || isPaused) return
        isPaused = true
        pausedTimeMs = System.currentTimeMillis()
        updateNotification()
        broadcastUpdate()
    }

    private fun resumeTracking() {
        if (!isTracking || !isPaused) return
        isPaused = false
        startTimeMs += (System.currentTimeMillis() - pausedTimeMs)
        handler.post(timerRunnable)
        updateNotification()
        broadcastUpdate()
    }

    private fun stopTracking() {
        if (!isTracking) return
        isTracking = false
        isPaused = false

        fusedLocationClient.removeLocationUpdates(locationCallback)
        handler.removeCallbacks(timerRunnable)
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()

        broadcastUpdate()
    }

    fun saveRun(distanceKm: Float, pace: String) {
        val prefs = getSharedPreferences("redline_prefs", Context.MODE_PRIVATE)
        val json = prefs.getString("run_history", null)

        val runHistory = mutableListOf<Run>()
        if (json != null) {
            val type = object : TypeToken<List<Run>>() {}.type
            val savedRuns: List<Run> = Gson().fromJson(json, type)
            runHistory.addAll(savedRuns)
        }

        val newRun = Run(System.currentTimeMillis(), distanceKm, "$pace")
        runHistory.add(0, newRun)

        val editor = prefs.edit()
        editor.putString("run_history", Gson().toJson(runHistory))
        editor.apply()
    }

    private fun updateLocation(location: Location) {
        if (lastLocation != null) {
            val distance = lastLocation!!.distanceTo(location)
            totalDistanceMeters += distance
        }
        lastLocation = location
        broadcastLocation(location)
    }

    private fun broadcastLocation(location: Location) {
        val intent = Intent("TRACKING_LOCATION_UPDATE")
        intent.putExtra("latitude", location.latitude)
        intent.putExtra("longitude", location.longitude)
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
    }

    private fun broadcastUpdate() {
        val intent = Intent("TRACKING_UPDATE")
        intent.putExtra("isTracking", isTracking)
        intent.putExtra("isPaused", isPaused)
        intent.putExtra("totalDistanceMeters", totalDistanceMeters)
        intent.putExtra("startTimeMs", startTimeMs)
        LocalBroadcastManager.getInstance(this).sendBroadcast(intent)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                CHANNEL_ID,
                "Tracking Service Channel",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
        }
    }

    private fun createNotification(): Notification {
        val notificationIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val elapsedSeconds = if (startTimeMs > 0) (System.currentTimeMillis() - startTimeMs) / 1000 else 0
        val minutes = elapsedSeconds / 60
        val seconds = elapsedSeconds % 60
        val durationStr = String.format("%02d:%02d", minutes, seconds)
        val distanceKm = totalDistanceMeters / 1000f

        val contentText = if (isTracking && !isPaused) {
            "Distance: ${String.format("%.2f", distanceKm)} km | Time: $durationStr"
        } else if (isPaused) {
            "Run Paused"
        } else {
            "Tracking your run..."
        }

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("RedLine Tracking")
            .setContentText(contentText)
            .setSmallIcon(android.R.drawable.ic_menu_mylocation)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification() {
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify(NOTIFICATION_ID, createNotification())
    }
}
