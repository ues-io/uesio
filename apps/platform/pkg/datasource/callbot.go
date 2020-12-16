package datasource

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// CallBotAPI type
type CallBotAPI struct {
	session *sess.Session
	Params  *ParamsAPI `bot:"params"`
}

// Save function
func (cba *CallBotAPI) Save(collection string, changes []map[string]interface{}) (*SaveResponseBatch, error) {
	changeRequestMap := map[string]reqs.ChangeRequest{}
	changeRequest := reqs.ChangeRequest{
		FieldChanges: make(map[string]interface{}),
	}

	for index, req := range changes {
		changeRequest.FieldChanges = req
		changeRequestMap[strconv.Itoa(index)] = changeRequest
	}

	return Save(SaveRequestBatch{
		Wires: []reqs.SaveRequest{
			{
				Collection: collection,
				Wire:       "apicallbot",
				Changes:    changeRequestMap,
			},
		},
	}, cba.session)
}
