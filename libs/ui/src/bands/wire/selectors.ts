import { useSelector } from "react-redux"
import { createSelector } from "@reduxjs/toolkit"
import { RootState } from "../../store/store"
import { PlainWire } from "./types"
import { selectors } from "."

// Both gets wire state and subscribes the component to wire changes
const useWire = (viewId?: string, wireName?: string): PlainWire | undefined =>
	useSelector((state: RootState) => selectWire(state, viewId, wireName))

const useWires = (
	fullWireIds: string[]
): Record<string, PlainWire | undefined> =>
	useSelector((state: RootState) => selectWires(state, fullWireIds))

const selectWires = createSelector(
	selectors.selectEntities,
	(state: RootState, fullWireIds: string[]) => fullWireIds,
	(items, fullWireIds) =>
		Object.fromEntries(
			Object.entries(items).filter(([key]) => fullWireIds.includes(key))
		)
)

const selectWire = (
	state: RootState,
	viewId: string | undefined,
	wireName: string | undefined
) =>
	viewId && wireName
		? selectors.selectById(state, getFullWireId(viewId, wireName))
		: undefined

const getFullWireId = (viewId: string, wireName: string) =>
	`${viewId}/${wireName}`

export { useWire, useWires, selectWire, getFullWireId }
