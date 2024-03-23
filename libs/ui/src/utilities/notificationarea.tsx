import { useNotifications } from "../bands/notification/selectors"
import { UtilityComponent } from "../definition/definition"
import { dispatch } from "../store/store"
import { remove as removeNotification } from "../bands/notification"
import { Toaster, toast } from "sonner"
import { useEffect, useRef } from "react"
import { getUtility } from "../component/component"
import { cx, useUtilityStyleTokens } from "../styles/styles"

const getToastFunc = (severity: string) => {
	if (severity === "error") {
		return toast.error
	}
	if (severity === "success") {
		return toast.success
	}
	if (severity === "warning") {
		return toast.warning
	}
	if (severity === "info") {
		return toast.info
	}

	return toast
}

const NotificationArea: UtilityComponent = (props) => {
	const Icon = getUtility("uesio/io.icon")
	const notifications = useNotifications()
	const activeNotifications = useRef<string[]>([])

	const classes = useUtilityStyleTokens(
		{
			icon: ["text-lg"],
			success: ["text-green-700"],
			info: ["text-blue-700"],
			warning: ["text-orange-600"],
			error: ["text-rose-500"],
		},
		props
	)

	useEffect(() => {
		const relevantNotifications = notifications.filter(
			(notification) =>
				notification.path === props.path ||
				(!notification.path && !props.path)
		)
		const currentNotificationIds = relevantNotifications.map(
			(notification) => notification.id
		)
		const removeNotifications = activeNotifications.current.filter(
			(notificationid) => !currentNotificationIds.includes(notificationid)
		)

		removeNotifications.forEach((notificationid) =>
			toast.dismiss(notificationid)
		)

		relevantNotifications.forEach((notification) => {
			const toastFunc = getToastFunc(notification.severity)

			toastFunc(notification.text, {
				onDismiss: () => {
					dispatch(removeNotification(notification.id))
				},
				onAutoClose: () => {
					dispatch(removeNotification(notification.id))
				},
				duration: parseInt(notification.duration || "20", 10) * 1000,
				description: notification.details,
				id: notification.id,
				closeButton: true,
			})
		})
		activeNotifications.current = notifications.map(
			(notification) => notification.id
		)
	}, [notifications, props.path])

	return (
		<Toaster
			icons={{
				success: (
					<Icon
						className={cx(classes.icon, classes.success)}
						icon="info"
						context={props.context}
					/>
				),
				info: (
					<Icon
						className={cx(classes.icon, classes.info)}
						icon="lightbulb"
						context={props.context}
					/>
				),
				warning: (
					<Icon
						className={cx(classes.icon, classes.warning)}
						icon="info"
						context={props.context}
					/>
				),
				error: (
					<Icon
						className={cx(classes.icon, classes.error)}
						icon="error"
						context={props.context}
					/>
				),
			}}
		/>
	)
}

export default NotificationArea
