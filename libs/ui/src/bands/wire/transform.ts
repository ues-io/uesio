import { PlainWire, ServerWire } from "./types"
import { nanoid } from "@reduxjs/toolkit"

// transforms a wire from the server transmission format,
// where wire data is an array,
// to the client format, where data is an object keyed by transient ids
export const transformServerWire = (wire: ServerWire): PlainWire =>
	({
		...wire,
		data: Object.fromEntries((wire.data || []).map((r) => [nanoid(), r])),
	}) as PlainWire
