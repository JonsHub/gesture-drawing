// === Globale Variablen ===
let video;                      // Videostream der Webcam
let handPose;                   // Handerkennungsmodell von ml5.js
let hands = [];                 // Aktuell erkannte Hände
let painting;                   // Unsichtbares Canvas zum Zeichnen
let px, py = null;              // Vorherige Fingerpositionen
let drawMode = "normal";        // Zeichenmodus: "normal", "speed" oder "chaos"
let strokeColor = ["orange"];   // Zeichenfarbe

// === Lädt das HandPose-Modell ===
function preload() {
  handPose = ml5.handPose({ flipped: true }); // Spiegelt Bild für Nutzerfreundlichkeit
}

// === Initialisierung ===
function setup() {
    // Setze Canvas und Video in ein zentriertes Container-Div
  let canvasContainer = createDiv().style('display', 'flex')
  .style('justify-content', 'center')
  .style('align-items', 'center')
  .style('height', '100vh'); // Volle Browserhöhe
  canvas.parent(canvasContainer);
  video.parent(canvasContainer);
  createCanvas(640, 480);                           // Hauptanzeigefläche
  painting = createGraphics(640, 480);              // Separates Canvas für Zeichnungen
  painting.clear();                                 // Zeichenfläche leeren (transparent)

  video = createCapture(VIDEO, { flipped: true });  // Webcam aktivieren, gespiegelt
  video.hide();                                     // Verstecken, wird manuell eingeblendet

  handPose.detectStart(video, gotHands);            // Startet Handerkennung

  // Buttons für Moduswahl und Steuerung
  createButton("Malen").position(10, 500).mousePressed(() => drawMode = "normal");
  createButton("Speed-Modus").position(100, 500).mousePressed(() => drawMode = "speed");
  createButton("Chaos").position(250, 500).mousePressed(() => drawMode = "chaos");
  createButton("Neu").position(400, 500).mousePressed(clearCanvas);

  // Alle 45 Sekunden automatisches Speichern
  setInterval(autoSave, 45000);
}

// === Callback für Handerkennung ===
function gotHands(results) {
  hands = results;  // Liste der aktuell erkannten Hände aktualisieren
}

// === Hauptzeichenfunktion ===
function draw() {
  image(video, 0, 0);  // Webcam-Anzeige

  // Prüft, ob linke Hand erkannt wird (als "Stop-Funktion")
  let leftHandDetected = hands.some(hand => hand.handedness === "Left");
  if (leftHandDetected) {
    px = null;
    py = null;
  }

  // Durchlauf aller erkannten Hände
  for (let hand of hands) {
    // Nur rechte Hand mit gültigem Zeigefinger wird verarbeitet
    if (hand.handedness === "Right" && hand.index_finger_tip && hand.confidence > 0.8) {
      let x = hand.index_finger_tip.x;
      let y = hand.index_finger_tip.y;

      // Nur zeichnen, wenn keine linke Hand erkannt wird
      if (!leftHandDetected && px !== null && py !== null) {
        switch (drawMode) {
          case "normal":
            painting.strokeWeight(7);
            painting.stroke(strokeColor);
            painting.line(px, py, x, y);
            break;

          case "speed":
            let movementSpeed = dist(px, py, x, y);         // Berechnet Bewegungsdistanz
            let thickness = map(movementSpeed, 0, 30, 1, 8); // Variable Strichdicke
            painting.strokeWeight(thickness);
            painting.stroke(strokeColor);
            painting.line(px, py, x, y);
            break;

          case "chaos":
            strokeColor = [random(255), random(255), random(255)]; // Zufallsfarbe
            let shape = random(["circle", "line", "rectangle"]);

            if (shape === "line") {
              painting.strokeWeight(random(1, 5));
              painting.stroke(strokeColor);
              painting.line(px, py, x, y);
            } else if (shape === "circle") {
              painting.fill(strokeColor);
              painting.noStroke();
              painting.ellipse(x, y, random(10, 30));
            } else if (shape === "rectangle") {
              painting.fill(strokeColor);
              painting.noStroke();
              painting.rect(x, y, random(10, 30), random(10, 30));
            }
            break;
        }
      }

      // Aktuelle Position wird zur neuen „alten“ Position
      px = x;
      py = y;
    }
  }

  // Gezeichnete Linie anzeigen
  image(painting, 0, 0);
}

// === Leert die Zeichenfläche ===
function clearCanvas() {
  painting.clear();
}

// === Speichert das aktuelle Bild als PNG ===
function autoSave() {
  let timestamp = int(millis() / 1000); // UNIX-Timestamp als Dateiname
  save(painting, `drawing_${timestamp}.png`);
}
