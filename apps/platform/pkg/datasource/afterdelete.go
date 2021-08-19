package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// AfterDeleteAPI type
type AfterDeleteAPI struct {
	Deletes *DeletesAPI `bot:"deletes"`
	errors  []string
	session *sess.Session
}

func NewAfterDeleteAPI(request *adapt.SaveOp, metadata *adapt.CollectionMetadata, session *sess.Session) *AfterDeleteAPI {
	return &AfterDeleteAPI{
		Deletes: &DeletesAPI{
			deletes:  request.Deletes,
			metadata: metadata,
		},
		session: session,
	}
}

// AddError function
func (as *AfterDeleteAPI) AddError(message string) {
	as.errors = append(as.errors, message)
}

// HasErrors function
func (as *AfterDeleteAPI) HasErrors() bool {
	return len(as.errors) > 0
}

// GetErrorString function
func (as *AfterDeleteAPI) GetErrorString() string {
	return strings.Join(as.errors, ", ")
}

// Save function
func (as *AfterDeleteAPI) Save(collection string, changes adapt.Collection) error {
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
