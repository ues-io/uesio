import JSONTransformStream from "./JSONTransformStream"
import { TransformStream } from "node:stream/web"

// eslint-disable-next-line no-undef, @typescript-eslint/no-explicit-any
global.TransformStream = TransformStream as unknown as any

const getTransformStreamTests = [
	{
		name: "simple",
		data: ['{"bla', 'h":"wo', 'o"}'],
		expected: [
			{
				blah: "woo",
			},
		],
	},
	{
		name: "multi",
		data: ['{"bla', 'h":"wo', 'o"}', ",", '{"worg":"f', 'oo"}'],
		expected: [
			{
				blah: "woo",
			},
			{
				worg: "foo",
			},
		],
	},
	{
		name: "bad data",
		data: ['{"bla', 'h"}:"wo', 'o"}', ",", '{"worg":"f', 'oo"}'],
		expected: [
			{
				blah: undefined,
			},
		],
	},
	{
		name: "lax data (missing comma)",
		data: ['{"bla', 'h":"wo', 'o"}', '{"worg":"f', 'oo"}'],
		expected: [
			{
				blah: "woo",
			},
			{
				worg: "foo",
			},
		],
	},
]

describe("jsonTransformStream", () => {
	getTransformStreamTests.forEach((tc) => {
		test(tc.name, async () => {
			const stream = JSONTransformStream()
			const readStream = stream.readable
			const writeStream = stream.writable

			const writer = writeStream.getWriter()
			for (const chunk of tc.data) {
				writer.write(chunk)
			}

			writer.close()

			const results = []
			const reader = readStream.getReader()
			for (
				let result = await reader.read();
				!result.done;
				result = await reader.read()
			) {
				results.push(result.value)
			}
			expect(results).toEqual(tc.expected)
		})
	})
})
