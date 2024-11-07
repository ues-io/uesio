######################################################
# Tests loading a wire
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST https://{{host}}:{{port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Get the id of an animal record
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "fields": [
                {
                    "id": "uesio/tests.genus"
                }
            ],
            "conditions": [
                {
                    "field": "uesio/core.uniquekey",
                    "value": "MacAughtrie:Jerrine"
                }
            ]
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].data" count == 1
jsonpath "$.collections" not exists
jsonpath "$.wires[0].errors" not exists
[Captures]
idvalue: jsonpath "$.wires[0].data[0]['uesio/core.id']"

# Now upload an attachment to this animal using wires
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.userfile",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/core.collectionid":"uesio/tests.animal",
                    "uesio/core.recordid":"{{idvalue}}",
                    "uesio/core.path":"contract.txt",
                    "uesio/core.type":"attachment",
                    "uesio/core.filesourceid":"uesio/core.platform"
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/core.collectionid']" == "uesio/tests.animal"
jsonpath "$.wires[0].changes['temp1']['uesio/core.data']" not exists
jsonpath "$.wires[0].errors" == null
[Captures]
attachmentid: jsonpath "$.wires[0].changes['temp1']['uesio/core.id']"

# Verify that the download fails because it was inserted without data
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid}}
HTTP 500
[Asserts]
body startsWith "Internal Server Error"

# Now update the file with some data
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.userfile",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/core.id":"{{attachmentid}}",
                    "uesio/core.data":"This is some text data"
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/core.data']" == "This is some text data"
jsonpath "$.wires[0].errors" == null

# Verify that the download works now
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid}}
HTTP 200
[Asserts]
body == "This is some text data"

# Now update the file again
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.userfile",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/core.id":"{{attachmentid}}",
                    "uesio/core.data":"This is some text data that changed"
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/core.data']" == "This is some text data that changed"
jsonpath "$.wires[0].errors" == null

# Verify that the download works now
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid}}
HTTP 200
[Asserts]
body == "This is some text data that changed"

# Now test an insert with data
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/wires/save
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/core.userfile",
            "deletes":{},
            "changes":{
                "temp1":{
                    "uesio/core.collectionid":"uesio/tests.animal",
                    "uesio/core.recordid":"{{idvalue}}",
                    "uesio/core.path":"contract2.txt",
                    "uesio/core.type":"attachment",
                    "uesio/core.filesourceid":"uesio/core.platform",
                    "uesio/core.data":"Even more text data"
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/core.collectionid']" == "uesio/tests.animal"
jsonpath "$.wires[0].changes['temp1']['uesio/core.data']" == "Even more text data"
jsonpath "$.wires[0].errors" == null
[Captures]
attachmentid2: jsonpath "$.wires[0].changes['temp1']['uesio/core.id']"

# Verify that the download works
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid2}}
HTTP 200
[Asserts]
body == "Even more text data"

# Now delete the files
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/userfiles/delete/{{attachmentid}}
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.success" == true

# Now delete the files
POST https://{{host}}:{{port}}/workspace/uesio/tests/dev/userfiles/delete/{{attachmentid2}}
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.success" == true

# Verify that the files are gone
GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid}}
HTTP 404
[Asserts]
body startsWith "Couldn't find item from platform load: Collection=uesio/core.userfile, Conditions=uesio/core.id :: {{attachmentid}}"

GET https://{{host}}:{{port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid2}}
HTTP 404
[Asserts]
body startsWith "Couldn't find item from platform load: Collection=uesio/core.userfile, Conditions=uesio/core.id :: {{attachmentid2}}"
