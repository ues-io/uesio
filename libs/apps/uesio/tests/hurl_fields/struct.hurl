######################################################
# Tests for field type STRUCT with subtype TEXT
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
# entry 1
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "{\"subject\":\"uesio\"}"
}
HTTP 200

# Operator: BETWEEN | valueSource: VALUE | subfield "age"
# entry 2
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.struct"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.struct",
                    "operator": "BETWEEN",
                    "valueSource": "VALUE",
                    "subfield": "age",
                    "start": 10,
                    "end": 30,
                    "inclusiveStart": false,
                    "inclusiveEnd": false
                }
            ] 
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" == "ID-001"

# Operator: EQ | valueSource: VALUE | subfield "firstname"
# entry 3
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.wire_condition",
            "fields": [{"id": "uesio/tests.struct"},{"id": "uesio/core.uniquekey"}],
            "query":true,
            "conditions": [
                {
                    "field": "uesio/tests.struct",
                    "operator": "EQ",
                    "valueSource": "VALUE",
                    "subfield": "firstname",
                    "value": "Michael"
                }
            ] 
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data[*]['uesio/core.uniquekey']" == "ID-002"
