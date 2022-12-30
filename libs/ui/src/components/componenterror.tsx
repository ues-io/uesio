import { FC, SyntheticEvent } from "react"
import { getErrorString } from "../bands/utils"
import { UtilityProps } from "../definition/definition"

import { useUesio } from "../hooks/hooks"

interface Props extends UtilityProps {
	error: Error
}

const slotError: FC<Props> = (props) => {
	const cname = props.componentType
	const uesio = useUesio(props)
	const viewDefId = props.context.getViewDefId() || ""
	const message = getErrorString(props.error)

	return (
		<div
			onClick={(event: SyntheticEvent) => {
				uesio.builder.setSelectedNode(
					"viewdef",
					viewDefId,
					props.path || ""
				)
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
				{cname}
			</p>
			<pre style={{ whiteSpace: "normal" }}>{message}</pre>
		</div>
	)
}

export default slotError
