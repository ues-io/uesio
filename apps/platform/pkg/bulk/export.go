package bulk

import (
	"archive/zip"
	"bytes"
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/filesource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/retrieve"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func NewExportBatch(ctx context.Context, job meta.BulkJob, session *sess.Session) (*meta.BulkBatch, error) {

	spec := job.Spec

	batch := meta.BulkBatch{
		Status:    "started",
		BulkJobID: job.ID,
	}

	err := datasource.PlatformSaveOne(ctx, &batch, nil, nil, session)
	if err != nil {
		return nil, err
	}

	tenantID := strings.ReplaceAll(session.GetTenantID(), "/", "_")
	fileName := strings.ReplaceAll(fmt.Sprintf("uesio_export_%s_%s.zip", tenantID, time.Now().Format(time.RFC3339)), ":", "_")

	buf := new(bytes.Buffer)

	// Create a new zip archive.
	zipwriter := zip.NewWriter(buf)

	zipfilecreate := retrieve.NewWriterCreator(zipwriter.Create)

	err = exportCollection(ctx, zipfilecreate, spec, session)
	if err != nil {
		return nil, err
	}

	err = exportFiles(ctx, zipfilecreate, spec, session)
	if err != nil {
		return nil, err
	}

	zipwriter.Close()

	_, err = filesource.Upload(ctx, []*filesource.FileUploadOp{
		{
			Data:         buf,
			Path:         fileName,
			CollectionID: "uesio/core.bulkbatch",
			RecordID:     batch.ID,
			FieldID:      "uesio/core.result",
		},
	}, nil, session, nil)
	if err != nil {
		return nil, err
	}

	// Now update the batch status
	batch.Status = "completed"
	batch.SetItemMeta(&meta.ItemMeta{
		ValidFields: map[string]bool{
			commonfields.Id:     true,
			"uesio/core.status": true,
		},
	})

	err = datasource.PlatformSaveOne(ctx, &batch, nil, nil, session)
	if err != nil {
		return nil, err
	}

	return &batch, nil
}
