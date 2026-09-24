"""Reconcile generated publication pages with the BibTeX source."""

import re
import subprocess
import sys
import tempfile
from pathlib import Path


PUBLISH_DATE = re.compile(rb"(?m)^publishDate: .*$")
GENERATED_FILES = ("index.md", "cite.bib")


def generated_entries(directory: Path) -> dict[str, Path]:
    return {
        entry.name: entry
        for entry in directory.iterdir()
        if entry.is_dir() and all((entry / name).is_file() for name in GENERATED_FILES)
    }


def sync(imported: Path, destination: Path) -> None:
    new_entries = generated_entries(imported)
    if not new_entries:
        raise RuntimeError("Import produced no publication pages; refusing to remove existing pages")

    destination.mkdir(parents=True, exist_ok=True)
    old_entries = generated_entries(destination)
    for slug, source in new_entries.items():
        target = destination / slug
        target.mkdir(exist_ok=True)
        for name in GENERATED_FILES:
            content = (source / name).read_bytes()
            target_file = target / name
            if name == "index.md" and target_file.is_file():
                previous_date = PUBLISH_DATE.search(target_file.read_bytes())
                if previous_date:
                    content = PUBLISH_DATE.sub(lambda _: previous_date.group(), content, count=1)
            if not target_file.is_file() or target_file.read_bytes() != content:
                target_file.write_bytes(content)

    for slug in old_entries.keys() - new_entries.keys():
        target = destination / slug
        for name in GENERATED_FILES:
            (target / name).unlink()
        if not any(target.iterdir()):
            target.rmdir()


def main() -> None:
    source = Path(sys.argv[1])
    destination = Path(sys.argv[2])
    with tempfile.TemporaryDirectory() as temporary:
        imported = Path(temporary)
        subprocess.run(["academic", "import", str(source), str(imported), "--compact"], check=True)
        sync(imported, destination)


if __name__ == "__main__":
    main()
