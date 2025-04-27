######################################################
# Tests loading a wire
######################################################

# Test as a logged-in user so that we don't get redirected to the login page
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/site/auth/uesio/core/mock/login
{
    "token": "uesio"
}

# Get the id of an animal record
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
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
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
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
                    "uesio/core.path":"contract.txt"
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].changes['temp1']['uesio/core.uniquekey']" == "uesio/tests.animal:{{idvalue}}:attachment:contract.txt"
jsonpath "$.wires[0].changes['temp1']['uesio/core.collectionid']" == "uesio/tests.animal"
jsonpath "$.wires[0].changes['temp1']['uesio/core.data']" not exists
jsonpath "$.wires[0].errors" == null
[Captures]
attachmentid: jsonpath "$.wires[0].changes['temp1']['uesio/core.id']"

# Verify that the download fails because it was inserted without data
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid}}
HTTP 500
[Asserts]
body startsWith "Internal Server Error"

# Now update the file with some data
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
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
jsonpath "$.wires[0].changes['temp1']['uesio/core.uniquekey']" == "uesio/tests.animal:{{idvalue}}:attachment:contract.txt"
jsonpath "$.wires[0].changes['temp1']['uesio/core.data']" == "This is some text data"
jsonpath "$.wires[0].errors" == null

# Verify that the download works now
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid}}
HTTP 200
[Asserts]
body == "This is some text data"

# Now update the file again
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
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
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid}}
HTTP 200
[Asserts]
body == "This is some text data that changed"

# Now test an insert with data
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
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
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid2}}
HTTP 200
[Asserts]
body == "Even more text data"

# Now delete the files
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/delete/{{attachmentid}}
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.success" == true

# Now delete the files
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/delete/{{attachmentid2}}
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.success" == true

# Verify that the files are gone
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid}}
HTTP 404
[Asserts]
body startsWith "couldn't find item from platform load: Collection=uesio/core.userfile, Conditions=uesio/core.id :: {{attachmentid}}"

GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid2}}
HTTP 404
[Asserts]
body startsWith "couldn't find item from platform load: Collection=uesio/core.userfile, Conditions=uesio/core.id :: {{attachmentid2}}"


# Now upload an attachment connected to a file field, but invalid field
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/upload
Accept: application/json
[MultipartFormData]
details: {"name":"description.txt","collectionID":"uesio/tests.animal","recordID":"{{idvalue}}","fieldID":"uesio/tests.invalidfield"}
file: this shouldn't work.
HTTP 500
[Asserts]
body startsWith "Internal Server Error"

# Now upload an attachment connected to a file field, but it is valid
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/upload
Accept: application/json
[MultipartFormData]
details: {"name":"description.txt","collectionID":"uesio/tests.animal","recordID":"{{idvalue}}","fieldID":"uesio/tests.description_file"}
file: another description of this animal.
HTTP 200
[Asserts]
jsonpath "$.['uesio/core.uniquekey']" == "uesio/tests.animal:{{idvalue}}:field:uesio/tests.description_file:description.txt"
jsonpath "$.['uesio/core.collectionid']" == "uesio/tests.animal"
jsonpath "$.['uesio/core.mimetype']" == "text/plain; charset=utf-8"
jsonpath "$.['uesio/core.recordid']" == "{{idvalue}}"
jsonpath "$.['uesio/core.fieldid']" == "uesio/tests.description_file"
jsonpath "$.['uesio/core.filesourceid']" == "uesio/core.platform"
jsonpath "$.['uesio/core.path']" == "description.txt"
jsonpath "$.['uesio/core.type']" == "field:uesio/tests.description_file"
jsonpath "$.['uesio/core.contentlength']" == 35
[Captures]
attachmentid3: jsonpath "$.['uesio/core.id']"

# Verify that the download works
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid3}}
HTTP 200
[Asserts]
body == "another description of this animal."

# Now delete the file
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/delete/{{attachmentid3}}
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.success" == true

# Verify that the file is gone
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid3}}
HTTP 404
[Asserts]
body startsWith "couldn't find item from platform load: Collection=uesio/core.userfile, Conditions=uesio/core.id :: {{attachmentid3}}"

# Now test an insert with data and invalid field
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
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
                    "uesio/core.fieldid":"uesio/tests.invalidfield",
                    "uesio/core.path":"contract2.txt",
                    "uesio/core.data":"this should fail"
                }
            },
            "wire":"mywire"
        }
    ]
}
HTTP 200
[Asserts]
jsonpath "$.wires[0].errors" count == 1
jsonpath "$.wires[0].errors[0].message" contains "no metadata provided for field: uesio/tests.invalidfield in collection: animal"

# Now test with a valid field
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/save
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
                    "uesio/core.fieldid":"uesio/tests.description_file",
                    "uesio/core.path":"contract2.txt",
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
jsonpath "$.wires[0].changes['temp1']['uesio/core.type']" == "field:uesio/tests.description_file"
jsonpath "$.wires[0].changes['temp1']['uesio/core.uniquekey']" == "uesio/tests.animal:{{idvalue}}:field:uesio/tests.description_file:contract2.txt"
jsonpath "$.wires[0].errors" == null
[Captures]
attachmentid4: jsonpath "$.wires[0].changes['temp1']['uesio/core.id']"

# Now query the field and make sure it's there
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "fields": [
                {
                    "id": "uesio/tests.genus"
                },
                {
                    "id": "uesio/tests.description_file"
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
jsonpath "$.wires[0].data[0]['uesio/core.id']" == "{{idvalue}}"
jsonpath "$.wires[0].data[0]['uesio/tests.description_file']['uesio/core.id']" == "{{attachmentid4}}"
jsonpath "$.wires[0].data[0]['uesio/tests.description_file']['uesio/core.path']" == "contract2.txt"
jsonpath "$.wires[0].data[0]['uesio/tests.description_file']['uesio/core.mimetype']" == "text/plain; charset=utf-8"
jsonpath "$.wires[0].data[0]['uesio/tests.description_file']['uesio/core.uniquekey']" == "uesio/tests.animal:{{idvalue}}:field:uesio/tests.description_file:contract2.txt"


# Now delete the file
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/delete/{{attachmentid4}}
Accept: application/json
HTTP 200
[Asserts]
jsonpath "$.success" == true

# Verify that the file is gone
GET {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/userfiles/download?userfileid={{attachmentid4}}
HTTP 404
[Asserts]
body startsWith "couldn't find item from platform load: Collection=uesio/core.userfile, Conditions=uesio/core.id :: {{attachmentid4}}"

# Now query the field and make sure it's gone
POST {{site_scheme}}://studio.{{site_primary_domain}}:{{site_port}}/workspace/uesio/tests/dev/wires/load
Accept: application/json
{
    "wires": [
        {
            "collection":"uesio/tests.animal",
            "query":true,
            "fields": [
                {
                    "id": "uesio/tests.genus"
                },
                {
                    "id": "uesio/tests.description_file"
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
jsonpath "$.wires[0].data[0]['uesio/core.id']" == "{{idvalue}}"
jsonpath "$.wires[0].data[0]['uesio/tests.description_file']" == null
