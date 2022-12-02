import { definition, builder, signal } from "@uesio/ui"

type VideoDefinition = {
	file?: string
	src?: string
	height?: string
	width?: string
	muted?: boolean
	autoplay?: boolean
	loop?: boolean
	signals?: signal.SignalDefinition[]
}

interface VideoProps extends definition.BaseProps {
	definition: VideoDefinition
}

const VideoPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Video",
	description: "Display a video.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "file",
			type: "METADATA",
			metadataType: "FILE",
			label: "File",
		},
		{
			name: "src",
			type: "TEXT",
			label: "url",
		},
		{
			name: "height",
			type: "TEXT",
			label: "Height",
		},
		{
			name: "width",
			type: "TEXT",
			label: "Width",
		},
		{
			name: "muted",
			type: "BOOLEAN",
			label: "Muted",
		},
		{
			name: "loop",
			type: "BOOLEAN",
			label: "Loop",
		},
		{
			name: "autoplay",
			type: "BOOLEAN",
			label: "Auto play",
		},
	],
	sections: [
		{
			title: "Signals",
			type: "SIGNALS",
		},
	],
	traits: ["uesio.standalone"],
	classes: ["root", "inner"],
	type: "component",
	category: "CONTENT",
}
export { VideoProps, VideoDefinition }

export default VideoPropertyDefinition
