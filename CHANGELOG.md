# Changelog

All notable changes to Tablite are documented here. The release workflow turns
each `## <version>` section into the body of the matching GitHub release.

## 未发布

### Fixed

- **The file's encoding is now applied when saving.** Every edit used to be written
  back as UTF-8 regardless of the encoding selector, so editing an Excel-created
  GBK file turned Chinese text into mojibake (Excel could no longer read it).
- **The encoding is remembered per file**, so reopening a CSV no longer re-detects
  from scratch and silently drops your choice.
- **A UTF-8 byte order mark survives an edit** and no longer leaks into the first
  cell. Excel needs the BOM to open UTF-8 CSV correctly.
- Saving fails with a notice when the selected encoding cannot be used on the
  current platform, instead of writing mangled text.

### Added

- Encoding options now include UTF-8 with BOM, GBK, Windows-1252, Shift-JIS and
  UTF-16 LE, plus byte order mark detection when a file is opened.
- **Settings → Tablite → Default encoding for new CSV files**: set it to GBK (for
  Excel on Chinese Windows) or UTF-8 with BOM so files created by Tablite open
  correctly in Excel.
- Changing the encoding from the toolbar re-reads the file with the selected
  encoding, which repairs files whose charset was detected wrongly.
