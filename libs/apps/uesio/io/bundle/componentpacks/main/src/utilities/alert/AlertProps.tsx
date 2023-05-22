import { definition, notification } from "@uesio/ui"

export interface AlertProps extends definition.UtilityProps {
	text?: string
	details?: string
	severity?: notification.NotificationSeverity
	onClick?: () => void
	duration?: number
	key: string
}
