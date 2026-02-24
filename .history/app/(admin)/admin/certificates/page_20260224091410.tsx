"use client"

import { useEffect, useState } from "react"
import { Search, MoreVertical, CheckCircle, Clock, XCircle, Award, Eye, X, AlertCircle, User, BookOpen, Calendar, Download } from "lucide-react"
import { Modal } from "@/components/ui/admin-modals"

interface ExamSummary {
  id: string
  title: string
  type: "practice" | "official"
  status: "draft" | "pending" | "approved" | "rejected"
  courseId: string
  course?: {
    id: string
    title: string
  } | null
}

interface IssuedCertificate {
  id: string
  certificateNumber?: string
  status: "pending" | "approved" | "rejected"
  issueDate?: string
  createdAt?: string
  rejectionReason?: string | null
  imageUrl?: string | null
  metadata?: {
    courseName?: string
  } | null
  course?: {
    id: string
    title: string
  } | null
  student?: {
    id: string
    name: string
    email: string
  } | null
}

interface CertificateTemplate {
  id: string
  title: string
  description: string
  courseId: string
  course?: {
    id: string
    title: string
  } | null
  teacher?: {
    id: string
    name: string
    email: string
  } | null
  status: "draft" | "pending" | "approved" | "rejected"
  createdAt: string
  validityPeriod: string
  rejectionReason?: string
  issuedCount: number
  templateImageUrl?: string
  logoUrl?: string
  backgroundColor?: string
  borderColor?: string
  borderStyle?: string
  textColor?: string
}

