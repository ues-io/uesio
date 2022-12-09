package datasource

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

func GetMergeFuncs(session *sess.Session, params map[string]string) map[string]interface{} {
	return map[string]interface{}{
		"Param": func(m map[string]interface{}, key string) (interface{}, error) {
			val, ok := params[key]
			if !ok {
				return nil, errors.New("missing param " + key)
			}
			return val, nil
		},
		"User": func(m map[string]interface{}, key string) (interface{}, error) {

			userID := session.GetUserID()

			if key == "id" {
				return userID, nil
			}

			return nil, nil
		},
	}
}
