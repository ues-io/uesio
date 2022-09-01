import { UtilityIOComponents } from "./libs/apps/uesio/io/bundle/componentpacks/main/componentTypes"

import React from "react"
import { MetadataKey } from "./libs/ui/src/metadataexports"
import { UtilityProps } from "./libs/ui/src/definition/definition"

export interface GetUtility extends UtilityIOComponents {
	(key: MetadataKey): React.ForwardRefExoticComponent<UtilityProps>
}

export default GetUtility
