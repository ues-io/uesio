package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// AfterUpdateAPI type
type AfterUpdateAPI struct {
	Changes *ChangesAPI `bot:"results"`
	errors  []string
	session *sess.Session
}

func NewAfterUpdateAPI(request *adapt.SaveOp, metadata *adapt.CollectionMetadata, session *sess.Session) *AfterUpdateAPI {
	return &AfterUpdateAPI{
		Changes: &ChangesAPI{
			changes:  request.Changes,
			metadata: metadata,
		},
		session: session,
	}
}

// AddError function
func (as *AfterUpdateAPI) AddError(message string) {
	as.errors = append(as.errors, message)
}

// HasErrors function
func (as *AfterUpdateAPI) HasErrors() bool {
	return len(as.errors) > 0
}

// GetErrorString function
func (as *AfterUpdateAPI) GetErrorString() string {
	return strings.Join(as.errors, ", ")
}

// Save function
func (as *AfterUpdateAPI) Save(collection string, changes adapt.Collection) error {
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
