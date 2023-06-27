######################################################
# Tests for field type USER
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}
HTTP 200

# Capture UUID for User 2
# entry 2
POST https://{{host}}:{{port}}/site/wires/load
{
    "wires": [
        {
            "wire": "newapp",
            "collection": "uesio/core.user",
            "fields": [
                {
                    "id":"uesio/core.id",
                    "id": "uesio/core.uniquekey"
                }
            ],
            "conditions": [
                {
                    "field":"uesio/core.uniquekey",
                    "operator":"EQ",
                    "valueSource":"VALUE",
                    "value":"uesio"
                }
            ],
            "query":true
        }
    ]
}
HTTP 200
[Captures]
ID011-UUID: jsonpath "$.wires[0].data[*]['uesio/core.id']"

# Capture UUID for User 2
# entry 3
POST https://{{host}}:{{port}}/site/wires/load
{
    "wires": [
        {
            "wire": "newapp",
            "collection": "uesio/core.user",
            "fields": [
                {
                    "id":"uesio/core.id",
                    "id": "uesio/core.uniquekey"
                }
            ],
            "conditions": [
                {
                    "field":"uesio/core.uniquekey",
                    "operator":"EQ",
                    "valueSource":"VALUE",
                    "value":"abel"
                }
            ],
            "query":true
        }
    ]
}
HTTP 200
[Captures]
ID012-UUID: jsonpath "$.wires[0].data[*]['uesio/core.id']"

# create new record with uesio/tests.name = "ID-011" and user with uesio/core.id == ID011-UUID
# entry 4
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
{
   "wires":[
      {
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "changes":{
            "11":{
                "uesio/tests.name": "ID-011",
                "uesio/tests.user":{
                  "uesio/core.id":"{{ID011-UUID}}"
               }
            }
         },
         "upsert":true
      }
   ]
}
HTTP 200

# create new record with uesio/tests.name = "ID-012" and user with uesio/core.id == ID012-UUID
# entry 5
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
{
   "wires":[
      {
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "changes":{
            "12":{
                "uesio/tests.name": "ID-012",
                "uesio/tests.user":{
                    "uesio/core.id":"{{ID012-UUID}}"
               }
            }
         },
         "upsert":true
      }
   ]
}
HTTP 200

# Operator: EQ | valueSource: VALUE | Bad Value
# entry 6
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
{
   "wires":[
      {
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "conditions":[
            {
               "field":"uesio/tests.user",
               "operator":"EQ",
               "valueSource":"VALUE",
               "value": 1
            }
         ],
         "query":true
      }
   ]
}
HTTP 400

