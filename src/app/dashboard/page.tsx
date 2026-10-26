"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import Link from "next/link";

interface DashboardData {
  totalStudents: number;
  activeCourses: number;
  attendanceMarkedToday: number;
  totalFeesCollected: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = () => {
    setLoading(true);
    fetchApi<DashboardData>("/dashboard")
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
        setError(err.message || "Failed to load dashboard metrics");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return (
    <div className="space-y-8">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Institute Overview (FR14)</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time academic metrics, cohort statistics, and revenue summary.
          </p>
        </div>
        <button
          onClick={loadMetrics}
          className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-xs text-xs font-semibold rounded-md text-slate-700 bg-white hover:bg-slate-50 transition"
        >
          Refresh Metrics
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-md text-sm bg-red-50 text-red-800 border border-red-200">
          {error}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Students */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Students</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600 text-sm">👥</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : (data?.totalStudents ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">Enrolled across all cohorts</p>
          </div>
        </div>

        {/* Metric 2: Active Courses */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Programmes</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600 text-sm">📚</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : (data?.activeCourses ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">HND &amp; Certificate courses</p>
          </div>
        </div>

        {/* Metric 3: Today Attendance */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today Attendance</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600 text-sm">📅</span>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {loading ? "..." : (data?.attendanceMarkedToday ?? 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-400 mt-1">Logged student sessions today</p>
          </div>
        </div>

        {/* Metric 4: Fees Collected */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fees Collected</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600 text-sm">💳</span>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold text-slate-900 font-mono">
              {loading
                ? "..."
                : "LKR " + (data?.totalFeesCollected ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-slate-400 mt-1">Ledger receipts &amp; instalments</p>
          </div>
        </div>
      </div>

      {/* Quick Access Action Shortcuts */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h2 className="text-base font-semibold text-slate-800">Operational Navigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
          <Link
            href="/register"
            className="p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
          >
            <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600">
              New Registration &rarr;
            </div>
            <p className="text-xs text-slate-500 mt-1">Atomic student enrollment with initial fee instalment</p>
          </Link>

          <Link
            href="/students"
            className="p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
          >
            <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600">
              Student Directory &rarr;
            </div>
            <p className="text-xs text-slate-500 mt-1">Search, paginate, edit, and safely delete records</p>
          </Link>

          <Link
            href="/attendance"
            className="p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
          >
            <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600">
              Class Attendance &rarr;
            </div>
            <p className="text-xs text-slate-500 mt-1">Bulk daily sign-in and 80% exam eligibility matrix</p>
          </Link>

          <Link
            href="/payments"
            className="p-4 rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group"
          >
            <div className="font-semibold text-sm text-slate-900 group-hover:text-blue-600">
              Fee Ledgers &rarr;
            </div>
            <p className="text-xs text-slate-500 mt-1">Record instalments, view balances, and print receipts</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
