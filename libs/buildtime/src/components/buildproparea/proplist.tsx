import React, { FunctionComponent } from "react"
import BuildPropItem from "../buildpropitem/buildpropitem"
import { definition, builder } from "@uesio/ui"

interface Props extends definition.BaseProps {
	properties: builder.PropDescriptor[]
}

const PropList: FunctionComponent<Props> = ({
	path,
	definition: def,
	context,
	properties,
}) => (
	<>
		{properties.map((descriptor, index) => (
			<BuildPropItem
				key={index}
				path={path}
				definition={def}
				descriptor={descriptor}
				index={index}
				context={context}
			/>
		))}
	</>
)

export default PropList
