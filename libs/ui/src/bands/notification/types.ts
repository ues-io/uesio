type NotificationSeverity = "success" | "error" | "warning" | "info" | "loading"

interface NotificationState {
	id: string
	severity: NotificationSeverity
	text: string
	details?: string
	path?: string
}

export type { NotificationSeverity, NotificationState }
