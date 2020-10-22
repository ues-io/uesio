package datasource

import (
	"errors"
	"reflect"
	"strconv"

	"github.com/thecloudmasters/uesio/pkg/reqs"

	"github.com/icza/session"
	"github.com/jinzhu/copier"
	"github.com/mitchellh/mapstructure"
	"github.com/thecloudmasters/uesio/pkg/bundles"
	"github.com/thecloudmasters/uesio/pkg/metadata"
)

// PlatformSaveRequest struct
type PlatformSaveRequest struct {
	Collection metadata.CollectionableGroup
	Options    *reqs.SaveOptions
}

func decode(in interface{}, out interface{}) error {
	config := &mapstructure.DecoderConfig{
		Result:  out,
		TagName: "uesio",
	}

	decoder, err := mapstructure.NewDecoder(config)
	if err != nil {
		return err
	}

	if err := decoder.Decode(in); err != nil {
		return err
	}
	return nil
}

// PlatformLoad function
func PlatformLoad(collections []metadata.CollectionableGroup, requests []reqs.LoadRequest, site *metadata.Site, sess *session.Session) error {

	if len(collections) != len(requests) {
		return errors.New("Bad thing happened - we need the same number of collections as requests")
	}

	loadResponse, err := Load(
		LoadRequestBatch{
			Wires: requests,
		},
		// We always want to be in the site context when doing platform loads, NOT the workspace context
		site,
		sess,
	)
	if err != nil {
		return errors.New("Platform Load Failed:" + err.Error())
	}

	if len(loadResponse.Wires) != len(collections) {
		return errors.New("Bad thing happened - we need the same number of responses as collections")
	}

	for index, collection := range collections {
		// Turn the result map into a struct
		if err := collection.UnMarshal(loadResponse.Wires[index].Data); err != nil {
			return errors.New("Error in decoding: " + err.Error())
		}
	}

	return nil
}

// PlatformDelete function
func PlatformDelete(collectionID string, request map[string]reqs.DeleteRequest, site *metadata.Site, sess *session.Session) error {
	requests := []reqs.SaveRequest{{
		Wire:       "deleteRequest",
		Collection: "uesio." + collectionID,
		Deletes:    request,
	}}
	_, err := Save(
		SaveRequestBatch{
			Wires: requests,
		},
		// We always want to be in the site context when doing platform loads, NOT the workspace context
		site,
		sess,
	)

	return err
}

// PlatformSave function
func PlatformSave(psrs []PlatformSaveRequest, site *metadata.Site, sess *session.Session) ([]reqs.SaveResponse, error) {

	requests := []reqs.SaveRequest{}

	for _, psr := range psrs {
		collection := psr.Collection
		collectionName := collection.GetName()

		// Turn the user struct into a map string interface
		data, err := collection.Marshal()
		if err != nil {
			return nil, err
		}

		changeRequests := map[string]reqs.ChangeRequest{}

		for index, item := range data {
			changeRequests[strconv.Itoa(index)] = item
		}

		requests = append(requests, reqs.SaveRequest{
			Collection: "uesio." + collectionName,
			Wire:       "AnyKey",
			Changes:    changeRequests,
			Options:    psr.Options,
		})
	}

	saveResponse, err := Save(
		SaveRequestBatch{
			Wires: requests,
		},
		// We always want to be in the site context when doing platform loads, NOT the workspace context
		site,
		sess,
	)
	if err != nil {
		return nil, err
	}

	return saveResponse.Wires, nil
}

// LoadMetadataItem function
func LoadMetadataItem(item metadata.BundleableItem, site *metadata.Site, sess *session.Session) error {
	namespace := item.GetNamespace()
	// If we're in a workspace mode AND the namespace equals that workspace's app name
	if site.Workspace != nil && site.Workspace.AppRef == namespace {
		// 1. Make sure we're in a site that can read/modify workspaces
		if site.Name != "studio" {
			return errors.New("this site does not allow working with workspaces")
		}
		// 2. we should have a profile that allows modifying workspaces
		if !bundles.SessionHasPermission(site, sess, &metadata.PermissionSet{
			NamedRefs: map[string]bool{
				"workspace_admin": true,
			},
		}) {
			return errors.New("your profile does not allow you to work with workspaces")
		}
		// 3. TODO Check against the workspace profile (different than site profile)
		// to determine if the user has access to this workspace metadata item.

		return LoadWorkspaceMetadataItem(item, site, sess)
	}
	return bundles.Load(item, site, sess)
}

