#!/usr/bin/env bash
set -euo pipefail

BACKEND_IMAGE="${BACKEND_IMAGE:-safwax/pulse-note-backend:latest}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-safwax/pulse-note-frontend:latest}"

echo "==> Building and pushing backend image: ${BACKEND_IMAGE}"
docker build -t "${BACKEND_IMAGE}" -f ./server/Dockerfile ./server
docker push "${BACKEND_IMAGE}"

echo "==> Building and pushing frontend image: ${FRONTEND_IMAGE}"
docker build -t "${FRONTEND_IMAGE}" -f ./client/Dockerfile ./client
docker push "${FRONTEND_IMAGE}"

echo "==> All images built and pushed successfully."
