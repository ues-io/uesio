package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

// CallBotAPI type
type CallBotAPI struct {
	session    *sess.Session
	Params     *ParamsAPI `bot:"params"`
	connection adapt.Connection
}

// Save function
func (cba *CallBotAPI) Save(collection string, changes adapt.Collection) error {
	requests := []SaveRequest{
		{
			Collection: collection,
			Wire:       "apicallbot",
			Changes:    &changes,
		},
	}
	err := Save(requests, cba.session)
	return HandleSaveRequestErrors(requests, err)
}
