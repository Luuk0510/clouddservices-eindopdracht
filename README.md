# Photo Prestiges

## Het Concept
Een 'Target Owner' uploadt een foto met een specifieke locatie en een tijdslimiet. Deelnemers gaan de stad in om deze foto te reproduceren. Het systeem analyseert de inzendingen automatisch met behulp van AI-beeldherkenning en berekent een score gebaseerd op nauwkeurigheid en snelheid.

---

## Technische Architectuur (Cloud Services)
Deze applicatie is gebouwd volgens een **Microservices Architectuur** om schaalbaarheid en ontkoppeling te garanderen.

### De Services:
* **Identity Service:** Beheert gebruikers, registraties en authenticatie (JWT).
* **Target Service:** Beheert de "speurtochten" (locaties, deadlines en metadata).
* **Submission Service:** Verwerkt de foto-uploads van deelnemers.
* **Score Service:** Voert de AI-analyse uit via externe API's (Google Vision / Imagga) en berekent de winnaar.
* **Mail Service:** Verstuurt transactionele e-mails (bevestigingen, herinneringen en uitslagen).
* **Clock Service:** Monitort deadlines en triggert het afsluiten van wedstrijden.
* **Read Service:** Levert leesoverzichten, zoals een lijst van alle actieve wedstrijden.

### Cloud Stack & Tools:
* **Runtime:** Node.js met Express.js
* **Messaging:** RabbitMQ (voor asynchrone communicatie tussen services)
* **Databases:** MongoDB (voor Geospatial data) & PostgreSQL (voor relationele data)
* **Storage:** Cloud Object Storage (voor het hosten van afbeeldingen via URL)
* **Testing:** Postman

---

## Run met Docker

Start de app vanuit de root van het project:

```bash
docker compose up --build
```

De applicatie is daarna bereikbaar op:

```text
http://localhost:3000
```

Monitoring services:

```text
Prometheus: http://localhost:9090
Grafana: http://localhost:3001
```

Grafana standaard login:

```text
user: admin
password: admin123
```

Stoppen:

```bash
docker compose down
```

Scalen voorbeeld:
```bash
docker compose scale target-service=1
```
Admin seeder
```bash
docker compose run --rm auth-service npm run seed:owner
```


Monitoring stack starten (indien nog niet actief):

```bash
docker compose up -d prometheus blackbox-exporter grafana
```


---

## CI Status per Service

Elke service wordt automatisch gecontroleerd op **code guidelines (ESLint)** en **tests** bij elke push.

| Service | Status |
|---|---|
| auth-service | [![CI auth-service](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/node-ci.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/node-ci.yml) |
| clock-service | [![CI clock-service](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-clock-service.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-clock-service.yml) |
| mail-service | [![CI mail-service](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-mail-service.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-mail-service.yml) |
| photo-prestige | [![CI photo-prestige](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-photo-prestige.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-photo-prestige.yml) |
| read-service | [![CI read-service](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-read-service.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-read-service.yml) |
| register-service | [![CI register-service](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-register-service.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-register-service.yml) |
| score-service | [![CI score-service](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-score-service.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-score-service.yml) |
| target-service | [![CI target-service](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-target-service.yml/badge.svg)](https://github.com/Luuk0510/clouddservices-eindopdracht/actions/workflows/ci-target-service.yml) |
