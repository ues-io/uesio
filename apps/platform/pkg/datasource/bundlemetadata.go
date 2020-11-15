package datasource

import (
	"errors"
	"strconv"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/metadata"
	"github.com/thecloudmasters/uesio/pkg/reqs"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func getPartsFromVersion(version string) ([]int, error) {
	errorObj := errors.New("version must be formatted like so: v#.#.#, gave: " + version)
	if !strings.HasPrefix(version, "v") {
		return nil, errorObj
	}
	version = strings.TrimPrefix(version, "v")
	parts := strings.Split(version, ".")
	if len(parts) != 3 {
		return nil, errorObj
	}
	partsAsNums := make([]int, 3)
	for i, part := range parts {
		asInt, err := strconv.Atoi(part)
		if err != nil {
			return nil, errorObj
		}
		partsAsNums[i] = asInt
	}
	return partsAsNums, nil
}

// SaveBundleMetadata function
func SaveBundleMetadata(namespace string, version string, description string, session *sess.Session) error {
	versionParts, err := getPartsFromVersion(version)
	if err != nil {
		return err
	}
	bundles := metadata.BundleCollection{
		metadata.Bundle{
			Namespace:   namespace,
			Major:       strconv.Itoa(versionParts[0]),
			Minor:       strconv.Itoa(versionParts[1]),
			Patch:       strconv.Itoa(versionParts[2]),
			Description: description,
		},
	}

	_, err = PlatformSave([]PlatformSaveRequest{
		{
			Collection: &bundles,
		},
	}, session)
	if err != nil {
		return err
	}
	return nil
}

//TODO::
//func deleteBundle(namespace string, version string, site *metadata.Site, sess *session.Session) error {
//
//}
func getBundleMetadataByID(id string, session *sess.Session) (*metadata.Bundle, error) {
	b := metadata.Bundle{}
	err := PlatformLoadOne(
		&b,
		[]reqs.LoadRequestCondition{
			{
				Field: "uesio.id",
				Value: id,
			},
		},
		session,
	)
	if err != nil {
		return nil, err
	}
	return &b, nil
}
