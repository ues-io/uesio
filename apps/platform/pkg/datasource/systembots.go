package datasource

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/cache"
)

func getIDsFromUpdatesAndDeletes(request *adapt.SaveOp) []string {
	keys := []string{}
	for i := range *request.Updates {
		keys = append(keys, (*request.Updates)[i].IDValue)
	}
	for i := range *request.Deletes {
		keys = append(keys, (*request.Deletes)[i].IDValue)
	}
	return keys
}

func clearHostForDomains(ids []string) error {
	keys := []string{}
	for _, id := range ids {
		key, err := getHostKeyFromDomainId(id)
		if err != nil {
			return err
		}
		keys = append(keys, key)
	}

	return cache.DeleteKeys(keys)
}

func getHostKeyFromDomainId(id string) (string, error) {
	idParts := strings.Split(id, "_")
	if len(idParts) != 2 {
		return "", errors.New("Bad Domain ID")
	}
	return cache.GetHostKey(idParts[1], idParts[0]), nil
}
