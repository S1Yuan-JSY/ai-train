FROM python:3.13-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1 LANGSMITH_TRACING=false
WORKDIR /app
COPY backend/requirements.lock.txt /app/requirements.lock.txt
RUN pip install --no-cache-dir -r requirements.lock.txt \
    && useradd --uid 10001 --create-home appuser \
    && mkdir -p /app/backend/data && chown -R appuser:appuser /app
COPY --chown=appuser:appuser backend /app/backend
COPY --chown=appuser:appuser frontend/public /app/frontend/public
COPY --chown=appuser:appuser knowledge /app/knowledge
USER appuser
EXPOSE 8787
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8787/health',timeout=3)"
CMD ["python", "-m", "uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8787", "--proxy-headers", "--forwarded-allow-ips", "*", "--no-access-log"]
