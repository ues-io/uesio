package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

type ServerMergeData struct {
	Session     *sess.Session
	ParamValues map[string]string
}

var ServerMergeFuncs = map[string]interface{}{
	"Param": func(m ServerMergeData, key string) (interface{}, error) {
		val, ok := m.ParamValues[key]
		if !ok {
			return nil, errors.New("missing param " + key)
		}
		return val, nil
	},
	"User": func(m ServerMergeData, key string) (interface{}, error) {

		userID := m.Session.GetUserID()

		if key == "id" {
			return userID, nil
		}

		return nil, nil
	},
}