# Operator: EQ | valueSource: VALUE | ID011-UUID
# entry 7
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
{
   "wires":[
      {
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "conditions":[
            {
               "field":"uesio/tests.user",
               "operator":"EQ",
               "valueSource":"VALUE",
               "value": "{{ID011-UUID}}"
            }
         ],
         "query":true
      }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" == "{{ID011-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" == "ID-011"

# Operator: EQ | valueSource: PARAM | ID011-UUID
# entry 8
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
{
   "wires":[
      {
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "params": {"ID-011": "{{ID011-UUID}}"},
         "conditions":[
            {
               "field":"uesio/tests.user",
               "operator":"EQ",
               "valueSource":"PARAM",
               "param": "ID-011"
            }
         ],
         "query":true
      }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" == "{{ID011-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" == "ID-011"

# Operator: NOT_EQ | valueSource: VALUE | ID011-UUID
# entry 9
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
{
   "wires":[
      {
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "conditions":[
            {
               "field":"uesio/tests.user",
               "operator":"NOT_EQ",
               "valueSource":"VALUE",
               "value": "{{ID011-UUID}}"
            }
         ],
         "query":true
      }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" == "{{ID012-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" != "{{ID011-UUID}}"

# Operator: NOT_EQ | valueSource: VALUE | ID011-UUID
# entry 10
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
{
   "wires":[
      {
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "params": {"ID-011": "{{ID011-UUID}}"},
         "conditions":[
            {
               "field":"uesio/tests.user",
               "operator":"NOT_EQ",
               "valueSource":"PARAM",
               "param": "ID-011"
            }
         ],
         "query":true
      }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" == "{{ID012-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" != "{{ID011-UUID}}"

# Operator: IN | valueSource: VALUE | ID011-UUID & ID012-UUID
# entry 11
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
{
   "wires":[
      {
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "conditions":[
            {
               "field":"uesio/tests.user",
               "operator":"IN",
               "valueSource":"VALUE",
               "values": [
                    "{{ID011-UUID}}",
                    "{{ID012-UUID}}"
               ]
            }
         ],
         "query":true
      }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" includes "{{ID011-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" includes "{{ID012-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" includes "ID-011"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" includes "ID-012"

# Operator: IN | valueSource: PARAM | ID011-UUID & ID012-UUID
# entry 12
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
{
   "wires":[
      {
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "params": {
            "ID-011": "{{ID011-UUID}}",
            "ID-012": "{{ID012-UUID}}"
         },
         "conditions":[
            {
               "field":"uesio/tests.user",
               "operator":"IN",
               "valueSource":"PARAM",
               "params": [
                "ID-011",
                "ID-012"
               ]
            }
         ],
         "query":true
      }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" includes "{{ID011-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" includes "{{ID012-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" includes "ID-011"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" includes "ID-012"

# Operator: IN | valueSource: LOOKUP | ID011-UUID
# entry 13
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
{
   "wires":[
      {
         "name": "lookup",
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "conditions":[
            {
               "field":"uesio/tests.name",
               "operator":"EQ",
               "valueSource":"VALUE",
               "value": "ID-011"
            }
         ],
         "query":true
      },
      {
         "name": "main",
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "conditions":[
            {
               "field":"uesio/tests.user",
               "operator":"IN",
               "valueSource":"LOOKUP",
               "lookupWire": "lookup",
               "lookupField": "uesio/tests.user->uesio/core.id"
            }
         ],
         "query":true
      }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]['uesio/tests.user']['uesio/core.id']" == "{{ID011-UUID}}"
jsonpath "$.wires[1].data[*]['uesio/tests.name']" == "ID-011"

# Operator: NOT_IN | valueSource: VALUE | ID011-UUID & ID012-UUID
# entry 14
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
{
   "wires":[
      {
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "conditions":[
            {
               "field":"uesio/tests.user",
               "operator":"NOT_IN",
               "valueSource":"VALUE",
               "values": [
                    "{{ID011-UUID}}"
               ]
            }
         ],
         "query":true
      }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" == "{{ID012-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" == "ID-012"

# Operator: NOT_IN | valueSource: PARAM | ID011-UUID & ID012-UUID
# entry 15
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
{
   "wires":[
      {
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "params": {
            "ID-011": "{{ID011-UUID}}"
         },
         "conditions":[
            {
               "field":"uesio/tests.user",
               "operator":"NOT_IN",
               "valueSource":"PARAM",
               "params": [
                    "ID-011"
               ]
            }
         ],
         "query":true
      }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" == "{{ID012-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" == "ID-012"


# Operator: NOT_IN | valueSource: LOOKUP | ID011-UUID
# entry 16
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
{
   "wires":[
      {
         "name": "lookup",
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "conditions":[
            {
               "field":"uesio/tests.name",
               "operator":"EQ",
               "valueSource":"VALUE",
               "value": "ID-011"
            }
         ],
         "query":true
      },
      {
         "name": "main",
         "collection":"uesio/tests.wire_condition",
         "fields":[{"id":"uesio/tests.user"},{"id":"uesio/tests.name"}],
         "conditions":[
            {
               "field":"uesio/tests.user",
               "operator":"NOT_IN",
               "valueSource":"LOOKUP",
               "lookupWire": "lookup",
               "lookupField": "uesio/tests.user->uesio/core.id"
            }
         ],
         "query":true
      }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]['uesio/tests.user']['uesio/core.id']" != "{{ID011-UUID}}"
jsonpath "$.wires[1].data[*]['uesio/tests.name']" != "ID-011"

