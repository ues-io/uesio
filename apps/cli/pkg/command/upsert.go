package command

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"

	"github.com/thecloudmasters/cli/pkg/auth"
	"github.com/thecloudmasters/cli/pkg/call"
	"github.com/thecloudmasters/cli/pkg/config"
	"github.com/thecloudmasters/cli/pkg/config/siteadmin"
	"github.com/thecloudmasters/cli/pkg/config/ws"
	"github.com/thecloudmasters/cli/pkg/zip"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/bulk"
)

type UpsertOptions struct {
	SpecFile   string
	DataFile   string
	Collection string
}

func getUrlPrefix(tenantType, app, tenant string) string {
	return fmt.Sprintf("%s/%s/%s", tenantType, app, tenant)
}

func createJob(prefix, sessionID string, spec *meta.JobSpecRequest) (*bulk.JobResponse, error) {
	url := fmt.Sprintf("%s/bulk/job", prefix)
	jobResponse := &bulk.JobResponse{}

	err := call.PostJSON(url, sessionID, spec, jobResponse, nil)
	if err != nil {
		return nil, err
	}

	fmt.Println("Created Job: " + jobResponse.ID)
	return jobResponse, nil
}

func getImportPayload(jobType, dataFile string) (io.Reader, error) {
	if jobType == "IMPORT" {
		return os.Open(dataFile)
	}
	if jobType == "UPLOADFILES" {
		return zip.ZipDir(dataFile), nil
	}
	return nil, fmt.Errorf("invalid job type: %s", jobType)
}

func runBatch(prefix, sessionID, dataFile, jobID string, spec *meta.JobSpecRequest) (*bulk.BatchResponse, error) {
	payload, err := getImportPayload(spec.JobType, dataFile)
	if err != nil {
		return nil, err
	}

	fmt.Println("Upserting...", dataFile)

	url := fmt.Sprintf("%s/bulk/job/%s/batch", prefix, jobID)

	resp, err := call.Post(url, payload, sessionID, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	batchResponse := &bulk.BatchResponse{}

	err = json.NewDecoder(resp.Body).Decode(batchResponse)
	if err != nil {
		return nil, err
	}

	fmt.Println("Upsert Success: " + resp.Status)

	return batchResponse, nil
}

func getSpec(options *UpsertOptions) (*meta.JobSpecRequest, error) {
	spec := &meta.JobSpecRequest{}

	if options.SpecFile != "" {
		f, err := os.Open(options.SpecFile)
		if err != nil {
			return nil, err
		}
		err = json.NewDecoder(f).Decode(spec)
		if err != nil {
			return nil, err
		}
	} else {
		spec.JobType = "IMPORT"
	}

	if options.Collection != "" {
		spec.Collection = options.Collection
	}

	if spec.Collection == "" {
		return nil, errors.New("no collection specified")
	}

	if spec.JobType == "IMPORT" {

		if spec.FileType == "" {
			spec.FileType = "CSV"
		}
	}
	return spec, nil
}

func UpsertToWorkspace(options *UpsertOptions) error {

	_, err := auth.Login()
	if err != nil {
		return err
	}

	app, err := config.GetApp()
	if err != nil {
		return err
	}

	workspace, err := ws.GetWorkspace()
	if err != nil {
		return err
	}

	if workspace == "" {
		return errors.New("no active workspace is set -- use \"uesio work\" to set one")
	}

	return Upsert(getUrlPrefix("workspace", app, workspace), options)
}

func UpsertToSite(options *UpsertOptions) error {

	_, err := auth.Login()
	if err != nil {
		return err
	}

	app, err := config.GetApp()
	if err != nil {
		return err
	}

	site, err := siteadmin.GetSiteAdmin()
	if err != nil {
		return err
	}

	if site == "" {
		return errors.New("no active site is set -- use \"uesio siteadmin\" to set one")
	}

	return Upsert(getUrlPrefix("siteadmin", app, site), options)
}

func Upsert(prefix string, options *UpsertOptions) error {

	if options == nil {
		options = &UpsertOptions{}
	}

	if options.DataFile == "" {
		return errors.New("no data file specified")
	}

	fmt.Println("Running Upsert Command")

	token, err := config.GetToken()
	if err != nil {
		return err
	}

	spec, err := getSpec(options)
	if err != nil {
		return err
	}

	jobResponse, err := createJob(prefix, token, spec)
	if err != nil {
		return err
	}

	batchResponse, err := runBatch(prefix, token, options.DataFile, jobResponse.ID, spec)
	if err != nil {
		return err
	}

	fmt.Println("Success Running Batch: " + batchResponse.ID)

	return nil
}
