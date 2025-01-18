type NotificationSeverity = "success" | "error" | "warning" | "info"

interface NotificationState {
  id: string
  severity: NotificationSeverity
  text: string
  details?: string
  path?: string
  duration?: string
}

export type { NotificationSeverity, NotificationState }
