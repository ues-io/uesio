import { useNotifications } from "../bands/notification/selectors"
import { UtilityComponent } from "../definition/definition"
import { dispatch } from "../store/store"
import { remove as removeNotification } from "../bands/notification"
import { getUtility } from "../component/component"

const NotificationArea: UtilityComponent = (props) => {
	const Alert = getUtility("uesio/io.alert")
	const notifications = useNotifications()

	if (!notifications.length) return null

	return (
		<>
			{notifications
				.filter(
					(notification) =>
						notification.path === props.path ||
						(!notification.path && !props.path)
				)
				.map((notification) => (
					<Alert
						key={notification.id}
						text={notification.text}
						details={notification.details}
						severity={notification.severity}
						context={props.context}
						onClick={() => {
							dispatch(removeNotification(notification.id))
						}}
						id={notification.id}
						duration={notification.duration}
					/>
				))}
		</>
	)
}

export default NotificationArea
