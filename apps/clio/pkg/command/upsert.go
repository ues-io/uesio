package command

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"

	"github.com/thecloudmasters/clio/pkg/auth"
	"github.com/thecloudmasters/clio/pkg/call"
	"github.com/thecloudmasters/clio/pkg/config"
	"github.com/thecloudmasters/clio/pkg/config/ws"
	"github.com/thecloudmasters/clio/pkg/zip"
	"github.com/thecloudmasters/uesio/pkg/bulk"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

type UpsertOptions struct {
	SpecFile   string
	DataFile   string
	Collection string
}

func createJob(app, workspace, sessid string, spec *meta.JobSpec) (*bulk.JobResponse, error) {
	url := fmt.Sprintf("workspace/%s/%s/bulk/job", app, workspace)
	jobResponse := &bulk.JobResponse{}

	err := call.PostJSON(url, sessid, spec, jobResponse)
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
	return nil, errors.New("Invalid Job Type: " + jobType)
}

func runBatch(app, workspace, sessid, dataFile, jobID string, spec *meta.JobSpec) (*bulk.BatchResponse, error) {
	payload, err := getImportPayload(spec.JobType, dataFile)
	if err != nil {
		return nil, err
	}

	fmt.Println("Upserting...", dataFile)

	url := fmt.Sprintf("workspace/%s/%s/bulk/job/%s/batch", app, workspace, jobID)

	resp, err := call.Request("POST", url, payload, sessid)
	if err != nil {
		return nil, err
	}

	batchResponse := &bulk.BatchResponse{}

	err = json.NewDecoder(resp.Body).Decode(batchResponse)
	if err != nil {
		return nil, err
	}

	fmt.Println("Upsert Success: " + resp.Status)

	defer resp.Body.Close()
	return batchResponse, nil

}

func getSpec(options *UpsertOptions) (*meta.JobSpec, error) {
	spec := &meta.JobSpec{}

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
		return nil, errors.New("No collection specified")
	}

	if spec.JobType == "IMPORT" {

		if spec.FileType == "" {
			spec.FileType = "CSV"
		}
	}
	return spec, nil
}

func Upsert(options *UpsertOptions) error {

	if options == nil {
		options = &UpsertOptions{}
	}

	if options.DataFile == "" {
		return errors.New("No Data File Specified")
	}

	fmt.Println("Running Upsert Command")

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

	sessid, err := config.GetSessionID()
	if err != nil {
		return err
	}

	spec, err := getSpec(options)
	if err != nil {
		return err
	}

	jobResponse, err := createJob(app, workspace, sessid, spec)
	if err != nil {
		return err
	}

	batchResponse, err := runBatch(app, workspace, sessid, options.DataFile, jobResponse.ID, spec)
	if err != nil {
		return err
	}

	fmt.Println("Success Running Batch: " + batchResponse.ID)

	return nil
}
