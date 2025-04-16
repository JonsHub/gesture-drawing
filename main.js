let video;
let handPose;
let hands = [];
let painting;
let px, py = null;
let drawMode = "normal"; // Modi: Normal, Speed, Chaos 
let strokeColor = ["orange"];
let saveCounter = 0;

function preload() {
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  createCanvas(1920, 1080);
  painting = createGraphics(1920, 1080);
  painting.clear();

  video = createCapture(VIDEO, { flipped: true });
  video.hide();

  handPose.detectStart(video, gotHands);

  // Buttons für Modusmodul
  createButton("Malen").position(10, 500).mousePressed(() => drawMode = "normal");
  createButton("Speed-Modus").position(100, 500).mousePressed(() => drawMode = "speed");
  createButton("Chaos").position(250, 500).mousePressed(() => drawMode = "chaos");
  createButton("Neu").position(400, 500).mousePressed(clearCanvas);

  // Autospeicherung alle 45 Sekunden
  setInterval(autoSave, 45000);
}

function gotHands(results) {
  hands = results;
}

function draw() {
  image(video, 0, 0);

  // Modus-HUD
  fill(255);
  textSize(20);
  text(`Modus: ${drawMode}`, 10, 30);

  // Prüfen, ob eine linke Hand existiert
  let leftHandDetected = hands.some(hand => hand.handedness === "Left");

  if (leftHandDetected) {
    px = null;  // Wenn linke Hand erkannt wurde, setzen wir px und py auf null
    py = null;
  }

  for (let hand of hands) {
    if (hand.handedness === "Right" && hand.index_finger_tip && hand.confidence > 0.8) {
      let x = hand.index_finger_tip.x;
      let y = hand.index_finger_tip.y;

      if (!leftHandDetected) { // Nur malen, wenn linke Hand nicht da ist
        if (px !== null && py !== null) { // Nur zeichnen, wenn px und py definiert sind
          if (drawMode === "normal") {
            painting.strokeWeight(7);
            painting.stroke(strokeColor);
            painting.line(px, py, x, y);
          } 
          else if (drawMode === "speed") {
            let movementSpeed = dist(px, py, x, y);
            let thickness = map(movementSpeed, 0, 30, 1, 8);
            painting.strokeWeight(thickness);
            painting.stroke(strokeColor);
            painting.line(px, py, x, y);
          } 
          else if (drawMode === "chaos") {
            strokeColor = [random(255), random(255), random(255)];
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
          }
        }
      }

      px = x;
      py = y;
    }
  }

  image(painting, 0, 0);
}

function clearCanvas() {
  painting.clear();
}

function autoSave() {
  let timestamp = int(millis() / 1000); // Zeitstempel in Sekunden
  save(painting, `drawing_${timestamp}_${saveCounter}.png`);
  saveCanvas(`canvas_${timestamp}_${saveCounter}`, 'png');
  saveCounter++;
}