"use client";
import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";

interface Student {
  id: number;
  studentNumber: string;
  firstName: string;
  lastName: string;
  nic: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth?: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface CourseOption {
  id: number;
  code: string;
  name: string;
  level: string;
  totalFee: number;
  active: boolean;
}

interface EnrolledStudentRow {
  id: number;
  studentId: number;
  studentNumber: string;
  studentName: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  batch: string;
  enrolledOn: string;
}

export default function StudentsDirectoryPage() {
  const [activeTab, setActiveTab] = useState<"directory" | "courseWise">("directory");

  // Tab 1: Directory State
  const [data, setData] = useState<PageResponse<Student> | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Delete Confirmation Modal State
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Tab 2: Course & Batch Specific State
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [allCourseStudents, setAllCourseStudents] = useState<EnrolledStudentRow[]>([]);
  const [rosterSearch, setRosterSearch] = useState<string>("");
  const [loadingCourseStudents, setLoadingCourseStudents] = useState(false);
  const [hasSearchedCourse, setHasSearchedCourse] = useState(false);

  const selectedStudent = data?.content.find((s) => s.id === selectedStudentId) || null;
  const activeCourses = courses.filter((c) => c.active);

  const loadStudents = (searchQ = query, p = page) => {
    setLoading(true);
    fetchApi<PageResponse<Student>>(`/students?q=${encodeURIComponent(searchQ)}&page=${p}&size=10`)
      .then((res) => {
        setData(res);
        if (selectedStudentId && !res.content.some((s) => s.id === selectedStudentId)) {
          setSelectedStudentId(null);
        }
      })
      .catch((e) => setMsg({ type: "error", text: e.message }))
      .finally(() => setLoading(false));
  };

  const loadCourses = () => {
    fetchApi<CourseOption[]>("/courses")
      .then((res) => {
        setCourses(res);
        const onlyActive = res.filter((c) => c.active);
        if (onlyActive.length > 0 && !selectedCourseId) {
          const firstCourseId = String(onlyActive[0].id);
          setSelectedCourseId(firstCourseId);
          fetchBatchesForCourse(firstCourseId);
        }
      })
      .catch((e) => console.error("Failed to load courses:", e));
  };

  const fetchBatchesForCourse = async (courseId: string) => {
    try {
      const res = await fetchApi<EnrolledStudentRow[]>(`/enrollments/course/${courseId}`);
      const rawList = Array.isArray(res) ? res : [];
      setAllCourseStudents(rawList);
      const uniqueBatches = Array.from(new Set(rawList.map((e) => e.batch))).filter(Boolean).sort();
      setAvailableBatches(uniqueBatches);
      if (uniqueBatches.length > 0) {
        setSelectedBatch(uniqueBatches[0]);
      } else {
        setSelectedBatch("");
      }
    } catch (e) {
      console.error(e);
      setAvailableBatches([]);
      setSelectedBatch("");
    }
  };

  useEffect(() => {
    loadStudents(query, page);
    loadCourses();
  }, [page]);

  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    setHasSearchedCourse(false);
    fetchBatchesForCourse(courseId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setSelectedStudentId(null);
    loadStudents(query, 0);
  };

  const handleViewBatchRoster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;
    setLoadingCourseStudents(true);
    setHasSearchedCourse(true);
    setRosterSearch("");
    setTimeout(() => {
      setLoadingCourseStudents(false);
    }, 150);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setMsg(null);
    try {
      await fetchApi<Student>(`/students/${editingStudent.id}`, {
        method: "PUT",
        body: JSON.stringify({
          firstName: editingStudent.firstName,
          lastName: editingStudent.lastName,
          nic: editingStudent.nic,
          email: editingStudent.email,
          phone: editingStudent.phone,
          address: editingStudent.address,
          dateOfBirth: editingStudent.dateOfBirth || "2000-01-01",
        }),
      });
      setMsg({ type: "success", text: `Student ${editingStudent.studentNumber} updated successfully!` });
      setEditingStudent(null);
      loadStudents();
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    }
  };

