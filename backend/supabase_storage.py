"""
Supabase Storage helper module.
Handles uploading and deleting files (PDFs/images) directly to Supabase Storage buckets via REST API.
Automatically creates the target storage bucket if it doesn't exist yet.
"""
import os
import httpx
import logging

logger = logging.getLogger(__name__)

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
DEFAULT_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "medical-reports")


def ensure_bucket_exists(bucket: str = DEFAULT_BUCKET):
    """Ensures the Supabase Storage bucket exists by calling Supabase Bucket API."""
    if not SUPABASE_URL or not SUPABASE_KEY or "your-project" in SUPABASE_URL:
        return
    clean_url = SUPABASE_URL.rstrip("/")
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }
    try:
        get_res = httpx.get(f"{clean_url}/storage/v1/bucket/{bucket}", headers=headers, timeout=5.0)
        if get_res.status_code != 200:
            payload = {"id": bucket, "name": bucket, "public": True}
            httpx.post(f"{clean_url}/storage/v1/bucket", json=payload, headers=headers, timeout=5.0)
    except Exception as e:
        logger.warning(f"Could not check/create bucket '{bucket}': {e}")


def upload_file_to_supabase(
    file_bytes: bytes,
    filename: str,
    patient_id: str,
    bucket: str = DEFAULT_BUCKET,
    content_type: str = "application/pdf"
) -> dict:
    """
    Uploads a file to Supabase Storage under path: {patient_id}/{filename}.
    Returns a dict containing storage_path, storage_bucket, and public_url.
    """
    if not SUPABASE_URL or not SUPABASE_KEY or "your-project" in SUPABASE_URL:
        logger.warning("Supabase Storage credentials not configured. Returning local reference.")
        return {
            "storage_path": f"local/{patient_id}/{filename}",
            "storage_bucket": bucket,
            "public_url": None
        }

    ensure_bucket_exists(bucket)

    clean_url = SUPABASE_URL.rstrip("/")
    storage_path = f"{patient_id}/{filename}"
    upload_endpoint = f"{clean_url}/storage/v1/object/{bucket}/{storage_path}"

    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "apikey": SUPABASE_KEY,
        "Content-Type": content_type or "application/octet-stream",
        "x-upsert": "true"
    }

    try:
        response = httpx.post(upload_endpoint, content=file_bytes, headers=headers, timeout=30.0)
        if response.status_code in (200, 201):
            public_url = f"{clean_url}/storage/v1/object/public/{bucket}/{storage_path}"
            return {
                "storage_path": storage_path,
                "storage_bucket": bucket,
                "public_url": public_url
            }
        else:
            logger.warning(f"Supabase Storage upload returned status {response.status_code}: {response.text}")
            return {
                "storage_path": f"storage/{patient_id}/{filename}",
                "storage_bucket": bucket,
                "public_url": None
            }
    except Exception as e:
        logger.error(f"Error uploading to Supabase Storage: {e}")
        return {
            "storage_path": f"storage/{patient_id}/{filename}",
            "storage_bucket": bucket,
            "public_url": None
        }


def delete_patient_files_from_supabase(patient_id: str, storage_paths: list = None, bucket: str = DEFAULT_BUCKET):
    """
    Deletes all files associated with a patient from Supabase Storage bucket.
    """
    if not SUPABASE_URL or not SUPABASE_KEY or "your-project" in SUPABASE_URL:
        return

    clean_url = SUPABASE_URL.rstrip("/")
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json"
    }

    paths_to_delete = list(storage_paths or [])

    try:
        # Fetch file list from bucket under patient prefix if paths not explicitly supplied
        if not paths_to_delete:
            list_res = httpx.post(
                f"{clean_url}/storage/v1/object/list/{bucket}",
                json={"prefix": f"{patient_id}/", "limit": 100},
                headers=headers,
                timeout=10.0
            )
            if list_res.status_code == 200:
                files = list_res.json()
                paths_to_delete = [f"{patient_id}/{f['name']}" for f in files if isinstance(f, dict) and "name" in f]

        if paths_to_delete:
            rm_res = httpx.delete(
                f"{clean_url}/storage/v1/object/{bucket}",
                json={"prefixes": paths_to_delete},
                headers=headers,
                timeout=10.0
            )
            logger.info(f"Deleted files from Supabase Storage for patient {patient_id}: status {rm_res.status_code}")
    except Exception as e:
        logger.warning(f"Error deleting files from Supabase Storage for patient {patient_id}: {e}")
