import React, { FC, useState, useEffect } from "react"
import styles from "./styles"
type TProps = Notification

type Types = {
	[key in NotificationType]: { color: string; icon: string }
}
const types: Types = {
	success: {
		color: "green",
		icon: "info",
	},
	info: {
		color: "green",
		icon: "lightbulb",
	},
	error: {
		color: "blue",
		icon: "info",
	},
	warning: {
		color: "blue",
		icon: "info",
	},
}

type NotificationType = "success" | "error" | "warning" | "info"

export type Notification = {
	type: NotificationType
	title: string
	body: string
}

const notificationtoast: FC<TProps> = ({
	title = "title",
	body = "body",
	type = "info",
}) => {
	const [isVisible, setIsVisible] = useState(false)
	const { color, icon } = types[type]

	setTimeout(() => {
		setIsVisible(true)
	}, 1000)

	return (
		<div onClick={() => setIsVisible(false)} className={styles(color)}>
			<div className={`${isVisible ? "visible" : ""} box`}>
				<div>
					<span className="icon icon--rounded">{icon}</span>
				</div>
				<div className="content">
					<p className="title">{title}</p>
					<p>{body}</p>
				</div>
				<span className="icon icon--close">close</span>
			</div>
		</div>
	)
}

export default notificationtoast
