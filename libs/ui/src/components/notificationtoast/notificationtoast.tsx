import React, { FC, useState, useEffect } from "react"
import styles from "./styles"
type T = Notification

type Colors = {
	success: "green"
	error: "red"
	warning: "orange"
	info: "blue"
}

type NotificationType = "success" | "errror" | "warning" | "info"

export type Notification = {
	type: NotificationType
	title: string
	body: string
}

const notificationtoast: FC<T> = ({ title = "title", body = "body" }) => {
	const [isVisible, setIsVisible] = useState(false)
	const color = "green"
	const styling = styles(color)

	setTimeout(() => {
		setIsVisible(true)
	}, 3000)

	return (
		<div onClick={() => setIsVisible(false)} className={styling}>
			<div className={`${isVisible ? "visible" : ""} box`}>
				<div>
					<span className="icon icon--rounded">edit</span>
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
