FROM python:3.11-slim

# poppler-utils is required by pdf2image (PDF -> page images)
RUN apt-get update && apt-get install -y --no-install-recommends \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# oemer downloads its model checkpoints on first use; baking that into the
# image avoids a slow cold start on the first real request.
RUN python -c "from oemer.ete import extract" || true

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
