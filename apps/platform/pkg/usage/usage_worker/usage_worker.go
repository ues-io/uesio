package usage_worker

import (
	"context"
	"errors"
	"log/slog"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

func UsageWorkerNoContext() error {
	return UsageWorker(context.Background())
}

func UsageWorker(ctx context.Context) error {

	slog.Info("Running usage worker job")

	session, err := auth.GetStudioSystemSession(ctx, nil)
	if err != nil {
		return errors.New("Unable to obtain a system session to use for usage events job: " + err.Error())
	}

	err = usage.ApplyBatch(session)
	if err != nil {
		return err
	}

	slog.Info("Usage job completed, no issues found")
	return nil
}
