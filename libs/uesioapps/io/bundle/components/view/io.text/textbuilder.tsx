import { FunctionComponent } from "react"
import { TextProps } from "./textdefinition"
import Text from "./text"
import { component } from "@uesio/ui"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")

const TextBuilder: FunctionComponent<TextProps> = (props) => (
	<BuildWrapper {...props}>
		<Text {...props} />
	</BuildWrapper>
)

export default TextBuilder
