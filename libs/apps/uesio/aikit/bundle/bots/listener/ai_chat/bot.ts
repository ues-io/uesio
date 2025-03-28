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
      content: message["uesio/aikit.content"],
    }))
    .concat({
      role: "user",
      content: input,
    })

  const result = bot.runIntegrationAction(
    "uesio/aikit.bedrock",
    "invokemodel",
    {
      //model: "anthropic.claude-3-sonnet-20240229-v1:0",
      model: "anthropic.claude-3-haiku-20240307-v1:0",
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
