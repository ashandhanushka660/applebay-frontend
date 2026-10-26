"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

interface Course {
  id: number;
  code: string;
  name: string;
  active: boolean;
}

interface ClassSheetRow {
  enrollmentId: number;
  studentNumber: string;
  studentName: string;
  status: "PRESENT" | "LATE" | "ABSENT" | null;
}

interface EligibilityRow {
  enrollmentId: number;
  studentNumber: string;
  studentName: string;
  sessions: number;
  attended: number;
  percentage: number;
  eligible: boolean;
}

export default function AttendancePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [batch, setBatch] = useState("2026-B1");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [activeTab, setActiveTab] = useState<"mark" | "eligibility">("mark");
  const [sheet, setSheet] = useState<ClassSheetRow[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, "PRESENT" | "LATE" | "ABSENT">>({});
  const [eligibilityList, setEligibilityList] = useState<EligibilityRow[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchApi<Course[]>("/courses").then((res) => {
      // Exclude inactive courses from dropdown
      setCourses(res.filter((c) => c.active));
    });
  }, []);

  const loadClassSheet = async () => {
    if (!courseId) return;
    setLoading(true);
    try {
      const data = await fetchApi<ClassSheetRow[]>(`/attendance/class-sheet?courseId=${courseId}&batch=${batch}&date=${date}`);
      setSheet(data);
      const initialMap: Record<number, "PRESENT" | "LATE" | "ABSENT"> = {};
      data.forEach((r) => {
        initialMap[r.enrollmentId] = r.status || "PRESENT";
      });
      setAttendanceMap(initialMap);
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
      setSheet([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEligibility = async () => {
    if (!courseId) return;
    setLoading(true);
    setMsg(null);
    try {
      const data = await fetchApi<EligibilityRow[]>(`/attendance/eligibility?courseId=${courseId}&batch=${batch}`);
      setEligibilityList(data);
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
      setEligibilityList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAttendance = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const records = Object.entries(attendanceMap).map(([k, v]) => ({
        enrollmentId: Number(k),
        status: v,
      }));
      const res = await fetchApi<any>("/attendance", {
        method: "POST",
        body: JSON.stringify({
          courseId: Number(courseId),
          batch,
          date,
          records,
        }),
      });
      setMsg({
        type: "success",
        text: `Attendance saved! (Created: ${res.created}, Updated: ${res.updated}, Unchanged: ${res.unchanged})`,
      });
      loadClassSheet().catch(() => {});
    } catch (e: any) {
      setMsg({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance & Exam Eligibility (FR07-FR09)</h1>
        <p className="text-sm text-slate-500">Record cohort attendance, support corrections without duplicates, and monitor 80% exam eligibility thresholds.</p>
      </div>

      {msg && (
        <div className={`p-4 rounded-md text-sm border ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Cohort Selector */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Select Course (Active Only)</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm bg-white">
            <option value="">-- Choose Course --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Batch</label>
          <input value={batch} onChange={(e) => setBatch(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={() => { setActiveTab("mark"); loadClassSheet(); }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-xs font-semibold transition"
          >
            Load Sheet (FR07/08)
          </button>
          <button
            onClick={() => { setActiveTab("eligibility"); loadEligibility(); }}
            className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2 rounded-md text-xs font-semibold transition"
          >
            Check 80% (FR09)
          </button>
        </div>
      </div>

      {/* Tab 1: Class Sheet */}
      {activeTab === "mark" && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <span className="font-semibold text-slate-800">Class Attendance Sheet ({date})</span>
            {sheet.length > 0 && (
              <button onClick={handleSaveAttendance} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-md transition">
                {loading ? "Saving..." : "Submit / Update Attendance"}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  <th className="p-4">Student Number</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Status Selection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sheet.map((r) => (
                  <tr key={r.enrollmentId} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-medium">{r.studentNumber}</td>
                    <td className="p-4">{r.studentName}</td>
                    <td className="p-4">
                      <div className="flex space-x-4">
                        {(["PRESENT", "LATE", "ABSENT"] as const).map((st) => (
                          <label key={st} className="flex items-center space-x-1 cursor-pointer text-xs">
                            <input
                              type="radio"
                              name={`status-${r.enrollmentId}`}
                              checked={attendanceMap[r.enrollmentId] === st}
                              onChange={() => setAttendanceMap((prev) => ({ ...prev, [r.enrollmentId]: st }))}
                            />
                            <span>{st}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {sheet.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-6 text-center text-slate-500">Select an active course and click Load Sheet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: 80% Eligibility View */}
      {activeTab === "eligibility" && (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b font-semibold text-slate-800">
            Exam Eligibility Thresholds (&ge; 80%)
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b">
                <tr>
                  <th className="p-4">Student Number</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Total Sessions</th>
                  <th className="p-4">Attended (P+L)</th>
                  <th className="p-4">Percentage</th>
                  <th className="p-4">Eligibility Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {eligibilityList.map((row) => (
                  <tr key={row.enrollmentId} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-medium">{row.studentNumber}</td>
                    <td className="p-4">{row.studentName}</td>
                    <td className="p-4">{row.sessions}</td>
                    <td className="p-4">{row.attended}</td>
                    <td className="p-4 font-bold">{row.percentage}%</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${row.eligible ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                        {row.eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
                      </span>
                    </td>
                  </tr>
                ))}
                {eligibilityList.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500">No attendance data to calculate.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
