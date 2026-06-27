from PIL import Image, UnidentifiedImageError
from io import BytesIO
from fastapi import UploadFile, HTTPException
from app.core.logger import logger
from app.core.config import settings

async def validate_and_load_image(file: UploadFile) -> Image.Image:
    """
    Reads an UploadFile, checks size limits, and attempts to load it as a PIL Image.
    Raises HTTPException if validation fails.
    """
    # 1. Check content type
    if not file.content_type.startswith("image/"):
        logger.warning(f"Invalid file type uploaded: {file.content_type}")
        raise HTTPException(status_code=400, detail="File must be an image.")

    # 2. Read file contents and check size
    contents = await file.read()
    file_size_mb = len(contents) / (1024 * 1024)
    
    if file_size_mb > settings.MAX_IMAGE_SIZE_MB:
        logger.warning(f"Image too large: {file_size_mb:.2f}MB")
        raise HTTPException(
            status_code=400, 
            detail=f"Image size exceeds limit of {settings.MAX_IMAGE_SIZE_MB}MB."
        )

    # 3. Load into PIL
    try:
        image = Image.open(BytesIO(contents))
        image.verify() # Verify it's not a corrupted image
        
        # We need to reopen because verify() closes the file pointer in some PIL versions
        image = Image.open(BytesIO(contents))
        return image
    except UnidentifiedImageError:
        logger.warning("Uploaded file is not a valid image format.")
        raise HTTPException(status_code=400, detail="Invalid or corrupted image file.")
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal error while processing image.")
