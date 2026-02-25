import { MoreVertical, Eye, Lock, Unlock, Trash2 } from "lucide-react"
import type { UserData } from "@/app/types/user"
import { useState } from "react"

interface UserTableProps {
  users: UserData[]
  openMenu: number | null
  setOpenMenu: (id: number | null) => void
  onView: (user: UserData) => void
  onEdit: (user: UserData) => void
  onAction: (action: string, userId: number) => void
}

export function UserTable({ users, openMenu, setOpenMenu, onView, onEdit, onAction }: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-slate-900 rounded-xl">
        <thead>
          <tr>
            <th className="px-4 py-3 text-left">Họ tên</th>
            <th className="px-4 py-3 text-left">Email</th>
            <th className="px-4 py-3 text-left">Số điện thoại</th>
            <th className="px-4 py-3 text-left">Vai trò</th>
            <th className="px-4 py-3 text-left">Trạng thái</th>
            <th className="px-4 py-3 text-left">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-b last:border-b-0">
              <td className="px-4 py-3 font-semibold text-foreground dark:text-white">{user.name}</td>
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">{user.phone || "Chưa cập nhật"}</td>
              <td className="px-4 py-3">
                {user.role === "admin"
                  ? "Quản trị viên"
                  : user.role === "teacher"
                  ? "Giảng viên"
                  : "Học viên"}
              </td>
              <td className="px-4 py-3">
                {user.status === "active"
                  ? <span className="text-green-600 font-medium">Hoạt động</span>
                  : user.status === "pending"
                  ? <span className="text-yellow-600 font-medium">Chờ xác thực</span>
                  : <span className="text-gray-500 font-medium">Vô hiệu hóa</span>}
              </td>
              <td className="px-4 py-3 relative">
                <button
                  onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)}
                  className="p-2 hover:bg-secondary dark:hover:bg-slate-800 rounded-lg transition-smooth"
                  aria-label="Mở menu hành động"
                >
                  <MoreVertical size={18} className="text-muted-foreground dark:text-slate-400" />
                </button>
                {openMenu === user.id && (
                  <div className="user-action-menu">
                    <button
                      onClick={() => { onView(user); setOpenMenu(null) }}
                      className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                    >
                      <Eye size={16} /> Xem chi tiết
                    </button>
                    <button
                      onClick={() => { onEdit(user); setOpenMenu(null) }}
                      className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                    >
                      ✏️ Sửa thông tin
                    </button>
                    <button
                      onClick={() => onAction(user.status === "active" ? "lock" : "unlock", user.id)}
                      className="w-full text-left px-4 py-2 hover:bg-secondary dark:hover:bg-slate-800 flex items-center gap-2 text-foreground dark:text-white"
                    >
                      {user.status === "active" ? <><Lock size={16} /> Khóa tài khoản</> : <><Unlock size={16} /> Mở khóa tài khoản</>}
                    </button>
                    <button
                      onClick={() => onAction("delete", user.id)}
                      className="w-full text-left px-4 py-2 hover:bg-destructive/10 dark:hover:bg-destructive/20 flex items-center gap-2 text-destructive"
                    >
                      <Trash2 size={16} /> Xóa tài khoản
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
