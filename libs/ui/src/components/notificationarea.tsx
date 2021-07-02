import { FunctionComponent } from "react"
import { useNotifications } from "../bands/notification/selectors"
import { getUtility } from "../component/registry"
import { BaseProps } from "../definition/definition"
import { useUesio } from "../hooks/hooks"
import { remove as removeNotification } from "../bands/notification"

const Alert = getUtility("io.alert")

const NotificationArea: FunctionComponent<BaseProps> = (props) => {
	const notifications = useNotifications()
	const uesio = useUesio(props)

	if (!notifications.length) return null

	return (
		<>
			{notifications.map((notification) => (
				<Alert
					key={notification.id}
					text={notification.text}
					details={notification.details}
					severity={notification.severity}
					context={props.context}
					onClick={() => {
						uesio.getDispatcher()(
							removeNotification(notification.id)
						)
					}}
				/>
			))}
		</>
	)
}

export default NotificationArea
