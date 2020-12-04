import React, { FunctionComponent, Fragment } from "react"
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
	<Fragment>
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
	</Fragment>
)

export default PropList
