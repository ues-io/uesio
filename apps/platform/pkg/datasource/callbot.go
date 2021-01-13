package datasource

import (
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// CallBotAPI type
type CallBotAPI struct {
	session *sess.Session
	Params  *ParamsAPI `bot:"params"`
}

// Save function
func (cba *CallBotAPI) Save(collection string, changes []map[string]interface{}) (*SaveResponseBatch, error) {
	changeRequestMap := map[string]adapters.ChangeRequest{}
	for index, req := range changes {
		changeRequestMap[strconv.Itoa(index)] = adapters.ChangeRequest{
			FieldChanges: req,
		}
	}
	return Save(SaveRequestBatch{
		Wires: []adapters.SaveRequest{
			{
				Collection: collection,
				Wire:       "apicallbot",
				Changes:    changeRequestMap,
			},
		},
	}, cba.session)
}
