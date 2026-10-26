"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

interface Course {
  id: number;
  code: string;
  name: string;
  level: "HND" | "CERTIFICATE";
  durationMonths: number;
  totalFee: number;
  active: boolean;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State (New Course)
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [level, setLevel] = useState<"HND" | "CERTIFICATE">("HND");
  const [durationMonths, setDuration] = useState("");
  const [totalFee, setTotalFee] = useState("");

  // Edit Modal State
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // Delete Modal State
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || null;

  const loadCourses = () => {
    fetchApi<Course[]>("/courses")
      .then((data) => {
        setCourses(data);
        if (selectedCourseId && !data.some((c) => c.id === selectedCourseId)) {
          setSelectedCourseId(null);
        }
      })
      .catch((e) => setMsg({ type: "error", text: e.message }))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    try {
      await fetchApi<Course>("/courses", {
        method: "POST",
        body: JSON.stringify({
          code,
          name,
          level,
          durationMonths: Number(durationMonths),
          totalFee: Number(totalFee),
        }),
      });
      setMsg({ type: "success", text: "Course created successfully!" });
      setCode("");
      setName("");
      setDuration("");
      setTotalFee("");
      loadCourses();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;
    setMsg(null);
    try {
      await fetchApi<Course>(`/courses/${editingCourse.id}`, {
        method: "PUT",
        body: JSON.stringify({
          code: editingCourse.code,
          name: editingCourse.name,
          level: editingCourse.level,
          durationMonths: Number(editingCourse.durationMonths),
          totalFee: Number(editingCourse.totalFee),
        }),
      });
      setMsg({ type: "success", text: `Course "${editingCourse.code}" updated successfully!` });
      setEditingCourse(null);
      loadCourses();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleExecuteDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingCourse || deleteConfirmText.trim().toUpperCase() !== "DELETE") return;
    setIsDeleting(true);
    setMsg(null);
    try {
      await fetchApi(`/courses/${deletingCourse.id}`, { method: "DELETE" });
      setMsg({
        type: "success",
        text: `Course "${deletingCourse.code}" and its associated enrollments, payments, and attendance logs were deleted.`,
      });
      setDeletingCourse(null);
      setDeleteConfirmText("");
      setSelectedCourseId(null);
      loadCourses();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (course: Course) => {
    setMsg(null);
    const endpoint = course.active ? `/courses/${course.id}/deactivate` : `/courses/${course.id}/reactivate`;
    try {
      await fetchApi(endpoint, { method: "PATCH" });
      setMsg({
        type: "success",
        text: `Course "${course.code}" ${course.active ? "deactivated" : "reactivated"} successfully.`,
      });
      loadCourses();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Course Management (FR01)</h1>
        <p className="text-sm text-slate-500">
          Create, edit, delete, activate, or deactivate academic courses.
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-md text-sm border ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Add Course Form */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Add New Course</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Course Code</label>
            <input required value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. HND-IT" className="w-full px-3 py-2 border rounded-md text-sm font-mono" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Course Name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Higher National Diploma in IT" className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Level</label>
            <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="w-full px-3 py-2 border rounded-md text-sm bg-white">
              <option value="HND">HND</option>
              <option value="CERTIFICATE">Certificate</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (Months)</label>
            <input required type="number" min="1" value={durationMonths} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 18" className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Total Fee (LKR)</label>
            <input required type="number" step="0.01" min="1" value={totalFee} onChange={(e) => setTotalFee(e.target.value)} placeholder="e.g. 350000.00" className="w-full px-3 py-2 border rounded-md text-sm" />
          </div>
          <div className="flex items-end">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md text-sm transition">
              Create Course
            </button>
          </div>
        </form>
      </div>

      {/* Courses Table with Radio Selection */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <span className="font-semibold text-slate-800">Existing Courses</span>
          <span className="text-xs text-slate-500">
            {selectedCourse ? (
              <>Selected: <strong className="text-blue-600 font-mono">{selectedCourse.code}</strong> - {selectedCourse.name}</>
            ) : (
              "Click a radio button to select a course"
            )}
          </span>
        </div>
        {loading ? (
          <div className="p-6 text-center text-slate-500">Loading courses...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b select-none">
                <tr>
                  <th className="p-4 w-12 text-center">Select</th>
                  <th className="p-4">Code / ID</th>
                  <th className="p-4">Course Name</th>
                  <th className="p-4">Level</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Fee (LKR)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Status Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => {
                  const isSelected = selectedCourseId === c.id;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCourseId(c.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "bg-blue-50/70" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selectedCourse"
                          checked={isSelected}
                          onChange={() => setSelectedCourseId(c.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-900">{c.code}</td>
                      <td className="p-4 font-medium">{c.name}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-xs rounded bg-slate-100 font-semibold text-slate-700">
                          {c.level}
                        </span>
                      </td>
                      <td className="p-4">{c.durationMonths} mos</td>
                      <td className="p-4 font-mono">{Number(c.totalFee).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${c.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                          {c.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded border transition ${
                            c.active
                              ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                              : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {c.active ? "Deactivate" : "Reactivate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Actions Bar */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs text-slate-600">
            {selectedCourse ? (
              <span>Target: <strong className="font-mono text-slate-900">{selectedCourse.code}</strong> - {selectedCourse.name}</span>
            ) : (
              <span className="italic text-slate-400">Select any course from the table above to activate Edit or Delete.</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!selectedCourse}
              onClick={() => selectedCourse && setEditingCourse(selectedCourse)}
              className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-xs text-sm font-semibold rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Edit Selected Course
            </button>
            <button
              type="button"
              disabled={!selectedCourse}
              onClick={() => {
                if (selectedCourse) {
                  setDeletingCourse(selectedCourse);
                  setDeleteConfirmText("");
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition"
            >
              Delete Selected Course
            </button>
          </div>
        </div>
      </div>

      {/* Edit Course Modal */}
      {editingCourse && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-900">Edit Course: {editingCourse.code}</h3>
              <button onClick={() => setEditingCourse(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Course Code</label>
                <input required value={editingCourse.code} onChange={(e) => setEditingCourse({ ...editingCourse, code: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm font-mono" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Course Name</label>
                <input required value={editingCourse.name} onChange={(e) => setEditingCourse({ ...editingCourse, name: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Level</label>
                  <select value={editingCourse.level} onChange={(e) => setEditingCourse({ ...editingCourse, level: e.target.value as any })} className="w-full px-3 py-2 border rounded-md text-sm bg-white">
                    <option value="HND">HND</option>
                    <option value="CERTIFICATE">Certificate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Duration (Months)</label>
                  <input required type="number" min="1" value={editingCourse.durationMonths} onChange={(e) => setEditingCourse({ ...editingCourse, durationMonths: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-md text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Total Fee (LKR)</label>
                <input required type="number" step="0.01" min="1" value={editingCourse.totalFee} onChange={(e) => setEditingCourse({ ...editingCourse, totalFee: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setEditingCourse(null)} className="px-4 py-2 border rounded-md text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCourse && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4 border border-red-200">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-red-600 text-lg">Confirm Course Deletion</h3>
              <button
                onClick={() => {
                  setDeletingCourse(null);
                  setDeleteConfirmText("");
                }}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <p>
                Are you sure you want to permanently delete course{" "}
                <strong className="text-slate-900">{deletingCourse.code}</strong> (<em>{deletingCourse.name}</em>)?
              </p>
              <div className="p-3 bg-red-50 text-red-800 rounded-md text-xs border border-red-200">
                <strong>Warning:</strong> Deleting this course will also remove all student enrollments, attendance entries, and fee records linked to it.
              </div>
              <p className="text-xs text-slate-700 pt-2">
                To confirm, type <strong className="font-mono text-red-600">DELETE</strong> in the box below:
              </p>
            </div>

            <form onSubmit={handleExecuteDelete} className="space-y-4">
              <input
                type="text"
                autoFocus
                required
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:ring-2 focus:ring-red-500 focus:outline-none"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeletingCourse(null);
                    setDeleteConfirmText("");
                  }}
                  className="px-4 py-2 border rounded-md text-sm text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || isDeleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-md text-sm font-semibold transition"
                >
                  {isDeleting ? "Deleting..." : "Permanently Delete Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
