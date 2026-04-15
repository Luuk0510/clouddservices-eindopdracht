#!/bin/sh
set -eu

docker build -t photo-prestige:swarm ./photo-prestige
docker build -t auth-service:swarm ./auth-service
docker build -t target-service:swarm ./target-service
docker build -t register-service:swarm ./register-service
docker build -t score-service:swarm ./score-service
docker build -t clock-service:swarm ./clock-service
docker build -t mail-service:swarm ./mail-service
docker build -t read-service:swarm ./read-service
