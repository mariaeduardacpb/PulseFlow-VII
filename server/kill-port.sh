#!/bin/bash

# Script para matar processo na porta 65432
PORT=65432

# Encontrar e matar processo na porta
PID=$(lsof -ti:$PORT)

if [ ! -z "$PID" ]; then
  echo "🛑 Matando processo $PID na porta $PORT..."
  kill -9 $PID
  sleep 1
  echo "✅ Porta $PORT liberada!"
else
  echo "✅ Porta $PORT já está livre"
fi

