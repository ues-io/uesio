import { parse } from "best-effort-json-parser"

type IncompleteJsonHandling = "error" | "ignore" | "best-effort"

type JSONTransformStreamOptions = {
	// by default, if there is any unterminated JSON,
	// a "best-effort" attempt is made to terminate it and parse it.
	// If you want to throw an error instead, set this to "error",
	// or if you want to ignore it, set this to "ignore"
	incompleteJsonHandling?: IncompleteJsonHandling
}

type ParseResult = {
	remaining?: string
	objects?: object[]
}

const laxParse = (input: string) => {
	// start out at the first { character
	const startIndex = input.indexOf("{")
	if (startIndex === -1) {
		return {
			remaining: input,
		}
	}
	input = input.substring(startIndex)
	try {
		const res = parse(input)
		if (Array.isArray(res)) {
			return {
				objects: res,
			}
		} else if (typeof res === "object") {
			return {
				objects: [res],
			}
		}
		return {
			remaining: input,
		}
	} catch (err) {
		return {
			remaining: input,
		}
	}
}

const strictParse = (input: string): ParseResult => {
	// First try to find an object delimiter with a comma after it
	const startIndex = input.indexOf("{")
	let endIndex = input.indexOf("},")
	if (endIndex === -1) {
		endIndex = input.indexOf("}")
	}
	// If we have both a start index and an end index, parse that out
	if (startIndex !== -1 && endIndex !== -1) {
		const objectString = input.substring(startIndex, endIndex + 1)
		try {
			const obj = JSON.parse(objectString)
			input = input.substring(endIndex + 1)
			return {
				remaining: input,
				objects: [obj],
			}
		} catch (e) {
			// If we can't parse the data, break out, we can't parse what we've got
			return {
				remaining: input,
			}
		}
	}
	return {
		remaining: input,
	}
}

// JSONTransformStream takes a stream of JSON strings and outputs JSON objects
function JSONTransformStream(options: JSONTransformStreamOptions = {}) {
	let buffer = ""
	const { incompleteJsonHandling = "best-effort" } = options
	return new TransformStream<string, object>({
		transform: (
			chunk: string,
			controller: TransformStreamDefaultController<object>
		) => {
			buffer += chunk
			let remaining = buffer
			while (remaining.includes("}")) {
				const parseResult = strictParse(remaining)
				if (parseResult.objects) {
					parseResult.objects.forEach((obj) =>
						controller.enqueue(obj)
					)
					if (parseResult.remaining || parseResult.remaining === "") {
						remaining = parseResult.remaining
					}
				} else {
					break
				}
			}
			buffer = remaining
		},
		flush: (controller: TransformStreamDefaultController<object>) => {
			// If there's any remaining data in the buffer, it's incomplete JSON
			if (buffer.length > 0) {
				switch (incompleteJsonHandling) {
					case "error":
						controller.error(
							new Error("Incomplete JSON in the stream.")
						)
						return
					case "ignore":
						return
				}
				// Otherwise we'll try to do our best to parse something out of what's left
				const { objects } = laxParse(buffer)
				if (objects) {
					objects.forEach((object) => controller.enqueue(object))
				}
			}
		},
	})
}

export default JSONTransformStream

export type { JSONTransformStreamOptions }
