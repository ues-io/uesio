import React, { FC } from "react"
import { definition, api } from "@uesio/ui"
import ReactGA from "react-ga4"

const Ga4: FC<definition.BaseProps> = (props) => {
	const MEASUREMENT_ID =
		api.view.useConfigValue("uesio/web.ga4_measurement_id") ||
		"G-1WLYF635CR"

	ReactGA.initialize(MEASUREMENT_ID)
	ReactGA.send({
		hitType: "pageview",
		page: props.context.getRoute()?.path,
	})

	return null
}

export default Ga4
