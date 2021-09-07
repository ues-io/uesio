package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// AfterSaveAPI type
type AfterSaveAPI struct {
	Inserts *InsertsAPI `bot:"inserts"`
	Updates *UpdatesAPI `bot:"updates"`
	Deletes *DeletesAPI `bot:"deletes"`
	errors  []string
	session *sess.Session
}

func NewAfterSaveAPI(request *adapt.SaveOp, metadata *adapt.CollectionMetadata, session *sess.Session) *AfterSaveAPI {
	return &AfterSaveAPI{
		Inserts: &InsertsAPI{
			inserts:  request.Inserts,
			metadata: metadata,
		},
		Updates: &UpdatesAPI{
			updates:  request.Updates,
			metadata: metadata,
		},
		Deletes: &DeletesAPI{
			deletes:  request.Deletes,
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
func (as *AfterSaveAPI) Save(collection string, changes adapt.Collection) error {
	requests := []SaveRequest{
		{
			Collection: collection,
			Wire:       "apiaftersave",
			Changes:    &changes,
		},
	}
	err := Save(requests, as.session)
	if err != nil {
		return err
	}
	return HandleSaveRequestErrors(requests)
}
