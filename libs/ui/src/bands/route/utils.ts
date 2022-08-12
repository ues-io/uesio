import { EntityId } from "@reduxjs/toolkit"
import { AnyAction } from "redux"
import { ThunkDispatch } from "redux-thunk"
import { Platform } from "../../platform/platform"
import { RootState } from "../../store/store"
import { MetadataState } from "../metadata/types"
import { Dependencies } from "./types"
import { setMany as setComponentPack } from "../componentpack"
import { setMany as setComponentVariant } from "../componentvariant"
import { setMany as setConfigValue } from "../configvalue"
import { setMany as setLabel } from "../label"
import { setMany as setViewDef } from "../viewdef"

type EntityMap = Record<EntityId, MetadataState>

const dispatchRouteDeps = (
	deps: Dependencies | undefined,
	dispatch: ThunkDispatch<RootState, Platform, AnyAction>
) => {
	if (deps?.viewdef) {
		dispatch(setViewDef(deps?.viewdef.entities as EntityMap))
	}
	if (deps?.componentpack) {
		dispatch(setComponentPack(deps?.componentpack.entities as EntityMap))
	}
	if (deps?.configvalue) {
		dispatch(setConfigValue(deps?.configvalue.entities as EntityMap))
	}

	if (deps?.label) {
		dispatch(setLabel(deps?.label.entities as EntityMap))
	}

	if (deps?.componentvariant) {
		dispatch(
			setComponentVariant(deps?.componentvariant.entities as EntityMap)
		)
	}
}

export { dispatchRouteDeps }
