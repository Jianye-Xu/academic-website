import tempfile
import unittest
from pathlib import Path

from sync_publications import sync


class SyncPublicationsTest(unittest.TestCase):
    def test_updates_adds_and_removes_generated_pages(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            imported = root / "imported"
            destination = root / "publication"
            imported.mkdir()
            destination.mkdir()

            def page(parent, slug, title, date):
                directory = parent / slug
                directory.mkdir()
                (directory / "index.md").write_text(
                    f"---\ntitle: {title}\npublishDate: '{date}'\n---\n"
                )
                (directory / "cite.bib").write_text(f"@article{{{slug}, title={{{title}}}}}\n")
                return directory

            existing = page(destination, "revised", "Old title", "2025-04-14")
            (existing / "figure.png").write_bytes(b"image")
            page(destination, "removed", "Removed title", "2025-04-14")
            (destination / "_index.md").write_text("Publication listing\n")
            manual = destination / "manual"
            manual.mkdir()
            (manual / "index.md").write_text("Manually maintained\n")

            page(imported, "revised", "New title", "2026-09-24")
            page(imported, "added", "Added title", "2026-09-24")

            sync(imported, destination)
            self.assertIn("New title", (existing / "index.md").read_text())
            self.assertIn("2025-04-14", (existing / "index.md").read_text())
            self.assertIn("New title", (existing / "cite.bib").read_text())
            self.assertTrue((existing / "figure.png").is_file())
            self.assertTrue((destination / "added" / "index.md").is_file())
            self.assertFalse((destination / "removed").exists())
            self.assertTrue((manual / "index.md").is_file())
            self.assertTrue((destination / "_index.md").is_file())

            before = (existing / "index.md").read_bytes()
            sync(imported, destination)
            self.assertEqual(before, (existing / "index.md").read_bytes())

    def test_empty_import_does_not_delete_pages(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            imported = root / "imported"
            destination = root / "publication"
            imported.mkdir()
            page = destination / "existing"
            page.mkdir(parents=True)
            (page / "index.md").write_text("Existing\n")
            (page / "cite.bib").write_text("@article{existing}\n")

            with self.assertRaisesRegex(RuntimeError, "produced no publication pages"):
                sync(imported, destination)
            self.assertTrue((page / "index.md").is_file())


if __name__ == "__main__":
    unittest.main()
