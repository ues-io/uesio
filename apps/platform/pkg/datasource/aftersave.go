package datasource

import (
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapters"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// AfterSaveAPI type
type AfterSaveAPI struct {
	Results *ResultsAPI `bot:"results"`
	errors  []string
	session *sess.Session
}

func NewAfterSaveAPI(request *adapters.SaveRequest, response *adapters.SaveResponse, metadata *adapters.CollectionMetadata, session *sess.Session) *AfterSaveAPI {
	return &AfterSaveAPI{
		Results: &ResultsAPI{
			results:  response.ChangeResults,
			changes:  request.Changes,
			metadata: metadata,
		},
		session: session,
	}
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
				Wire:       "apiaftersave",
				Changes:    changeRequestMap,
			},
		},
	}, as.session)
}
