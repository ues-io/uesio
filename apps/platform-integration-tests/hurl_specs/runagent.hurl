###############################################################
# Tests running the aikit runagent call bot
###############################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Invoke with missing agent parameter
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/aikit/runagent
{
    "model": "uesio.test-simple-responder"
}
HTTP 400
[Asserts]
body contains "missing required parameter: agent"


# Invoke with missing thread parameter
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/aikit/runagent
{
    "model": "uesio.test-simple-responder",
    "agent": "uesio/tests.myagent"
}
HTTP 400
[Asserts]
body contains "missing required parameter: thread"


# Invoke with missing input parameter
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/aikit/runagent
{
    "model": "uesio.test-simple-responder",
    "agent": "uesio/tests.myagent",
    "thread": "mythreadid"
}
HTTP 400
[Asserts]
body contains "missing required parameter: input"

# Invoke with poorly formatted bad agent id
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/aikit/runagent
{
    "model": "uesio.test-simple-responder",
    "agent": "bad_agent_id",
    "thread": "mythreadid",
    "input": "can you help me?"
}
HTTP 400
[Asserts]
body contains "bad key for agent: bad_agent_id"

# Invoke with correctly formatted bad agent id
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/aikit/runagent
{
    "model": "uesio.test-simple-responder",
    "agent": "uesio/tests.bad_agent_id",
    "thread": "mythreadid",
    "input": "can you help me?"
}
HTTP 400
[Asserts]
body contains "couldn't find item from platform load: Collection=uesio/studio.agent, Conditions=uesio/core.uniquekey :: uesio/tests:dev:bad_agent_id"

# Invoke with good agent id, but incompatible model
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/aikit/runagent
{
    "model": "uesio.test-simple-responder",
    "agent": "uesio/tests.myagent",
    "thread": "mythreadid",
    "input": "can you help me?"
}
HTTP 400
[Asserts]
body contains "invalid message format for agent"

# Invoke with good agent id, bad thread id
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/aikit/runagent
{
    "model": "uesio.test-anthropic-format",
    "agent": "uesio/tests.myagent",
    "thread": "bad_thread_id",
    "input": "can you help me?"
}
HTTP 400
[Asserts]
body contains "invalid input syntax for type uuid: \"bad_thread_id\""

# Create a real thread to use with the agent.
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/aikit.thread",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/aikit.agent": "uesio/tests.myagent",
                    "uesio/aikit.title": "My Conversation"
                }
            },
            "wire":"MyThreadInsertWire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null
[Captures]
threadid: jsonpath "$.wires[0].changes['temp1']['uesio/core.id']"

# Invoke with good agent id, good thread id
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/aikit/runagent
{
    "model": "uesio.test-anthropic-format",
    "agent": "uesio/tests.myagent",
    "thread": "{{threadid}}",
    "input": "can you help me?"
}
HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.params.results[0].type" == "text"
jsonpath "$.params.results[0].text" == ```
Uesio Test Model was invoked with the following options:

{
  "max_tokens": 4096,
  "messages": [
    {
      "content": [
        {
          "text": "can you help me?",
          "type": "text"
        }
      ],
      "role": "user"
    }
  ],
  "model": "uesio.test-anthropic-format",
  "system": [
    {
      "text": "You are an excellent agent.\n",
      "type": "text"
    }
  ],
  "tools": [
    {
      "name": "my_favorite_tool",
      "type": "hammer"
    }
  ]
}
```

