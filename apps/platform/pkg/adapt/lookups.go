package adapt

import (
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
)

func getLookupResultMap(op *LoadOp, keyField string) (map[string]loadable.Item, error) {
	lookupResult := map[string]loadable.Item{}
	err := op.Collection.Loop(func(item loadable.Item, _ string) error {
		keyVal, err := item.GetField(keyField)
		if err == nil {
			keyString, ok := keyVal.(string)
			if ok {
				lookupResult[keyString] = item
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return lookupResult, nil
}
