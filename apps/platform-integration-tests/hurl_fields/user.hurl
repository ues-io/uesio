######################################################
# Tests for field type USER
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}
HTTP 200

# Capture UUID for Users
# entry 2
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/wires/load
{
    "wires": [
        {
            "wire": "user1",
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
            "query": true
        },
        {
            "wire": "user2",
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
            "query": true
        }
    ]
}
HTTP 200
[Captures]
ID011-UUID: jsonpath "$.wires[0].data[0]['uesio/core.id']"
ID012-UUID: jsonpath "$.wires[1].data[0]['uesio/core.id']"

# create 2 new records with uesio/tests.name = "ID-011" / "ID-012" and user with uesio/core.id == ID011-UUID / ID012-UUID
# entry 3
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
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
      },
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
# entry 4
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]" isEmpty
jsonpath "$.wires[0].errors[0].message" contains "failed to encode args[2]: unable to encode 1 into text format for text (OID 25): cannot find encode plan"

# Operator: EQ | valueSource: VALUE | ID011-UUID
# entry 5
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" contains "{{ID011-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-011"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-001"

# Operator: EQ | valueSource: PARAM | ID011-UUID
# entry 6
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" contains "{{ID011-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-011"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-001"

# Operator: NOT_EQ | valueSource: VALUE | ID011-UUID
# entry 7
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-012"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-002"
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" contains "{{ID012-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" not contains "{{ID011-UUID}}"

# Operator: NOT_EQ | valueSource: VALUE | ID011-UUID
# entry 8
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-012"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-002"
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" contains "{{ID012-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" not contains "{{ID011-UUID}}"

# Operator: IN | valueSource: VALUE | ID011-UUID & ID012-UUID
# entry 9
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" contains "{{ID011-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" contains "{{ID012-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-001"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-002"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-011"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-012"

# Operator: IN | valueSource: PARAM | ID011-UUID & ID012-UUID
# entry 10
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" contains "{{ID011-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" contains "{{ID012-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-001"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-002"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-011"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-012"

# Operator: IN | valueSource: LOOKUP | ID011-UUID
# entry 11
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[1].data[*]['uesio/tests.user']['uesio/core.id']" contains "{{ID011-UUID}}"
jsonpath "$.wires[1].data[*]['uesio/tests.name']" contains "ID-001"
jsonpath "$.wires[1].data[*]['uesio/tests.name']" contains "ID-011"

# Operator: NOT_IN | valueSource: VALUE | ID011-UUID & ID012-UUID
# entry 12
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
            },
            {
               "field":"uesio/tests.user",
               "operator":"IS_NOT_BLANK"
            }
         ],
         "query":true
      }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" count == 3
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" contains "{{ID012-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-002"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-012"

# Operator: NOT_IN | valueSource: VALUE | ID011-UUID & ID012-UUID
# entry 12
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
jsonpath "$.wires[0].data" count == 10

# Operator: NOT_IN | valueSource: PARAM | ID011-UUID & ID012-UUID
# entry 13
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
            },
            {
               "field":"uesio/tests.user",
               "operator":"IS_NOT_BLANK"
            }
         ],
         "query":true
      }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" contains "{{ID012-UUID}}"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-002"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-012"

# Operator: NOT_IN | valueSource: LOOKUP | ID011-UUID
# entry 14
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
            },
            {
               "field":"uesio/tests.user",
               "operator":"IS_NOT_BLANK"
            }
         ],
         "query":true
      }
   ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[1].data[*]['uesio/tests.user']['uesio/core.id']" not contains "{{ID011-UUID}}"
jsonpath "$.wires[1].data[*]['uesio/tests.user']['uesio/core.id']" contains "{{ID012-UUID}}"
jsonpath "$.wires[1].data[*]['uesio/tests.name']" not contains "ID-011"
jsonpath "$.wires[1].data[*]['uesio/tests.name']" contains "ID-002"
jsonpath "$.wires[1].data[*]['uesio/tests.name']" contains "ID-012"

# Operator: IS_BLANK
# entry 15
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.user"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.user",
                    "operator": "IS_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.user']" contains null
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" isEmpty

# Operator: IS_NOT_BLANK
# entry 16
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.user"},{"id":"uesio/tests.name"}],
            "query":true,
            "conditions": [
                {
                    "active": true,
                    "field": "uesio/tests.user",
                    "operator": "IS_NOT_BLANK"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/tests.user']" not contains null
jsonpath "$.wires[0].data[*]['uesio/tests.user']['uesio/core.id']" exists
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-001"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-002"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-011"
jsonpath "$.wires[0].data[*]['uesio/tests.name']" contains "ID-012"
