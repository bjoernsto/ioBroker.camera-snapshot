# ioBroker.camera-snapshot

![Logo](admin/camera-snapshot.png)

[![NPM version](https://img.shields.io/npm/v/iobroker.camera-snapshot.svg)](https://www.npmjs.com/package/iobroker.camera-snapshot)
[![Downloads](https://img.shields.io/npm/dm/iobroker.camera-snapshot.svg)](https://www.npmjs.com/package/iobroker.camera-snapshot)
[![Known Vulnerabilities](https://snyk.io/test/github/YOUR-GITHUB-USERNAME/ioBroker.camera-snapshot/badge.svg)](https://snyk.io/test/github/YOUR-GITHUB-USERNAME/ioBroker.camera-snapshot)
[![License](https://img.shields.io/github/license/YOUR-GITHUB-USERNAME/ioBroker.camera-snapshot)](https://github.com/YOUR-GITHUB-USERNAME/ioBroker.camera-snapshot/blob/master/LICENSE)
[![Donate](https://img.shields.io/badge/donate-paypal-blue.svg)](https://www.paypal.com/paypalme/YOUR-PAYPAL-ACCOUNT-ID)

## ioBroker Adapter für Kamera-Snapshots

Dieser ioBroker Adapter ermöglicht das periodische Abrufen und Speichern von Standbildern (Snapshots) von Überwachungskameras, insbesondere von Ring- und Tapo-Kameras, ohne dabei die bewegungsbasierte Aufzeichnung der Kamera-Cloud zu stören. Das Problem bei vielen Kameras wie Ring oder Tapo ist, dass ein permanenter Live-Stream die eigentliche Funktion der Kamera, nur Bewegungen aufzuzeichnen, zunichtemachen kann. Dieser Adapter umgeht dies, indem er Snapshots in konfigurierbaren Intervallen abruft.

## Funktionen

*   **Periodische Snapshots**: Konfigurierbare Intervalle für den Abruf von Standbildern.
*   **Unterstützung für Ring-Kameras**: Integration über die `ring-client-api`.
*   **Unterstützung für Tapo- und generische RTSP-Kameras**: Abruf von Snapshots über RTSP-Streams mittels `ffmpeg`.
*   **Speicherung**: Snapshots werden lokal im ioBroker-Datenverzeichnis gespeichert.
*   **Manuelle Auslösung**: Möglichkeit, Snapshots manuell über einen ioBroker-State auszulösen.

## Unterstützte Kameras

### Ring-Kameras

Der Adapter nutzt die `ring-client-api` zur Kommunikation mit Ring-Geräten. Es ist wichtig zu beachten, dass batteriebetriebene Ring-Kameras Einschränkungen beim Snapshot-Abruf haben können. Sie können in der Regel keine Snapshots aufnehmen, während sie ein Video aufzeichnen. Der Adapter versucht, diese Einschränkung zu umgehen, indem er das zuletzt verfügbare Bild abruft, ohne einen Live-Stream zu initiieren, der die Bewegungserkennung beeinträchtigen könnte.

Für die Konfiguration ist ein Ring Refresh Token erforderlich. Dieser kann über das `ring-client-api` Tool generiert werden (siehe Installation).

### Tapo- und generische RTSP-Kameras

Für Tapo-Kameras und andere Kameras, die einen RTSP-Stream anbieten, extrahiert der Adapter ein einzelnes Frame aus dem RTSP-Stream mittels `ffmpeg`. Dies stellt sicher, dass kein permanenter Stream aufgebaut wird und die Kamera nicht unnötig belastet wird oder ihre Bewegungserkennung beeinträchtigt wird.

Es wird die vollständige RTSP-URL benötigt, z.B. `rtsp://username:password@IP:554/stream1`.

## Installation

Der Adapter befindet sich derzeit in der Entwicklung und ist noch nicht über das offizielle ioBroker Repository verfügbar. Sie können ihn manuell installieren:

1.  **Von GitHub (empfohlen für Entwickler)**:
    *   Öffnen Sie die ioBroker Admin-Oberfläche.
    *   Gehen Sie zum Reiter "Adapter" und klicken Sie auf das GitHub-Symbol (Katze).
    *   Wählen Sie "Beliebig" und geben Sie die URL Ihres GitHub-Repositories ein (z.B. `https://github.com/YOUR-GITHUB-USERNAME/ioBroker.camera-snapshot`).
    *   Klicken Sie auf "Installieren".

2.  **Manuell aus ZIP-Datei**:
    *   Laden Sie die ZIP-Datei des Adapters von Ihrem GitHub-Release-Bereich herunter.
    *   Navigieren Sie in ioBroker zu "Adapter" und klicken Sie auf das "Installieren aus eigener URL"-Symbol (das mit dem Pluszeichen).
    *   Wählen Sie die heruntergeladene ZIP-Datei aus und klicken Sie auf "Installieren".

### Ring Refresh Token generieren

Um den Ring Refresh Token zu erhalten, müssen Sie `ring-client-api` global installieren und den Authentifizierungsprozess durchlaufen:

```bash
npm install -g ring-client-api
npx ring-client-api auth
```

Folgen Sie den Anweisungen im Terminal, um den Token zu erhalten. Dieser Token muss dann in den Adapter-Einstellungen hinterlegt werden.

## Konfiguration

Nach der Installation können Sie den Adapter in den ioBroker-Instanzen konfigurieren:

1.  **Ring Refresh Token**: Geben Sie hier den generierten Ring Refresh Token ein.
2.  **Kameras**: Fügen Sie jede Kamera hinzu, die Sie überwachen möchten:
    *   **Camera Name**: Ein eindeutiger Name für die Kamera in ioBroker.
    *   **Type**: Wählen Sie `Ring`, `Tapo (RTSP)` oder `Generic RTSP`.
    *   **Interval (s)**: Das Intervall in Sekunden, in dem Snapshots abgerufen werden sollen (Standard: 60 Sekunden).
    *   **RTSP URL (Tapo/RTSP)**: Für Tapo- und generische RTSP-Kameras die vollständige RTSP-URL.
    *   **Ring Name/ID**: Für Ring-Kameras der Name oder die ID der Kamera, wie sie in der Ring-App angezeigt wird.

## Verwendung

Nach erfolgreicher Konfiguration und Start des Adapters werden unter den Objekten für jede konfigurierte Kamera folgende States erstellt:

*   `camera-snapshot.0.YOUR_CAMERA_NAME.snapshot`: Enthält den Dateipfad zum zuletzt gespeicherten Snapshot auf dem ioBroker-System.
*   `camera-snapshot.0.YOUR_CAMERA_NAME.trigger`: Ein Boolean-State, der bei `true` einen sofortigen Snapshot auslöst. Nach dem Auslösen wird der State automatisch auf `false` zurückgesetzt.

Sie können diese States in Ihren ioBroker-Visualisierungen oder Skripten verwenden, um die Snapshots anzuzeigen oder weitere Aktionen auszulösen.

## Entwicklung

Dieser Adapter wurde mit TypeScript entwickelt. Für die Entwicklung und zum Testen können Sie das ioBroker Adapter Template verwenden.

## Lizenz

[MIT License](LICENSE)

Copyright (c) 2026 Manus AI