// LoadMetadataCollection function
func LoadMetadataCollection(group metadata.BundleableGroup, namespace string, conditions []reqs.LoadRequestCondition, site *metadata.Site, sess *session.Session) error {
	// Find all of the accessible namespaces
	if site.Workspace != nil && site.Workspace.AppRef == namespace {
		// 1. Make sure we're in a site that can read/modify workspaces
		if site.Name != "studio" {
			return errors.New("this site does not allow working with workspaces")
		}
		// 2. we should have a profile that allows modifying workspaces
		if !bundles.SessionHasPermission(site, sess, &metadata.PermissionSet{
			NamedRefs: map[string]bool{
				"workspace_admin": true,
			},
		}) {
			return errors.New("your profile does not allow you to work with workspaces")
		}
		// 3. TODO Check against the workspace profile (different than site profile)
		// to determine if the user has access to this workspace metadata item.
		// Get All of the metadata from the workspace
		return LoadWorkspaceMetadataCollection(group, conditions, site, sess)

		// TODO: Get All the metadata from the dependencies (right now workspaces don't have dependencies)
	}
	// Get All the metadata from the site and its dependencies
	err := bundles.LoadAll(group, namespace, site, sess)
	if err != nil {
		return err
	}

	return nil
}

// LoadWorkspaceMetadataItem function
func LoadWorkspaceMetadataItem(item metadata.CollectionableItem, site *metadata.Site, sess *session.Session) error {
	group := item.GetCollection()
	conditions, err := item.GetConditions()
	if err != nil {
		return err
	}
	// Add the workspace id as a condition
	conditions = append(conditions, reqs.LoadRequestCondition{
		Field: "uesio.workspaceid",
		Value: site.Workspace.ID,
	})
	err = PlatformLoad(
		[]metadata.CollectionableGroup{
			group,
		},
		[]reqs.LoadRequest{
			reqs.NewPlatformLoadRequest(
				"itemWire",
				group.GetName(),
				group.GetFields(),
				conditions,
			),
		},
		site,
		sess,
	)
	if err != nil {
		return err
	}

	length := reflect.Indirect(reflect.ValueOf(group)).Len()

	if length == 0 {
		return errors.New("Couldn't find item for platform load: " + item.GetKey())
	}
	if length > 1 {
		return errors.New("Duplicate items found: " + item.GetKey())
	}

	err = copier.Copy(item, group.GetItem(0))
	if err != nil {
		return err
	}

	item.SetNamespace(site.Workspace.AppRef)

	return nil
}

// LoadWorkspaceMetadataCollection function
func LoadWorkspaceMetadataCollection(group metadata.CollectionableGroup, conditions []reqs.LoadRequestCondition, site *metadata.Site, sess *session.Session) error {
	// Add the workspace id as a condition
	if conditions == nil {
		conditions = []reqs.LoadRequestCondition{}
	}
	conditions = append(conditions, reqs.LoadRequestCondition{
		Field: "uesio.workspaceid",
		Value: site.Workspace.ID,
	})
	err := PlatformLoad(
		[]metadata.CollectionableGroup{
			group,
		},
		[]reqs.LoadRequest{
			reqs.NewPlatformLoadRequest(
				"itemWire",
				group.GetName(),
				group.GetFields(),
				conditions,
			),
		},
		site,
		sess,
	)
	if err != nil {
		return err
	}
	length := reflect.Indirect(reflect.ValueOf(group)).Len()

	for i := 0; i < length; i++ {
		item := group.GetItem(i)
		item.SetNamespace(site.Workspace.AppRef)
	}
	return nil
}