  const handleExecuteDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingStudent || deleteConfirmText.trim().toUpperCase() !== "DELETE") return;
    setIsDeleting(true);
    setMsg(null);
    try {
      await fetchApi(`/students/${deletingStudent.id}`, { method: "DELETE" });
      setMsg({
        type: "success",
        text: `Student ${deletingStudent.studentNumber} (${deletingStudent.firstName} ${deletingStudent.lastName}) deleted.`,
      });
      setDeletingStudent(null);
      setDeleteConfirmText("");
      setSelectedStudentId(null);
      loadStudents();
      if (selectedCourseId) {
        fetchBatchesForCourse(selectedCourseId);
      }
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setIsDeleting(false);
    }
  };

  const activeCourseObj = activeCourses.find((c) => String(c.id) === selectedCourseId);

  // Filter students strictly by selected batch
  const batchStudents = allCourseStudents.filter((s) => s.batch === selectedBatch);

  // In-table search filter
  const filteredStudents = batchStudents.filter((s) => {
    const q = rosterSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      s.studentNumber.toLowerCase().includes(q) ||
      s.studentName.toLowerCase().includes(q) ||
      String(s.id).includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Directory (FR06)</h1>
        <p className="text-sm text-slate-500">
          Search students across cohorts or view rosters isolated by course and batch.
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-md text-sm border ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "directory"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            All Students Directory
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("courseWise");
              if (!hasSearchedCourse && selectedCourseId && selectedBatch) {
                setHasSearchedCourse(true);
              }
            }}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "courseWise"
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            View Course Enrollments
          </button>
        </nav>
      </div>

      {/* TAB 1: ALL STUDENTS DIRECTORY */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by student number, NIC, or full name..."
              className="w-full sm:w-96 px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-md text-sm font-medium transition">
              Search
            </button>
          </form>

          {/* Students Table with Radio Selector */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Searching records...</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b">
                      <tr>
                        <th className="p-4 w-12 text-center">Select</th>
                        <th className="p-4">Student Number</th>
                        <th className="p-4">Name</th>
                        <th className="p-4">NIC</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Phone</th>
                        <th className="p-4">Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data?.content.map((s) => {
                        const isSelected = selectedStudentId === s.id;
                        return (
                          <tr
                            key={s.id}
                            onClick={() => setSelectedStudentId(s.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-blue-50/70" : "hover:bg-slate-50"
                            }`}
                          >
                            <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="radio"
                                name="selectedStudent"
                                checked={isSelected}
                                onChange={() => setSelectedStudentId(s.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                              />
                            </td>
                            <td className="p-4 font-mono font-medium text-blue-600">{s.studentNumber}</td>
                            <td className="p-4 font-medium text-slate-800">{s.firstName} {s.lastName}</td>
                            <td className="p-4 font-mono text-slate-600">{s.nic}</td>
                            <td className="p-4 text-slate-600">{s.email}</td>
                            <td className="p-4 text-slate-600">{s.phone}</td>
                            <td className="p-4 text-slate-500">{s.address}</td>
                          </tr>
                        );
                      })}
                      {data?.content.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-500">No student records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 border-t flex items-center justify-between text-sm text-slate-600">
                  <span>
                    Total records: <strong>{data?.totalElements ?? 0}</strong> (Page {(data?.page ?? 0) + 1} of {data?.totalPages ?? 1})
                  </span>
                  <div className="flex space-x-2">
                    <button
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      className="px-3 py-1 border rounded text-xs disabled:opacity-50 hover:bg-slate-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={(data?.page ?? 0) + 1 >= (data?.totalPages ?? 1)}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1 border rounded text-xs disabled:opacity-50 hover:bg-slate-50"
                    >
                      Next
                    </button>
                  </div>
                </div>

                {/* Bottom Actions Bar */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-xs text-slate-600">
                    {selectedStudent ? (
                      <span>
                        Selected: <strong className="font-mono text-blue-600">{selectedStudent.studentNumber}</strong> &bull; {selectedStudent.firstName} {selectedStudent.lastName} (NIC: {selectedStudent.nic})
                      </span>
                    ) : (
                      <span className="italic text-slate-400">Select any student radio button from the table to activate Edit or Delete.</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={!selectedStudent}
                      onClick={() => selectedStudent && setEditingStudent(selectedStudent)}
                      className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-xs text-sm font-semibold rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Edit Selected Student
                    </button>
                    <button
                      type="button"
                      disabled={!selectedStudent}
                      onClick={() => {
                        if (selectedStudent) {
                          setDeletingStudent(selectedStudent);
                          setDeleteConfirmText("");
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition"
                    >
                      Delete Selected Student
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: COURSE & BATCH ISOLATED ENROLLMENTS VIEW */}
      {activeTab === "courseWise" && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Filter Enrolled Students by Course and Batch</h2>
              <p className="text-xs text-slate-500">Pick an active course and its specific batch cohort to view the isolated roster.</p>
            </div>
            <form onSubmit={handleViewBatchRoster} className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Dropdown 1: Course */}
              <div className="md:col-span-6">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Target Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {activeCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.name} (LKR {Number(c.totalFee).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Dropdown 2: Batch */}
              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Registered Cohort Batch</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  disabled={availableBatches.length === 0}
                  className="w-full px-3 py-2 border rounded-md text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {availableBatches.length === 0 ? (
                    <option value="">No registered batches</option>
                  ) : (
                    availableBatches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Trigger Button */}
              <div className="md:col-span-2 flex items-end">
                <button
                  type="submit"
                  disabled={loadingCourseStudents || !selectedBatch}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-2 px-3 rounded-md text-sm transition"
                >
                  {loadingCourseStudents ? "Loading..." : "View Students"}
                </button>
              </div>
            </form>
          </div>

          {/* Roster Result Table */}
          {hasSearchedCourse && (
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/60">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {activeCourseObj ? `${activeCourseObj.code} - ${activeCourseObj.name}` : "Roster"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cohort Batch: <strong className="font-mono text-blue-600">{selectedBatch || "None"}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={rosterSearch}
                      onChange={(e) => setRosterSearch(e.target.value)}
                      placeholder="Search within batch..."
                      className="w-56 pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <svg
                      className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                    Batch Students: {filteredStudents.length}
                  </span>
                </div>
              </div>

              {loadingCourseStudents ? (
                <div className="p-8 text-center text-slate-500 text-sm">Retrieving cohort batch records...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 border-b">
                      <tr>
                        <th className="p-4">Student Number</th>
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Cohort Batch</th>
                        <th className="p-4">Enrolled Date</th>
                        <th className="p-4 text-right">Enrollment ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-4 font-mono font-medium text-blue-600">{s.studentNumber}</td>
                          <td className="p-4 font-medium text-slate-900">{s.studentName}</td>
                          <td className="p-4 font-mono text-slate-600">{s.batch}</td>
                          <td className="p-4 text-slate-500">{s.enrolledOn || "—"}</td>
                          <td className="p-4 font-mono text-slate-500 text-right">#{s.id}</td>
                        </tr>
                      ))}
                      {filteredStudents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-slate-400">
                            No students registered in this batch.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-900">Edit Student: {editingStudent.studentNumber}</h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleUpdate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
                  <input required value={editingStudent.firstName} onChange={(e) => setEditingStudent({ ...editingStudent, firstName: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
                  <input required value={editingStudent.lastName} onChange={(e) => setEditingStudent({ ...editingStudent, lastName: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">NIC</label>
                  <input required value={editingStudent.nic} onChange={(e) => setEditingStudent({ ...editingStudent, nic: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                  <input required value={editingStudent.phone} onChange={(e) => setEditingStudent({ ...editingStudent, phone: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input required type="email" value={editingStudent.email} onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
                <input required value={editingStudent.address} onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth</label>
                <input required type="date" value={editingStudent.dateOfBirth || ""} onChange={(e) => setEditingStudent({ ...editingStudent, dateOfBirth: e.target.value })} className="w-full px-3 py-2 border rounded-md text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 border rounded-md text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Student Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 space-y-4 border border-red-200">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-red-600 text-lg">Confirm Student Deletion</h3>
              <button
                onClick={() => {
                  setDeletingStudent(null);
                  setDeleteConfirmText("");
                }}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <p>
                Are you sure you want to permanently delete student{" "}
                <strong className="text-slate-900">{deletingStudent.studentNumber}</strong> (
                <em>{deletingStudent.firstName} {deletingStudent.lastName}</em>)?
              </p>
              <div className="p-3 bg-red-50 text-red-800 rounded-md text-xs border border-red-200">
                <strong>Warning:</strong> Deleting this student will also permanently remove all their course enrollments, recorded attendance sessions, and fee payments.
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
                    setDeletingStudent(null);
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
                  {isDeleting ? "Deleting..." : "Permanently Delete Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