export default function AdminCertificatesPage() {
    // Handle approve/reject actions
    function handleAction(action: 'approve' | 'reject', id: string, cert: CertificateTemplate) {
      if (action === 'approve') {
        setApproveModalOpen(true);
        setApproveTarget(cert);
        setSelectedExamId("");
      } else if (action === 'reject') {
        setSelectedCertificate(cert);
        setViewMode('reject');
        setRejectionReason("");
      }
    }
  // State hooks
  const [certificates, setCertificates] = useState<CertificateTemplate[]>([]);
  const [issuedCertificates, setIssuedCertificates] = useState<IssuedCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewTab, setViewTab] = useState<'template' | 'issued'>('template');
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'view' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [approveTarget, setApproveTarget] = useState<CertificateTemplate | null>(null);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [availableExams, setAvailableExams] = useState<ExamSummary[]>([]);

  // Utility functions
  function getAuthToken() {
    // TODO: Replace with actual auth token retrieval
    return "";
  }
  function formatDate(date?: string) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("vi-VN");
  }
  function getStatusBadge(status: string) {
    switch (status) {
      case "pending": return <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700">Chờ duyệt</span>;
      case "approved": return <span className="px-2 py-1 rounded bg-green-100 text-green-700">Đã duyệt</span>;
      case "rejected": return <span className="px-2 py-1 rounded bg-red-100 text-red-700">Đã từ chối</span>;
      default: return <span className="px-2 py-1 rounded bg-gray-100 text-gray-700">Không xác định</span>;
    }
  }

  // Fetch certificates
  const fetchCertificates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/certificate-templates', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setCertificates(data);
        } else if (data && Array.isArray(data.data)) {
          setCertificates(data.data);
        } else {
          setCertificates([]);
        }
      } else {
        setCertificates([]);
      }
    } catch (error) {
      setCertificates([]);
    }
    setIsLoading(false);
  };

  // Fetch issued certificates
  const fetchIssuedCertificates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/certificates', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setIssuedCertificates(data);
        } else if (data && Array.isArray(data.data)) {
          setIssuedCertificates(data.data);
        } else {
          setIssuedCertificates([]);
        }
      } else {
        setIssuedCertificates([]);
      }
    } catch (error) {
      setIssuedCertificates([]);
    }
    setIsLoading(false);
  };

  // Fetch exams
  const fetchExams = async () => {
    try {
      const response = await fetch('/api/admin/exams', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setAvailableExams(data);
        } else if (data && Array.isArray(data.data)) {
          setAvailableExams(data.data);
        } else {
          setAvailableExams([]);
        }
      } else {
        setAvailableExams([]);
      }
    } catch (error) {
      setAvailableExams([]);
    }
  };

  // useEffect to load data
  useEffect(() => {
    fetchCertificates();
    fetchIssuedCertificates();
    fetchExams();
  }, []);

  // Handler functions
  const handleReject = async () => {
    if (!selectedCertificate || !rejectionReason.trim()) return;
    try {
      const response = await fetch(`/api/admin/certificate-templates/${selectedCertificate.id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });
      if (!response.ok) {
        throw new Error("Reject failed");
      }
      await fetchCertificates();
      setViewMode(null);
      setSelectedCertificate(null);
      setRejectionReason("");
    } catch (error) {
      alert("Không thể từ chối chứng chỉ. Vui lòng thử lại.");
    }
  };

  const handleApprove = async () => {
    if (!approveTarget || !selectedExamId) return;
    setIsApproving(true);
    try {
      const response = await fetch(`/api/admin/certificate-templates/${approveTarget.id}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({ examId: selectedExamId }),
      });
      if (!response.ok) {
        throw new Error("Approve failed");
      }
      await fetchCertificates();
      setApproveModalOpen(false);
      setApproveTarget(null);
      setSelectedExamId("");
    } catch (error) {
      alert("Không thể duyệt chứng chỉ. Vui lòng thử lại.");
    }
    setIsApproving(false);
  };

  // Filtered lists
  const filteredCertificates = certificates;
  const filteredIssuedCertificates = issuedCertificates;

  // ...existing UI blocks...
  return (
    <div className="min-h-screen w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCertificates.map((cert) => (
          <div key={cert.id} className="relative bg-white dark:bg-slate-900 rounded-xl shadow p-4">
            {/* Card content and overlay logic */}
            {cert.logoUrl ? (
              <img src={cert.logoUrl} alt="Logo" className="w-8 h-8 object-contain rounded-md bg-white/90 p-1" />
            ) : (
              <div className="w-8 h-8 rounded-md bg-white/80" />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
              <p className="text-[10px] font-semibold tracking-[0.25em] uppercase" style={{ color: cert.borderColor || "#d4af37" }}>Chứng chỉ hoàn thành</p>
              <div className="w-10 h-px my-2" style={{ backgroundColor: cert.borderColor || "#d4af37" }} />
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: cert.textColor || "#ffffff", color: cert.borderColor || "#d4af37", border: `2px solid ${cert.borderColor || "#d4af37"}` }}>
                <Award size={20} />
              </div>
              <h4 className="text-sm font-semibold leading-snug">{cert.title}</h4>
              <div className="w-10 h-px my-2" style={{ backgroundColor: cert.borderColor || "#d4af37" }} />
              <p className="text-[11px] opacity-70">Chứng nhận rằng</p>
              <p className="text-sm font-semibold italic mt-1">[Tên học viên]</p>
              <div className="w-24 h-px mt-2" style={{ backgroundColor: cert.borderColor || "#d4af37" }} />
              <p className="text-[11px] mt-3 opacity-80 line-clamp-2">{cert.description}</p>
              <p className="text-[11px] font-semibold mt-2" style={{ color: cert.borderColor || "#d4af37" }}>{cert.course?.title || "[Tên khóa học]"}</p>
            </div>
            <div className="absolute bottom-3 left-3 text-[10px]">
              <span className="px-2 py-1 rounded-md" style={{ color: cert.borderColor || "#d4af37", border: `1px solid ${cert.borderColor || "#d4af37"}`, backgroundColor: `${cert.borderColor || "#d4af37"}20` }}>{cert.validityPeriod}</span>
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="text-lg font-semibold text-foreground dark:text-white line-clamp-2">{cert.title}</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-2">{cert.description}</p>
              <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-1">Khóa học: <span className="text-foreground dark:text-white">{cert.course?.title || "—"}</span></p>
              <p className="text-sm text-muted-foreground dark:text-slate-400 line-clamp-1">Giảng viên: <span className="text-foreground dark:text-white">{cert.teacher?.name || "—"}</span></p>
              <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground dark:text-slate-500">
                <span>Tạo: {formatDate(cert.createdAt)}</span>
                <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full font-medium">Đã cấp: {cert.issuedCount}</span>
              </div>
              {cert.status === "pending" && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => handleAction("approve", cert.id, cert)} className="py-2 rounded-lg font-medium flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"><CheckCircle size={16} /> Duyệt</button>
                  <button onClick={() => handleAction("reject", cert.id, cert)} className="py-2 rounded-lg font-medium flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"><XCircle size={16} /> Từ chối</button>
                </div>
              )}
              {/* Overlay panel logic for detail/reject */}
              {selectedCertificate?.id === cert.id && viewMode === "view" && (
                <div className="mt-4 border border-border dark:border-slate-800 rounded-xl p-4 bg-secondary/40 dark:bg-slate-800/40 space-y-4">
                  {/* ...details panel content... */}
                </div>
              )}
              {selectedCertificate?.id === cert.id && viewMode === "reject" && (
                <div className="mt-4 border border-red-200 dark:border-red-800 rounded-xl p-4 bg-red-50/70 dark:bg-red-900/10 space-y-3">
                  {/* ...reject panel content... */}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>

      )}
