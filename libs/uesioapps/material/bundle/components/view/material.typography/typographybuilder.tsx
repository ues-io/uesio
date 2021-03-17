import { FunctionComponent } from "react"
import { hooks } from "@uesio/ui"
import { TypographyProps, TypographyDefinition } from "./typographydefinition"
import Typography from "./typography"

const TypographyBuilder: FunctionComponent<TypographyProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as TypographyDefinition
	const isStructureView = uesio.builder.useIsStructureView()
	const { context } = props

	return (
		<Typography
			{...props}
			context={context.addFrame({ noMerge: isStructureView })}
			definition={definition}
		/>
	)
}

export default TypographyBuilder
