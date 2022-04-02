package datasource

import (
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// BeforeSaveAPI type
type BeforeSaveAPI struct {
	Inserts    *InsertsAPI `bot:"inserts"`
	Updates    *UpdatesAPI `bot:"updates"`
	Deletes    *DeletesAPI `bot:"deletes"`
	errors     []string
	session    *sess.Session
	connection adapt.Connection
}

func NewBeforeSaveAPI(op *adapt.SaveOp, connection adapt.Connection, session *sess.Session) *BeforeSaveAPI {
	return &BeforeSaveAPI{
		Inserts: &InsertsAPI{
			op: op,
		},
		Updates: &UpdatesAPI{
			op: op,
		},
		Deletes: &DeletesAPI{
			op: op,
		},
		session: session,
	}
}

// AddError function
func (bs *BeforeSaveAPI) AddError(message string) {
	bs.errors = append(bs.errors, message)
}

// HasErrors function
func (bs *BeforeSaveAPI) HasErrors() bool {
	return len(bs.errors) > 0
}

// GetErrorString function
func (bs *BeforeSaveAPI) GetErrorString() string {
	return strings.Join(bs.errors, ", ")
}
