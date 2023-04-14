import { FC, SyntheticEvent } from "react"
import { getErrorString } from "../bands/utils"

interface Props {
	title: string
	error: Error
}

const slotError: FC<Props> = (props) => {
	const message = getErrorString(props.error)

	return (
		<div
			onClick={(event: SyntheticEvent) => {
				event.stopPropagation()
			}}
			style={{
				color: "rgba(255, 128, 128)",
				padding: "10px 10px 2px",
				border: "1px solid rgba(255, 128, 128)",
				borderLeft: "5px solid rgba(255, 128, 128)",
			}}
		>
			<p
				style={{
					textTransform: "uppercase",
					fontSize: "0.7em",
					fontWeight: "bold",
					margin: 0,
				}}
			>
				{props.title}
			</p>
			<pre style={{ whiteSpace: "normal" }}>{message}</pre>
		</div>
	)
}

export default slotError
