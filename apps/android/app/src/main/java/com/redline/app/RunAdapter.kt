package com.redline.app

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class RunAdapter(private var runs: List<Run>) : RecyclerView.Adapter<RunAdapter.RunViewHolder>() {

    class RunViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val tvDate: TextView = view.findViewById(R.id.tvRunDate)
        val tvDistance: TextView = view.findViewById(R.id.tvRunDistance)
        val tvPace: TextView = view.findViewById(R.id.tvRunPace)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RunViewHolder {
        val view = LayoutInflater.from(parent.context).inflate(R.layout.item_run, parent, false)
        return RunViewHolder(view)
    }

    override fun onBindViewHolder(holder: RunViewHolder, position: Int) {
        val run = runs[position]
        val sdf = SimpleDateFormat("MMM dd, yyyy HH:mm", Locale.getDefault())
        holder.tvDate.text = sdf.format(Date(run.timestamp))
        holder.tvDistance.text = String.format("%.2f km", run.distanceKm)
        holder.tvPace.text = run.paceString
    }

    override fun getItemCount() = runs.size

    fun updateRuns(newRuns: List<Run>) {
        runs = newRuns
        notifyDataSetChanged()
    }
}
