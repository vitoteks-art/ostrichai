import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import List

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from ..auth.dependencies import get_current_user
from ..models import User

router = APIRouter(tags=["Video Editing"])


def _ensure_ffmpeg_available() -> None:
    if shutil.which("ffmpeg") is None:
        raise HTTPException(status_code=500, detail="ffmpeg is not available on the server")


def _run_ffmpeg(args: List[str]) -> None:
    try:
        subprocess.run(args, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    except subprocess.CalledProcessError as exc:
        detail = exc.stderr.decode("utf-8", errors="replace")[:2000]
        raise HTTPException(status_code=400, detail=f"ffmpeg failed: {detail}") from exc


def _save_upload(upload: UploadFile, dest: Path) -> None:
    with dest.open("wb") as handle:
        shutil.copyfileobj(upload.file, handle)


def _build_output_name(base: str, suffix: str) -> str:
    safe_base = base or "output"
    if not suffix:
        suffix = ".mp4"
    return f"{safe_base}{suffix}"


@router.post("/concat")
async def concat_videos(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user),
):
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="Provide at least two files to concatenate")

    _ensure_ffmpeg_available()

    tmp_dir = tempfile.mkdtemp(prefix="video_concat_")
    if background_tasks:
        background_tasks.add_task(shutil.rmtree, tmp_dir, ignore_errors=True)

    tmp_path = Path(tmp_dir)
    input_paths = []
    for idx, upload in enumerate(files):
        suffix = Path(upload.filename or "").suffix or ".mp4"
        input_path = tmp_path / f"input_{idx}{suffix}"
        _save_upload(upload, input_path)
        input_paths.append(input_path)

    concat_list = tmp_path / "concat.txt"
    concat_list.write_text(
        "\n".join([f"file '{p.as_posix()}'" for p in input_paths]),
        encoding="utf-8",
    )

    output_suffix = input_paths[0].suffix or ".mp4"
    output_path = tmp_path / _build_output_name("concat", output_suffix)

    _run_ffmpeg(
        [
            "ffmpeg",
            "-y",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            str(concat_list),
            "-c",
            "copy",
            str(output_path),
        ]
    )

    return FileResponse(
        output_path,
        media_type="application/octet-stream",
        filename=output_path.name,
        background=background_tasks,
    )


@router.post("/trim")
async def trim_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    keep_json: str = Form(...),
    current_user: User = Depends(get_current_user),
):
    _ensure_ffmpeg_available()

    try:
        segments = json.loads(keep_json)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=400, detail="keep_json must be valid JSON") from exc

    if not isinstance(segments, list) or not segments:
        raise HTTPException(status_code=400, detail="keep_json must be a non-empty list of segments")

    tmp_dir = tempfile.mkdtemp(prefix="video_trim_")
    if background_tasks:
        background_tasks.add_task(shutil.rmtree, tmp_dir, ignore_errors=True)

    tmp_path = Path(tmp_dir)
    input_suffix = Path(file.filename or "").suffix or ".mp4"
    input_path = tmp_path / f"input{input_suffix}"
    _save_upload(file, input_path)

    part_paths = []
    for idx, segment in enumerate(segments):
        if not isinstance(segment, dict):
            raise HTTPException(status_code=400, detail="Each segment must be an object with start/end")
        start = segment.get("start")
        end = segment.get("end")
        if start is None or end is None:
            raise HTTPException(status_code=400, detail="Each segment must include start and end")
        if float(start) < 0 or float(end) <= float(start):
            raise HTTPException(status_code=400, detail="Segments must have end > start >= 0")

        part_path = tmp_path / f"part_{idx}{input_suffix}"
        _run_ffmpeg(
            [
                "ffmpeg",
                "-y",
                "-ss",
                str(start),
                "-to",
                str(end),
                "-i",
                str(input_path),
                "-c",
                "copy",
                "-avoid_negative_ts",
                "1",
                "-reset_timestamps",
                "1",
                str(part_path),
            ]
        )
        part_paths.append(part_path)

    if len(part_paths) == 1:
        output_path = part_paths[0]
    else:
        concat_list = tmp_path / "concat.txt"
        concat_list.write_text(
            "\n".join([f"file '{p.as_posix()}'" for p in part_paths]),
            encoding="utf-8",
        )
        output_path = tmp_path / _build_output_name("trimmed", input_suffix)
        _run_ffmpeg(
            [
                "ffmpeg",
                "-y",
                "-f",
                "concat",
                "-safe",
                "0",
                "-i",
                str(concat_list),
                "-c",
                "copy",
                str(output_path),
            ]
        )

    return FileResponse(
        output_path,
        media_type="application/octet-stream",
        filename=output_path.name,
        background=background_tasks,
    )
