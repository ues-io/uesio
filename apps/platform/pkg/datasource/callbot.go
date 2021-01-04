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
	for index, req := range changes {
		changeRequestMap[strconv.Itoa(index)] = reqs.ChangeRequest{
			FieldChanges: req,
		}
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
