import { FunctionComponent } from "react";
import { hooks, material } from "@uesio/ui"
import { CardActionProps } from "./cardactiondefinition"
import Icon from "../icon/icon"

const CardAction: FunctionComponent<CardActionProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { definition, path, context } = props

	return (
		<material.Tooltip
			title={definition?.helptext || ""}
			placement={definition?.helptextposition}
		>
			<material.IconButton
				onClick={
					definition?.signals &&
					uesio.signal.getHandler(definition.signals)
				}
			>
				<Icon
					definition={{
						type: definition.icon,
						size: definition.size,
					}}
					path={path}
					context={context}
				/>
			</material.IconButton>
		</material.Tooltip>
	)
}

export default CardAction
