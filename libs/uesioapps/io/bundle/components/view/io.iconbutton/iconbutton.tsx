import { FunctionComponent } from "react"

import { IconButtonProps } from "./iconbuttondefinition"
import IOIconButton from "../../utility/io.iconbutton/iconbutton"
import { hooks } from "@uesio/ui"

const IconButton: FunctionComponent<IconButtonProps> = (props) => {
	const { definition } = props
	const uesio = hooks.useUesio(props)
	const [handler, portals] = uesio.signal.useHandler(definition.signals)
	return (
		<>
			<IOIconButton {...props} icon={definition.icon} onClick={handler} />
			{portals}
		</>
	)
}

export default IconButton
