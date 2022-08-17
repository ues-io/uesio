import { FC } from "react"
import { builder } from "@uesio/ui"
import PropList from "../buildproparea/proplist"

const ProplistProp: FC<builder.PropRendererProps> = (props) => {
	const { valueAPI, path, propsDef, context } = props
	const descriptor = props.descriptor as builder.PropListProp
	const itemsPath = path + `["${descriptor.name}"]`
	const items = valueAPI.get(itemsPath) as unknown[]

	return (
		<>
			{[{}, {}, ...items].map((item, i) => (
				<PropList
					key={i}
					path={path + `["${i}"]`}
					propsDef={propsDef}
					properties={descriptor.properties}
					context={context}
					valueAPI={valueAPI}
				/>
			))}
		</>
	)
}

export default ProplistProp
