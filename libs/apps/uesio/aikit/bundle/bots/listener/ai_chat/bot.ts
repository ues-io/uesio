import { ListenerBotApi, WireRecord } from "@uesio/bots"

export default function ai_chat(bot: ListenerBotApi) {
  const systemPrompt = bot.params.get("systemPrompt") as string
  const thread = bot.params.get("thread") as string
  const input = bot.params.get("input") as string

  // Get the previous messages
  const messagesResult = bot.load({
    collection: "uesio/aikit.thread_item",
    fields: [
      {
        id: "uesio/aikit.content",
      },
      {
        id: "uesio/aikit.type",
      },
      {
        id: "uesio/aikit.author",
      },
    ],
    conditions: [
      {
        field: "uesio/aikit.thread",
        operator: "EQ",
        value: thread,
      },
    ],
  })

  // Loop over the messages and put them in the right format
  const messages = messagesResult
    .map((message) => ({
      role: message["uesio/aikit.author"] === "USER" ? "user" : "assistant",
      content: [
        {
          type: "text",
          text: message["uesio/aikit.content"],
        },
      ],
    }))
    .concat({
      role: "user",
      content: [
        {
          type: "text",
          text: input,
        },
      ],
    })

  const result = bot.runIntegrationAction(
    "uesio/aikit.bedrock",
    "invokemodel",
    {
      messages,
      system: systemPrompt,
    },
  ) as {
    text: string
    type: string
  }[]

  if (!result.length) {
    throw new Error("Invalid Result")
  }

  bot.save("uesio/aikit.thread_item", [
    {
      "uesio/aikit.content": input,
      "uesio/aikit.type": "text",
      "uesio/aikit.author": "USER",
      "uesio/aikit.thread": {
        "uesio/core.id": thread,
      },
    },
    {
      "uesio/aikit.content": result[0].text,
      "uesio/aikit.type": "text",
      "uesio/aikit.author": "ASSISTANT",
      "uesio/aikit.thread": {
        "uesio/core.id": thread,
      },
    },
  ] as unknown as WireRecord[])
}
