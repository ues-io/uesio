package logger

import (
	"log/slog"
	"os"
)

func init() {
	handler := slog.NewJSONHandler(os.Stdout, nil)
	slog.SetDefault(slog.New(handler))
}
