import React, { FunctionComponent, Fragment } from "react"
import BuildPropItem from "../buildpropitem/buildpropitem"
import { definition, builder } from "@uesio/ui"

interface Props extends definition.BaseProps {
	properties: builder.PropDescriptor[]
	definition: definition.DefinitionMap
}

const PropList: FunctionComponent<Props> = ({
	path,
	definition: def,
	context,
	properties,
}) => (
	<Fragment>
		{properties.map((descriptor, index) => (
			<BuildPropItem
				key={index}
				path={path}
				definition={def}
				descriptor={descriptor}
				index={index}
				componentType=""
				context={context}
			/>
		))}
	</Fragment>
)

export default PropList
