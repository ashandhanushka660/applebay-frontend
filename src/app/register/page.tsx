"use client";
import { useEffect, useState, useRef } from "react";
import { fetchApi } from "@/lib/api";

interface Course {
  id: number;
  code: string;
  name: string;
  totalFee: number;
  active: boolean;
}

interface Student {
  id: number;
  studentNumber: string;
  firstName: string;
  lastName: string;
  nic: string;
  email: string;
  phone: string;
}

export default function RegistrationPage() {
  const [activeTab, setActiveTab] = useState<"new" | "existing">("new");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [receipt, setReceipt] = useState<{ studentNumber: string; receiptNumber?: string; batch: string; courseCode: string } | null>(null);

  // --- Tab 1: New Student Registration Form State ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nic, setNic] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDob] = useState("");
  const [courseId, setCourseId] = useState("");
  const [batch, setBatch] = useState("2026-B1");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");

  // --- Tab 2: Existing Student Search & Enrollment State ---
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [existingCourseId, setExistingCourseId] = useState("");
  const [existingBatch, setExistingBatch] = useState("2026-B1");
  
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Load active courses only
  const loadActiveCourses = () => {
    fetchApi<Course[]>("/courses")
      .then((res) => setCourses(res.filter((c) => c.active)))
      .catch((e) => console.error("Error loading courses:", e));
  };

  useEffect(() => {
    loadActiveCourses();
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for all students across the entire database
  useEffect(() => {
    if (activeTab !== "existing") return;

    const timer = setTimeout(() => {
      setIsSearching(true);
      const queryParam = studentSearchQuery.trim();
      // Search with pagination size 50 to return immediate relevant matches
      fetchApi<any>(`/students?q=${encodeURIComponent(queryParam)}&page=0&size=50`)
        .then((res) => {
          setSearchResults(res.content || []);
          setShowDropdown(true);
        })
        .catch((e) => console.error("Student search error:", e))
        .finally(() => setIsSearching(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [studentSearchQuery, activeTab]);

  // Handler: New Student Atomic Registration
  const handleNewRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setReceipt(null);
    setLoading(true);

    try {
      const selectedCourse = courses.find((c) => c.id === Number(courseId));
      const res = await fetchApi<any>("/registrations", {
        method: "POST",
        body: JSON.stringify({
          student: {
            firstName,
            lastName,
            nic,
            email,
            phone,
            address,
            dateOfBirth,
          },
          courseId: Number(courseId),
          batch: batch.trim().toUpperCase(),
          firstPayment: {
            amount: Number(amount),
            paymentDate: new Date().toISOString().split("T")[0],
            method,
          },
        }),
      });

      setReceipt({
        studentNumber: res.student.studentNumber,
        receiptNumber: res.payment.receiptNumber,
        batch: res.enrollment.batch,
        courseCode: selectedCourse ? selectedCourse.code : "",
      });
      setMsg({ type: "success", text: "Student registered, enrolled in batch, and payment processed atomically!" });
      
      // Reset form
      setFirstName(""); setLastName(""); setNic(""); setEmail(""); setPhone(""); setAddress(""); setDob(""); setAmount("");
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Handler: Existing Student Enrollment into Course & Batch (FR05)
  const handleExistingEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      setMsg({ type: "error", text: "Please search and select a student first." });
      return;
    }
    setMsg(null);
    setReceipt(null);
    setLoading(true);

    try {
      const selectedCourse = courses.find((c) => c.id === Number(existingCourseId));
      const normalizedBatch = existingBatch.trim().toUpperCase();

      const res = await fetchApi<any>("/enrollments", {
        method: "POST",
        body: JSON.stringify({
          studentId: selectedStudent.id,
          courseId: Number(existingCourseId),
          batch: normalizedBatch,
        }),
      });

      setReceipt({
        studentNumber: res.studentNumber || selectedStudent.studentNumber,
        batch: res.batch,
        courseCode: selectedCourse ? selectedCourse.code : "",
      });
      setMsg({
        type: "success",
        text: `Student ${selectedStudent.studentNumber} successfully enrolled into ${selectedCourse?.code || "Course"} (${res.batch})! (Enrollment ID: #${res.id})`,
      });
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Enrollment & Registration (FR02-FR05)</h1>
        <p className="text-sm text-slate-500">
          Register new candidates atomically or search across all database records to enroll existing students.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => { setActiveTab("new"); setMsg(null); setReceipt(null); }}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "new"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          New Student Registration (Atomic)
        </button>
        <button
          type="button"
          onClick={() => { 
            setActiveTab("existing"); 
            setMsg(null); 
            setReceipt(null);
            loadActiveCourses();
          }}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "existing"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Enroll Existing Student to Course & Batch (FR05)
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-md text-sm border ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {receipt && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
          <h3 className="font-semibold text-blue-900 text-sm">Enrollment Confirmation Details:</h3>
          <p className="text-sm text-blue-800 mt-1">
            Student: <strong className="font-mono">{receipt.studentNumber}</strong> | 
            Course: <strong>{receipt.courseCode}</strong> | 
            Batch: <strong className="font-mono">{receipt.batch}</strong>
            {receipt.receiptNumber && (
              <> | Receipt: <strong className="font-mono">{receipt.receiptNumber}</strong></>
            )}
          </p>
        </div>
      )}

      {/* Tab 1: New Student Registration Form */}
      {activeTab === "new" && (
        <form onSubmit={handleNewRegistration} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-base font-semibold text-slate-800 border-b pb-2">1. Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">First Name</label>
              <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Last Name</label>
              <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">NIC (National Identity Card)</label>
              <input required value={nic} onChange={(e) => setNic(e.target.value)} placeholder="e.g. 200012345678 or 961234567V" className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
              <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+94771234567" className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth</label>
              <input required type="date" value={dateOfBirth} onChange={(e) => setDob(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Address</label>
              <input required value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
          </div>

          <h2 className="text-base font-semibold text-slate-800 border-b pb-2 pt-2">2. Programme & Batch Assignment (FR05)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Select Course (Active)</label>
              <select required value={courseId} onChange={(e) => setCourseId(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm bg-white">
                <option value="">-- Choose active course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Batch Code</label>
              <input required value={batch} onChange={(e) => setBatch(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm font-mono uppercase" />
            </div>
          </div>

          <h2 className="text-base font-semibold text-slate-800 border-b pb-2 pt-2">3. Initial Payment Instalment</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Amount (LKR)</label>
              <input required type="number" step="0.01" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
              <select value={method} onChange={(e) => setMethod(e.target.value)} className="w-full px-3 py-2 border rounded-md text-sm bg-white">
                <option value="CASH">CASH</option>
                <option value="CARD">CARD</option>
                <option value="BANK_TRANSFER">BANK TRANSFER</option>
                <option value="ONLINE">ONLINE</option>
              </select>
            </div>
          </div>

          <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-md text-sm transition">
            {loading ? "Processing..." : "Register & Enroll in Batch"}
          </button>
        </form>
      )}

      {/* Tab 2: Existing Student Search & Enrollment Form */}
      {activeTab === "existing" && (
        <form onSubmit={handleExistingEnrollment} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
          <div className="border-b pb-2">
            <h2 className="text-base font-semibold text-slate-800">Enroll Existing Student into Course & Batch</h2>
            <p className="text-xs text-slate-500 mt-0.5">Search across all registered students in the database by Name, Student Number, or NIC.</p>
          </div>

          {/* Student Search Combobox */}
          <div className="space-y-2" ref={searchContainerRef}>
            <label className="block text-xs font-semibold text-slate-700">
              Search Student (Name, Number, or NIC)
            </label>
            <div className="relative">
              <input
                type="text"
                value={studentSearchQuery}
                onChange={(e) => {
                  setStudentSearchQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Type student number (e.g. AB2026-0001), NIC, or name..."
                className="w-full px-4 py-2.5 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {isSearching && (
                <div className="absolute right-3 top-2.5 text-xs text-slate-400 animate-pulse">
                  Searching...
                </div>
              )}

              {/* Dropdown Results List */}
              {showDropdown && (
                <div className="absolute z-20 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-md shadow-lg divide-y divide-slate-100">
                  {searchResults.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        setSelectedStudent(s);
                        setShowDropdown(false);
                        setStudentSearchQuery(`${s.studentNumber} - ${s.firstName} ${s.lastName}`);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex justify-between items-center text-sm"
                    >
                      <div>
                        <span className="font-mono font-bold text-blue-600 mr-2">{s.studentNumber}</span>
                        <span className="text-slate-800 font-medium">{s.firstName} {s.lastName}</span>
                        <span className="text-xs text-slate-500 ml-2">(NIC: {s.nic})</span>
                      </div>
                      <span className="text-xs text-slate-400">{s.phone}</span>
                    </button>
                  ))}
                  {searchResults.length === 0 && (
                    <div className="p-3 text-center text-xs text-slate-500">
                      No matching students found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Student Confirmation Pill */}
            {selectedStudent && (
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 flex justify-between items-center mt-2">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Selected Student</p>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {selectedStudent.firstName} {selectedStudent.lastName}{" "}
                    <span className="font-mono text-blue-600 font-normal">({selectedStudent.studentNumber})</span>
                  </p>
                  <p className="text-xs text-slate-500">NIC: {selectedStudent.nic} &bull; Email: {selectedStudent.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(null);
                    setStudentSearchQuery("");
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>

          {/* Target Course & Batch Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Target Active Course</label>
              <select
                required
                value={existingCourseId}
                onChange={(e) => setExistingCourseId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm bg-white"
              >
                <option value="">-- Choose active course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} (Fee: LKR {Number(c.totalFee).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Batch Code</label>
              <input
                required
                value={existingBatch}
                onChange={(e) => setExistingBatch(e.target.value)}
                placeholder="e.g. 2026-B1 or 2026-B2"
                className="w-full px-3 py-2 border rounded-md text-sm font-mono uppercase"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            <strong>Rule FR05:</strong> A student cannot be enrolled twice in the exact same course and batch. Enrolling the same student into a different course or batch is permitted.
          </p>

          <button
            disabled={loading || !selectedStudent}
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-medium py-3 rounded-md text-sm transition"
          >
            {loading ? "Verifying & Enrolling..." : "Enroll Student in Course & Batch"}
          </button>
        </form>
      )}
    </div>
  );
}
