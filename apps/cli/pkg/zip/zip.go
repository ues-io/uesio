package zip

import (
	"archive/zip"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func ZipDir(localPath string) io.Reader {
	// Set up the pipe to write data directly into the Reader.
	pr, pw := io.Pipe()
	// Write JSON-encoded data to the Writer end of the pipe.
	// Write in a separate concurrent goroutine, and remember
	// to Close the PipeWriter, to signal to the paired PipeReader
	// that we’re done writing.
	go func() {
		// Zip the current directory
		w := zip.NewWriter(pw)

		walker := func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}
			if info.IsDir() {
				return nil
			}
			file, err := os.Open(path)
			if err != nil {
				return err
			}
			defer file.Close()

			f, err := w.Create(filepath.ToSlash(strings.TrimPrefix(path, localPath+string(os.PathSeparator))))
			if err != nil {
				return err
			}

			_, err = io.Copy(f, file)
			if err != nil {
				return err
			}

			return nil
		}
		err := filepath.Walk(localPath, walker)
		if err != nil {
			fmt.Println("Error Zipping Bundle Dir: " + err.Error())
		}

		w.Close()
		pw.Close()
	}()
	return pr
}
