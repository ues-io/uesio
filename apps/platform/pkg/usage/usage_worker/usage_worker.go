package usage_worker

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/usage"
)

func UsageWorkerNoContext() error {
	return UsageWorker(context.Background())
}

func UsageWorker(ctx context.Context) error {

	slog.InfoContext(ctx, "Running usage worker job")

	session, err := auth.GetStudioSystemSession(ctx, nil)
	if err != nil {
		return fmt.Errorf("unable to obtain a system session to use for usage events job: %w", err)
	}

	err = usage.ApplyBatch(session)
	if err != nil {
		return err
	}

	slog.InfoContext(ctx, "Usage job completed, no issues found")
	return nil
}
