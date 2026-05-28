package com.redline.app

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

class LogFragment : Fragment() {

    private lateinit var rvHistory: RecyclerView
    private lateinit var runAdapter: RunAdapter
    private val runHistory = mutableListOf<Run>()

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_log, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        rvHistory = view.findViewById(R.id.rvHistory)
        runAdapter = RunAdapter(runHistory)
        rvHistory.layoutManager = LinearLayoutManager(requireContext())
        rvHistory.adapter = runAdapter

        loadRunHistory()
    }

    private fun loadRunHistory() {
        val prefs = requireContext().getSharedPreferences("redline_prefs", Context.MODE_PRIVATE)
        val json = prefs.getString("run_history", null)
        if (json != null) {
            val type = object : TypeToken<List<Run>>() {}.type
            val savedRuns: List<Run> = Gson().fromJson(json, type)
            runHistory.clear()
            runHistory.addAll(savedRuns)
            runAdapter.updateRuns(runHistory)
        }
    }
}
