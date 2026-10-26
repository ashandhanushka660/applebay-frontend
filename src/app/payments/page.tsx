"use client";
import { useState } from "react";
import { fetchApi } from "@/lib/api";

interface PaymentItem {
  id: number;
  receiptNumber: string;
  amount: number;
  paymentDate: string;
  method: string;
}

interface RawBalanceData {
  enrollmentId: number;
  studentNumber: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  totalFee?: number;
  courseFee?: number;
  totalPaid?: number;
  outstandingBalance?: number;
  balanceDue?: number;
}

export default function PaymentsPage() {
  const [activePaymentTab, setActivePaymentTab] = useState<"standard" | "backdate">("standard");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [allBalances, setAllBalances] = useState<RawBalanceData[]>([]);
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [paymentHistory, setPaymentHistory] = useState<PaymentItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Payment Form States
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [customPaymentDate, setCustomPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [posting, setPosting] = useState(false);

  const raw = allBalances[selectedIdx] || null;

  const totalFee = raw ? Number(raw.totalFee ?? raw.courseFee ?? 0) : 0;
  const totalPaid = raw ? Number(raw.totalPaid ?? 0) : 0;
  const outstandingDue = raw ? Number(raw.outstandingBalance ?? raw.balanceDue ?? (totalFee - totalPaid)) : 0;

  const loadHistoryForEnrollment = async (enrollmentId: number) => {
    setLoadingHistory(true);
    try {
      const history = await fetchApi<PaymentItem[]>(`/payments/enrollment/${enrollmentId}`);
      setPaymentHistory(Array.isArray(history) ? history : []);
    } catch {
      setPaymentHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setMsg(null);
    try {
      const data = await fetchApi<any>(`/payments/lookup?query=${encodeURIComponent(query.trim())}`);
      const list: RawBalanceData[] = Array.isArray(data) ? data : [data];
      setAllBalances(list);
      setSelectedIdx(0);
      setAmount("");
      if (list.length > 0) {
        await loadHistoryForEnrollment(list[0].enrollmentId);
      } else {
        setPaymentHistory([]);
      }
    } catch (err: any) {
      setAllBalances([]);
      setPaymentHistory([]);
      setMsg({ type: "error", text: err.message || "Failed to lookup student ledger" });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEnrollment = async (idx: number) => {
    setSelectedIdx(idx);
    setAmount("");
    const target = allBalances[idx];
    if (target) {
      await loadHistoryForEnrollment(target.enrollmentId);
    }
  };

  const refreshCurrentEnrollment = async (enrollmentId: number) => {
    try {
      const refreshed = await fetchApi<RawBalanceData>(`/payments/balance/${enrollmentId}`);
      setAllBalances((prev) =>
        prev.map((b) => (b.enrollmentId === enrollmentId ? refreshed : b))
      );
      await loadHistoryForEnrollment(enrollmentId);
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  const handlePostPayment = async (e: React.FormEvent, isBackdated = false) => {
    e.preventDefault();
    if (!raw) return;
    setPosting(true);
    setMsg(null);

    const paymentAmount = Number(amount);
    if (paymentAmount > outstandingDue) {
      setMsg({
        type: "error",
        text: `Payment amount (LKR ${paymentAmount.toLocaleString()}) cannot exceed outstanding balance (LKR ${outstandingDue.toLocaleString()})!`,
      });
      setPosting(false);
      return;
    }

    const targetDate = isBackdated && customPaymentDate ? customPaymentDate : new Date().toISOString().split("T")[0];

    try {
      const res = await fetchApi<any>("/payments", {
        method: "POST",
        body: JSON.stringify({
          enrollmentId: raw.enrollmentId,
          amount: paymentAmount,
          paymentDate: targetDate,
          method,
        }),
      });

      setMsg({
        type: "success",
        text: `Payment of LKR ${paymentAmount.toLocaleString()} logged effective on ${targetDate}! Receipt: ${res.receiptNumber}`,
      });
      setAmount("");
      await refreshCurrentEnrollment(raw.enrollmentId);
    } catch (err: any) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fee Payments &amp; Ledger (FR10-FR13)</h1>
        <p className="text-sm text-slate-500">
          Search student accounts by Student Number or NIC to access all enrolled course ledgers and audit payment histories.
        </p>
      </div>

      {msg && (
        <div className={`p-4 rounded-md text-sm border ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Lookup Bar */}
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter Student Number (e.g. AB2026-0366) or NIC (e.g. 199608402111)..."
            className="flex-1 px-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold px-6 py-2 rounded-md text-sm transition"
          >
            {loading ? "Looking up..." : "Lookup Ledger"}
          </button>
        </form>
      </div>

      {/* Multi-Course Course Selector Tabs */}
      {allBalances.length > 0 && (
        <div className="space-y-6">
          <div className="bg-slate-100 p-2 rounded-lg border border-slate-200 flex flex-wrap gap-2 items-center">
            <span className="text-xs font-bold text-slate-600 uppercase px-2">Enrolled Courses:</span>
            {allBalances.map((b, idx) => {
              const isSelected = selectedIdx === idx;
              return (
                <button
                  key={b.enrollmentId}
                  type="button"
                  onClick={() => handleSelectEnrollment(idx)}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition shadow-xs flex items-center space-x-2 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200"
                  }`}
                >
                  <span>{b.courseCode}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${isSelected ? "bg-blue-700 text-blue-100" : "bg-slate-100 text-slate-600"}`}>
                    #{b.enrollmentId}
                  </span>
                </button>
              );
            })}
          </div>

          {raw && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Box 1: Student & Course Details */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-base font-semibold text-slate-900 border-b pb-2">Student &amp; Course Details</h2>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs">Student: </span>
                    <strong className="text-slate-900">{raw.studentName}</strong>{" "}
                    <span className="font-mono text-blue-600">({raw.studentNumber})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Course: </span>
                    <strong className="text-slate-900">{raw.courseName}</strong> ({raw.courseCode})
                  </div>
                  <div>
                    <span className="text-slate-500 text-xs">Enrollment Reference ID: </span>
                    <span className="font-mono text-slate-700 font-semibold">#{raw.enrollmentId}</span>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Total Course Fee:</span>
                    <span className="font-mono font-semibold">LKR {totalFee.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600 font-semibold">Total Paid:</span>
                    <span className="font-mono font-bold text-emerald-600">LKR {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-base border-t pt-2">
                    <span className="text-red-600 font-bold">Outstanding Due:</span>
                    <span className="font-mono font-extrabold text-red-600">LKR {outstandingDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Box 2: Tabbed Payment Form (Standard vs Backdated Adjustment) */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs flex flex-col">
                {/* Form Subtabs */}
                <div className="flex border-b border-slate-200 mb-4">
                  <button
                    type="button"
                    onClick={() => setActivePaymentTab("standard")}
                    className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors ${
                      activePaymentTab === "standard"
                        ? "border-emerald-600 text-emerald-700"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Post Payment (Today)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePaymentTab("backdate")}
                    className={`pb-2 px-3 text-xs font-bold border-b-2 transition-colors ${
                      activePaymentTab === "backdate"
                        ? "border-blue-600 text-blue-700"
                        : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Update / Backdate Payment
                  </button>
                </div>

                {outstandingDue <= 0 ? (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-800 text-sm font-semibold text-center my-auto">
                    ✔ All course fees are fully settled for this enrollment!
                  </div>
                ) : (
                  <>
                    {/* Mode 1: Regular Realtime Payment */}
                    {activePaymentTab === "standard" && (
                      <form onSubmit={(e) => handlePostPayment(e, false)} className="space-y-4 flex-1">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Amount (LKR) &bull; <span className="text-slate-400 font-normal">Max: {outstandingDue}</span>
                          </label>
                          <input
                            type="number"
                            required
                            step="0.01"
                            min="1"
                            max={outstandingDue}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Max: ${outstandingDue}`}
                            className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
                          <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                          >
                            <option value="CASH">CASH</option>
                            <option value="CARD">CARD</option>
                            <option value="BANK_TRANSFER">BANK TRANSFER</option>
                            <option value="ONLINE">ONLINE</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={posting}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-md text-sm transition mt-auto"
                        >
                          {posting ? "Recording Payment..." : "Post Payment"}
                        </button>
                      </form>
                    )}

                    {/* Mode 2: Backdated Past Entry Payment */}
                    {activePaymentTab === "backdate" && (
                      <form onSubmit={(e) => handlePostPayment(e, true)} className="space-y-4 flex-1">
                        <div className="p-2.5 bg-blue-50/60 border border-blue-200 rounded text-[11px] text-blue-800">
                          <strong>Accounting Correction:</strong> Post an unrecorded receipt effective for a previous date.
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Effective Past Payment Date</label>
                          <input
                            type="date"
                            required
                            value={customPaymentDate}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setCustomPaymentDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">
                            Amount (LKR) &bull; <span className="text-slate-400 font-normal">Max: {outstandingDue}</span>
                          </label>
                          <input
                            type="number"
                            required
                            step="0.01"
                            min="1"
                            max={outstandingDue}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={`Max: ${outstandingDue}`}
                            className="w-full px-3 py-2 border rounded-md text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Payment Method</label>
                          <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md text-sm bg-white"
                          >
                            <option value="CASH">CASH</option>
                            <option value="CARD">CARD</option>
                            <option value="BANK_TRANSFER">BANK TRANSFER</option>
                            <option value="ONLINE">ONLINE</option>
                          </select>
                        </div>

                        <button
                          type="submit"
                          disabled={posting}
                          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-md text-sm transition mt-auto"
                        >
                          {posting ? "Logging Ledger Adjustment..." : "Record Backdated Payment"}
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>

              {/* Box 3: Payment History Ledger Audit */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs space-y-4">
                <h2 className="text-base font-semibold text-slate-900 border-b pb-2">Payment History (FR13)</h2>
                <div className="overflow-y-auto max-h-72">
                  {loadingHistory ? (
                    <div className="p-4 text-center text-xs text-slate-400">Loading payment receipts...</div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b">
                        <tr>
                          <th className="p-2">Receipt</th>
                          <th className="p-2">Date</th>
                          <th className="p-2">Method</th>
                          <th className="p-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paymentHistory.map((p) => (
                          <tr key={p.id}>
                            <td className="p-2 font-mono font-medium text-blue-600">{p.receiptNumber}</td>
                            <td className="p-2 text-slate-500 font-mono">{p.paymentDate}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold">{p.method}</span>
                            </td>
                            <td className="p-2 text-right font-mono font-bold text-slate-800">
                              {Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                        {paymentHistory.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-4 text-center text-slate-400">No payment receipts recorded yet.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
