type NotificationSeverity = "success" | "error" | "warning" | "info"

interface NotificationState {
	id: string
	severity: NotificationSeverity
	text: string
	details?: string
}

export { NotificationSeverity, NotificationState }