# Verify that the thread items were correctly saved
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/aikit.thread_item",
            "query":true,
            "fields": [
                {
                    "id": "uesio/aikit.type"
                },
                {
                    "id": "uesio/aikit.author"
                },
                {
                    "id": "uesio/aikit.content"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/aikit.thread",
                    "value": "{{threadid}}"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 2
jsonpath "$.wires[0].data[0]['uesio/aikit.type']" == "text"
jsonpath "$.wires[0].data[0]['uesio/aikit.author']" == "USER"
jsonpath "$.wires[0].data[0]['uesio/aikit.content']" == "can you help me?"
jsonpath "$.wires[0].data[1]['uesio/aikit.type']" == "text"
jsonpath "$.wires[0].data[1]['uesio/aikit.author']" == "ASSISTANT"
jsonpath "$.wires[0].data[1]['uesio/aikit.content']" not isEmpty

# Invoke again on the same thread id with a follow up comment
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/bots/call/uesio/aikit/runagent
{
    "model": "uesio.test-anthropic-format",
    "agent": "uesio/tests.myagent",
    "thread": "{{threadid}}",
    "input": "Thanks for your help."
}
HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.params.results[0].type" == "text"
jsonpath "$.params.results[0].text" == ```
Uesio Test Model was invoked with the following options:

{
  "max_tokens": 4096,
  "messages": [
    {
      "content": [
        {
          "text": "can you help me?",
          "type": "text"
        }
      ],
      "role": "user"
    },
    {
      "content": [
        {
          "text": "Uesio Test Model was invoked with the following options:\n\n{\n  \"max_tokens\": 4096,\n  \"messages\": [\n    {\n      \"content\": [\n        {\n          \"text\": \"can you help me?\",\n          \"type\": \"text\"\n        }\n      ],\n      \"role\": \"user\"\n    }\n  ],\n  \"model\": \"uesio.test-anthropic-format\",\n  \"system\": [\n    {\n      \"text\": \"You are an excellent agent.\\n\",\n      \"type\": \"text\"\n    }\n  ],\n  \"tools\": [\n    {\n      \"name\": \"my_favorite_tool\",\n      \"type\": \"hammer\"\n    }\n  ]\n}\n",
          "type": "text"
        }
      ],
      "role": "assistant"
    },
    {
      "content": [
        {
          "text": "Thanks for your help.",
          "type": "text"
        }
      ],
      "role": "user"
    }
  ],
  "model": "uesio.test-anthropic-format",
  "system": [
    {
      "text": "You are an excellent agent.\n",
      "type": "text"
    }
  ],
  "tools": [
    {
      "name": "my_favorite_tool",
      "type": "hammer"
    }
  ]
}
```

# Verify that the thread items were correctly saved
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/aikit.thread_item",
            "query":true,
            "fields": [
                {
                    "id": "uesio/aikit.type"
                },
                {
                    "id": "uesio/aikit.author"
                },
                {
                    "id": "uesio/aikit.content"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/aikit.thread",
                    "value": "{{threadid}}"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 4
jsonpath "$.wires[0].data[0]['uesio/aikit.type']" == "text"
jsonpath "$.wires[0].data[0]['uesio/aikit.author']" == "USER"
jsonpath "$.wires[0].data[0]['uesio/aikit.content']" == "can you help me?"
jsonpath "$.wires[0].data[1]['uesio/aikit.type']" == "text"
jsonpath "$.wires[0].data[1]['uesio/aikit.author']" == "ASSISTANT"
jsonpath "$.wires[0].data[1]['uesio/aikit.content']" not isEmpty
jsonpath "$.wires[0].data[2]['uesio/aikit.type']" == "text"
jsonpath "$.wires[0].data[2]['uesio/aikit.author']" == "USER"
jsonpath "$.wires[0].data[2]['uesio/aikit.content']" == "Thanks for your help."
jsonpath "$.wires[0].data[3]['uesio/aikit.type']" == "text"
jsonpath "$.wires[0].data[3]['uesio/aikit.author']" == "ASSISTANT"
jsonpath "$.wires[0].data[3]['uesio/aikit.content']" not isEmpty


# Delete the thread now that we're done with it.
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/aikit.thread",
            "deletes":{
                "temp1":{
                    "uesio/core.id":"{{threadid}}"
                }
            },
            "changes":{},
            "wire":"MyThreadDeleteWire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" == null
