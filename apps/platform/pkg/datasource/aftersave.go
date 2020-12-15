package datasource

import (
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// AfterSaveAPI type
type AfterSaveAPI struct {
	Results *ResultsAPI `bot:"results"`
	errors  []string
	session *sess.Session
}

// AddError function
func (as *AfterSaveAPI) AddError(message string) {
	as.errors = append(as.errors, message)
}

// HasErrors function
func (as *AfterSaveAPI) HasErrors() bool {
	return len(as.errors) > 0
}

// GetErrorString function
func (as *AfterSaveAPI) GetErrorString() string {
	return strings.Join(as.errors, ", ")
}

// Save function
func (as *AfterSaveAPI) Save(collection string, changes []map[string]interface{}) (*SaveResponseBatch, error) {
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
				Wire:       "apiaftersave",
				Changes:    changeRequestMap,
			},
		},
	}, as.session)
}
