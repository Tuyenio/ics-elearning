import { Eye } from "lucide-react"
import type { UserData } from "@/app/types/user"

interface UserCardProps {
  user: UserData
  onView: (user: UserData) => void
  onEdit: (user: UserData) => void
}

export function UserCard({ user, onView, onEdit }: UserCardProps) {
  return (
    <div className="user-card bg-white/80 dark:bg-slate-900/70 border border-border dark:border-slate-800 rounded-2xl p-4 shadow-sm mb-2">
      <div className="flex flex-col items-center text-center gap-2 mb-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
          {user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-foreground dark:text-white">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Số điện thoại</span>
          <span className="font-medium text-foreground dark:text-white">{user.phone || "Chưa cập nhật"}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Vai trò</span>
          <span className="font-medium text-foreground dark:text-white">
            {user.role === "admin" ? "Quản trị viên" : user.role === "teacher" ? "Giảng viên" : "Học viên"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Trạng thái</span>
          <span className={user.status === "active" ? "font-semibold text-primary dark:text-accent" : "font-medium text-foreground dark:text-white"}>
            {user.status === "active" ? "Hoạt động" : user.status === "pending" ? "Chờ xác thực" : "Vô hiệu hóa"}
          </span>
        </div>
      </div>
      <div className="user-card-actions mt-4">
        <button
          onClick={() => onView(user)}
          className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium"
        >
          Xem
        </button>
        <button
          onClick={() => onEdit(user)}
          className="px-4 py-2 rounded-lg bg-secondary text-sm font-medium"
        >
          Sửa
        </button>
      </div>
    </div>
  )
}
