import { FunctionComponent } from "react"

import { IconButtonProps } from "./iconbuttondefinition"
import IOIconButton from "../../utility/io.iconbutton/iconbutton"
import { hooks } from "@uesio/ui"

const IconButton: FunctionComponent<IconButtonProps> = (props) => {
	const { definition } = props
	const uesio = hooks.useUesio(props)
	return (
		<IOIconButton
			{...props}
			icon={definition.icon}
			onClick={
				definition?.signals &&
				uesio.signal.getHandler(definition.signals)
			}
		/>
	)
}

export default IconButton
