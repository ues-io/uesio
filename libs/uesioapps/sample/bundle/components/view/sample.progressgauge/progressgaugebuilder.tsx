import React, { FunctionComponent } from "react"
import ProgressGauge from "./progressgauge"
import { hooks } from "@uesio/ui"
import {
	ProgressGaugeProps,
	ProgressGaugeDefinition,
} from "./progressgaugedefinition"

const ProgressGaugeBuilder: FunctionComponent<ProgressGaugeProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as ProgressGaugeDefinition
	return <ProgressGauge {...props} definition={definition} />
}

export default ProgressGaugeBuilder
