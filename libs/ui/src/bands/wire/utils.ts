import { PlainWire } from "./types"
export const listLookupWires = (wires: PlainWire[]) =>
	wires.flatMap(
		(wire) =>
			wire.conditions?.flatMap((c) =>
				"lookupWire" in c
					? {
							wire: wire.name,
							missingDependency: c.lookupWire,
					  }
					: []
			) || []
	)
