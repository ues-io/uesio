package middleware

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"log/slog"

	"github.com/fatih/color"
)

// DevLogHandler provides a colored textual log handler
// for use in local development
type DevLogHandler struct {
	slog.Handler
	l *log.Logger
}

func (h *DevLogHandler) Handle(ctx context.Context, r slog.Record) error {
	level := r.Level.String() + ":"

	switch r.Level {
	case slog.LevelDebug:
		level = color.MagentaString(level)
	case slog.LevelInfo:
		level = color.BlueString(level)
	case slog.LevelWarn:
		level = color.YellowString(level)
	case slog.LevelError:
		level = color.RedString(level)
	}

	fields := make(map[string]interface{}, r.NumAttrs())
	r.Attrs(func(a slog.Attr) bool {
		fields[a.Key] = a.Value.Any()

		return true
	})

	b, err := json.MarshalIndent(fields, "", "  ")
	if err != nil {
		return err
	}

	timeStr := r.Time.Format("[15:05:05.000]")
	msg := color.CyanString(r.Message)

	h.l.Println(timeStr, level, msg, color.WhiteString(string(b)))
	/*

		size := color.BlueString(byteCountDecimal(m.Written))
		duration := m.Duration.Round(time.Millisecond)
		timestamp := time.Now().Format(time.Kitchen)
		code := getColoredResponseCode(m.Code)
		site := color.CyanString(session.GetSite().GetFullName())
		user := color.MagentaString(session.GetContextUser().UniqueKey)
		log.Printf("[%v] %-4s %-32s %s %5s %16s %s %s\n", timestamp, method, uri, code, duration, size, site, user)
	*/

	return nil
}

func NewDevLogHandler(
	out io.Writer,
	opts *slog.HandlerOptions,
) *DevLogHandler {
	return &DevLogHandler{
		Handler: slog.NewJSONHandler(out, opts),
		l:       log.New(out, "", 0),
	}
}

func byteCountDecimal(b int64) string {
	const unit = 1000
	if b < unit {
		return fmt.Sprintf("%dB", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f%cB", float64(b)/float64(div), "kMGTPE"[exp])
}

func getColoredResponseCode(code int) string {
	if code == 200 {
		return color.GreenString("%d", code)
	}
	return color.RedString("%d", code)
}
