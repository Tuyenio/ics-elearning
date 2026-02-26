"use client"

import { Search, Download, Eye, DollarSign, TrendingUp, CreditCard, Clock, X, User, BookOpen } from "lucide-react"
import * as XLSX from "xlsx"
import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { apiClient } from "@/lib/api/client"
import { formatPrice, formatNumber } from "@/lib/format"

interface Payment {
  id: string
  user: string
  userEmail: string
  userPhone: string
  course: string
  courseId: string
  teacher: string
  teacherEmail: string
  amount: number
  method: string
  status: "success" | "pending" | "failed"
  date: string
  transactionId: string
}

interface PaymentStats {
  totalRevenue: number
  pendingTransactions: number
  completedTransactions: number
  failedTransactions: number
  totalTransactions: number
}

const normalizeStatus = (status?: string): Payment["status"] => {
  const normalized = status?.toLowerCase?.()
  if (normalized === "completed" || normalized === "success") return "success"
  if (normalized === "pending") return "pending"
  return "failed"
}

const normalizeMethod = (method?: string) => {
  if (!method) return "Khác"
  return method.toUpperCase()
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    pendingTransactions: 0,
    completedTransactions: 0,
    failedTransactions: 0,
    totalTransactions: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "success" | "pending" | "failed">("all")
  const [isExportOpen, setIsExportOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const exportButtonRef = useRef<HTMLButtonElement | null>(null)
  const [exportMenuPos, setExportMenuPos] = useState<{ top: number; left: number } | null>(null)

  // Export filters
  const [exportStatus, setExportStatus] = useState<string>("all")
  const [exportUser, setExportUser] = useState<string>("all")
  const [exportCourse, setExportCourse] = useState<string>("all")
  const [exportTeacher, setExportTeacher] = useState<string>("all")
  const [exportDateFrom, setExportDateFrom] = useState<string>("")
  const [exportDateTo, setExportDateTo] = useState<string>("")

  const loadPayments = async () => {
    setLoading(true)
    try {
      const [listRes, statsRes] = await Promise.all([
        apiClient.getAdminPayments({ limit: 200 }),
        apiClient.getAdminPaymentStats(),
      ])

      const rawList = (listRes as any)?.data ?? listRes ?? []

      const mapped: Payment[] = Array.isArray(rawList)
        ? rawList.map((p: any) => {
            const student = p.student || {}
            const course = p.course || {}
            const teacher = course.teacher || {}
            const paidAt = p.paidAt || p.createdAt || new Date()

            return {
              id: p.id || p.transactionId,
              transactionId: p.transactionId || p.id || "",
              user: student.name || "Không rõ",
              userEmail: student.email || "",
              userPhone: student.phoneNumber || student.phone || "",
              course: course.title || "Không rõ",
              courseId: course.id || "",
              teacher: teacher.name || "",
              teacherEmail: teacher.email || "",
              amount: Number(p.finalAmount ?? p.amount ?? 0),
              method: normalizeMethod(p.paymentMethod),
              status: normalizeStatus(p.status),
              date: new Date(paidAt).toISOString(),
            }
          })
        : []

      setPayments(mapped)

      const derivedRevenue = mapped
        .filter((p) => p.status === "success")
        .reduce((sum, p) => sum + Number(p.amount || 0), 0)

      setStats({
        totalRevenue: Number(statsRes?.totalRevenue ?? derivedRevenue),
        pendingTransactions: Number(statsRes?.pendingTransactions ?? mapped.filter((p) => p.status === "pending").length),
        completedTransactions: Number(statsRes?.completedTransactions ?? mapped.filter((p) => p.status === "success").length),
        failedTransactions: Number(statsRes?.failedTransactions ?? mapped.filter((p) => p.status === "failed").length),
        totalTransactions: Number(statsRes?.totalTransactions ?? mapped.length),
      })
    } catch (error) {
      console.error("Error loading payments", error)
      toast.error("Không thể tải dữ liệu thanh toán")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPayments()
  }, [])

  useEffect(() => {
    if (!isExportOpen) return
    const updatePosition = () => {
      const rect = exportButtonRef.current?.getBoundingClientRect()
      if (!rect) return
      const menuWidth = 420
      const left = Math.max(12, rect.right - menuWidth)
      setExportMenuPos({ top: rect.bottom + 8, left })
    }

    updatePosition()
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)

    return () => {
      window.removeEventListener("resize", updatePosition)
      window.removeEventListener("scroll", updatePosition, true)
    }
  }, [isExportOpen])

  const uniqueCourses = useMemo(() => Array.from(new Set(payments.map((p) => p.course).filter(Boolean))), [payments])
  const uniqueUsers = useMemo(() => Array.from(new Set(payments.map((p) => p.user).filter(Boolean))), [payments])
  const uniqueTeachers = useMemo(() => Array.from(new Set(payments.map((p) => p.teacher).filter(Boolean))), [payments])

  const filteredPayments = useMemo(() => {
    const keyword = searchQuery.toLowerCase()
    return payments.filter(
      (payment) =>
        ((payment.id || "").toLowerCase().includes(keyword) ||
          (payment.user || "").toLowerCase().includes(keyword) ||
          (payment.course || "").toLowerCase().includes(keyword) ||
          (payment.teacher || "").toLowerCase().includes(keyword)) &&
        (statusFilter === "all" || payment.status === statusFilter),
    )
  }, [payments, searchQuery, statusFilter])

  const derivedRevenue = payments.filter((p) => p.status === "success").reduce((sum, p) => sum + p.amount, 0)
  const totalRevenue = stats.totalRevenue || derivedRevenue
  const pendingAmount = payments.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount, 0)
  const successCount = stats.completedTransactions || payments.filter((p) => p.status === "success").length
  const totalTransactions = stats.totalTransactions || payments.length

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const handleExport = () => {
    // Filter data based on export options
    let exportData = payments.filter(p => {
      if (exportStatus !== "all" && p.status !== exportStatus) return false
      if (exportUser !== "all" && p.user !== exportUser) return false
      if (exportCourse !== "all" && p.course !== exportCourse) return false
      if (exportTeacher !== "all" && p.teacher !== exportTeacher) return false
      if (exportDateFrom && new Date(p.date) < new Date(exportDateFrom)) return false
      if (exportDateTo && new Date(p.date) > new Date(exportDateTo)) return false
      return true
    })

    const headers = ["ID", "Người dùng", "Email", "Khóa học", "Giảng viên", "Số tiền", "Phương thức", "Trạng thái", "Ngày"]
    const rows = exportData.map((p) => [
      p.id,
      p.user,
      p.userEmail,
      p.course,
      p.teacher,
      p.amount.toString(),
      p.method,
      p.status === "success" ? "Thành công" : p.status === "pending" ? "Chờ xử lý" : "Thất bại",
      formatDate(p.date),
    ])

    const exportDate = new Date().toLocaleDateString("vi-VN")
    const bannerLines = [["Báo cáo: Thanh toán"], [`Ngày xuất: ${exportDate}`]]
    const aoa = [...bannerLines, headers, ...rows]

    const worksheet = XLSX.utils.aoa_to_sheet(aoa)
    const colCount = Math.max(...aoa.map((row) => row.length))
    worksheet["!cols"] = Array.from({ length: colCount }, (_, colIndex) => {
      const maxLen = Math.max(
        ...aoa.map((row) => {
          const value = row[colIndex]
          return value === undefined || value === null ? 0 : String(value).length
        })
      )
      return { wch: Math.min(60, Math.max(10, maxLen + 2)) }
    })

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Thanh toan")
    XLSX.writeFile(workbook, `payments_report_${new Date().toISOString().split("T")[0]}.xlsx`)

    setIsExportOpen(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
        <div className="h-[520px] rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full">
      <div className="w-full space-y-8">
        {/* Hero Section with Background */}
        <div
          className="relative overflow-hidden rounded-3xl p-8 animate-fadeIn"
          style={{ backgroundImage: "url('/image/bg_payment1.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        >
          {/* Overlay for better readability */}
          <div className="absolute inset-0 bg-black/15 dark:bg-black/45 rounded-3xl"></div>

          <div className="relative z-10 space-y-8">
            <div
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-slideDown"
              style={{ animationDelay: "0.15s" }}
            >
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Quản lý thanh toán</h1>
                <p className="text-black/70 dark:text-white/80 drop-shadow">Theo dõi và quản lý các giao dịch thanh toán</p>
              </div>
              <button
                ref={exportButtonRef}
                onClick={() => setIsExportOpen(true)}
                className="flex items-center gap-2 px-6 py-3 bg-white text-primary rounded-lg font-medium transition-all duration-300 hover:shadow-lg w-fit backdrop-blur-sm"
              >
                <Download size={20} /> Xuất báo cáo
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {/* Stats Cards - Fixed height, centered content */}
              <div className="animate-slideUp" style={{ animationDelay: "0.25s" }}>
                <div className="bg-white/80 dark:bg-slate-900/80 border border-white/20 rounded-2xl p-4 sm:p-6 shadow-lg flex items-center justify-between h-36">
                  {/* Stats content here, remove invalid table row and use a proper table below */}
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <div className="text-lg font-bold text-primary dark:text-accent">Tổng số giao dịch: {totalTransactions}</div>
                    <div className="text-md text-muted-foreground dark:text-slate-400">Doanh thu: ₫{formatPrice(totalRevenue)}</div>
                  </div>
                </div>
            </div>

            {/* Payment Table */}
            <table className="min-w-full divide-y divide-gray-200 mt-8">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khóa học</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giảng viên</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số tiền</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phương thức</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Xem</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="py-4 px-6">{payment.id}</td>
                    <td className="py-4 px-6">{payment.user}</td>
                    <td className="py-4 px-6">{payment.course}</td>
                    <td className="py-4 px-6">{payment.teacher}</td>
                    <td className="py-4 px-6">₫{formatPrice(payment.amount)}</td>
                    <td className="py-4 px-6">{payment.method}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === "success"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : payment.status === "pending"
                              ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        }`}
                      >
                        {payment.status === "success"
                          ? "Thành công"
                          : payment.status === "pending"
                            ? "Chờ xử lý"
                            : "Thất bại"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground dark:text-slate-400">{formatDate(payment.date)}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                      >
                        <Eye size={18} className="text-primary dark:text-accent" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="py-12 text-center">
              <CreditCard size={48} className="mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground dark:text-slate-400">Không tìm thấy giao dịch nào</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
            <div className="bg-card dark:bg-slate-900 border border-border dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-[10000]">
              <div className="sticky top-0 bg-card dark:bg-slate-900 border-b border-border dark:border-slate-800 p-6 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground dark:text-white">Chi tiết giao dịch</h2>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                >
                  <X size={20} className="text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Transaction ID */}
                <div className="text-center pb-4 border-b border-border dark:border-slate-800">
                  <p className="text-muted-foreground dark:text-slate-400 text-sm">Mã giao dịch</p>
                  <p className="text-2xl font-bold text-foreground dark:text-white">{selectedPayment.id}</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                      selectedPayment.status === "success"
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : selectedPayment.status === "pending"
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400"
                          : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {selectedPayment.status === "success"
                      ? "Thành công"
                      : selectedPayment.status === "pending"
                        ? "Chờ xử lý"
                        : "Thất bại"}
                  </span>
                </div>

                {/* Payment details */}
                <div className="space-y-4">
                  <div>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Người dùng</p>
                    <p className="font-medium text-foreground dark:text-white">{selectedPayment.user}</p>
                    <p className="text-xs text-muted-foreground dark:text-slate-400">{selectedPayment.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Khóa học</p>
                    <p className="font-medium text-foreground dark:text-white">{selectedPayment.course}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Giảng viên</p>
                    <p className="font-medium text-foreground dark:text-white">{selectedPayment.teacher}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Số tiền</p>
                    <p className="font-bold text-primary dark:text-accent">₫{formatPrice(selectedPayment.amount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Phương thức</p>
                    <span className="px-2 py-1 bg-secondary dark:bg-slate-800 rounded text-foreground dark:text-white text-xs font-medium">
                      {selectedPayment.method}
                    </span>
                  </div>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Ngày</p>
                    <p className="text-foreground dark:text-white">{formatDate(selectedPayment.date)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Mã giao dịch</p>
                    <p className="text-foreground dark:text-white">{selectedPayment.transactionId}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Số điện thoại</p>
                    <p className="text-foreground dark:text-white">{selectedPayment.userPhone}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground dark:text-slate-400 text-sm">Email giảng viên</p>
                    <p className="text-foreground dark:text-white">{selectedPayment.teacherEmail}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      }
    </div>
  )
}

