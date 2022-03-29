package datasource

import (
	"errors"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/fileadapt"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/meta/loadable"
	"github.com/thecloudmasters/uesio/pkg/sess"
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

func clearUserCache(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	keys := []string{}
	for _, id := range getIDsFromUpdatesAndDeletes(request) {
		keys = append(keys, cache.GetUserKey(id, session.GetSite().GetAppID()))
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

func clearHostCacheForDomain(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	return clearHostForDomains(getIDsFromUpdatesAndDeletes(request))
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

func clearHostCacheForSite(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {
	ids := getIDsFromUpdatesAndDeletes(request)
	domains := meta.SiteDomainCollection{}
	err := PlatformLoad(&domains, &PlatformLoadOptions{
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    "uesio/studio.site",
				Value:    ids,
				Operator: "IN",
			},
		},
		Connection: connection,
	}, session)
	if err != nil {
		return err
	}
	domainIds := []string{}
	err = domains.Loop(func(item loadable.Item, index string) error {
		id, err := item.GetField(adapt.ID_FIELD)
		if err != nil {
			return err
		}
		domainIds = append(domainIds, id.(string))
		return nil
	})
	if err != nil {
		return err
	}

	return clearHostForDomains(domainIds)
}

func cleanUserFiles(request *adapt.SaveOp, connection adapt.Connection, session *sess.Session) error {

	ids := []string{}
	for i := range *request.Deletes {
		ids = append(ids, (*request.Deletes)[i].IDValue)
	}

	if len(ids) == 0 {
		return nil
	}
	// Load all the userfile records
	ufmc := meta.UserFileMetadataCollection{}
	err := PlatformLoad(&ufmc, &PlatformLoadOptions{
		Conditions: []adapt.LoadRequestCondition{
			{
				Field:    adapt.ID_FIELD,
				Value:    ids,
				Operator: "IN",
			},
		},
		Connection: connection,
	}, session)
	if err != nil {
		return err
	}

	for i := range ufmc {
		ufm := ufmc[i]

		_, fs, err := fileadapt.GetFileSourceAndCollection(ufm.FileCollectionID, session)
		if err != nil {
			return err
		}
		conn, err := fileadapt.GetFileConnection(fs.GetKey(), session)
		if err != nil {
			return err
		}

		err = conn.Delete(ufm.Path)
		if err != nil {
			return err
		}
	}
	return nil
}
