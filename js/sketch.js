let img;
let cnv;

// Configuration
const GRID_COLS = 3;
const GRID_ROWS = 3;
const SPRING = 0.1;
const FRICTION = 0.85;
const IMPULSE = 300;

// State
let colSizes = [];
let rowSizes = [];
let colVels = [];
let rowVels = [];
let cellAlphas = []; // Store alpha values for 3x3 grid

// Face Region Settings (Relative to image size 0.0 - 1.0)
// Adjusted for a typical Mona Lisa composition
const FACE_REL_X = 0.325;
const FACE_REL_Y = 0.32;
const FACE_REL_W = 0.25; // Width of face area
const FACE_REL_H = 0.25; // Height of face area

// Current calculated dimensions
let faceX, faceY, faceW, faceH;
let baseColSize, baseRowSize;

function preload() {
    img = loadImage('assets/mona_lisa.png');
}

function setup() {
    // Calculate aspect ratio and fit to window
    let aspectRatio = img.width / img.height;
    let canvasHeight = min(windowHeight * 0.9, img.height);
    let canvasWidth = canvasHeight * aspectRatio;

    cnv = createCanvas(canvasWidth, canvasHeight);

    // Resize image to match canvas so we can map 1:1 easily
    img.resize(width, height);

    // Calculate face region in pixels
    faceX = width * FACE_REL_X;
    faceY = height * FACE_REL_Y;
    faceW = width * FACE_REL_W;
    faceH = height * FACE_REL_H;

    baseColSize = faceW / GRID_COLS;
    baseRowSize = faceH / GRID_ROWS;

    // Initialize sizes and velocities
    for (let i = 0; i < GRID_COLS; i++) {
        colSizes[i] = baseColSize;
        colVels[i] = 0;

        // Initialize alpha array
        cellAlphas[i] = [];
        for (let j = 0; j < GRID_ROWS; j++) {
            cellAlphas[i][j] = 0;
        }
    }
    for (let i = 0; i < GRID_ROWS; i++) {
        rowSizes[i] = baseRowSize;
        rowVels[i] = 0;
    }
}

function draw() {
    background(30);

    // 1. Draw the full background image (static)
    image(img, 0, 0, width, height);

    // 2. Update physics for the face grid
    updatePhysics();

    // 3. Draw the interactive grid overlaying the face
    drawGrid();
}

function updatePhysics() {
    let totalWidth = 0;
    let totalHeight = 0;

    // Update Columns
    for (let i = 0; i < GRID_COLS; i++) {
        let force = (baseColSize - colSizes[i]) * SPRING;
        colVels[i] += force;
        colVels[i] *= FRICTION;
        colSizes[i] += colVels[i];

        if (colSizes[i] < 1) colSizes[i] = 1; // Prevent negative/zero
        totalWidth += colSizes[i];
    }

    // Normalize columns to fit EXACTLY the face width
    let wScale = faceW / totalWidth;
    for (let i = 0; i < GRID_COLS; i++) {
        colSizes[i] *= wScale;
    }

    // Update Rows
    for (let i = 0; i < GRID_ROWS; i++) {
        let force = (baseRowSize - rowSizes[i]) * SPRING;
        rowVels[i] += force;
        rowVels[i] *= FRICTION;
        rowSizes[i] += rowVels[i];

        if (rowSizes[i] < 1) rowSizes[i] = 1;
        totalHeight += rowSizes[i];
    }

    // Normalize rows to fit EXACTLY the face height
    let hScale = faceH / totalHeight;
    for (let i = 0; i < GRID_ROWS; i++) {
        rowSizes[i] *= hScale;
    }
}

function drawGrid() {
    // Start drawing from the top-left of the FACE region
    let yPos = faceY;

    for (let r = 0; r < GRID_ROWS; r++) {
        let xPos = faceX;
        let h = rowSizes[r];

        for (let c = 0; c < GRID_COLS; c++) {
            let w = colSizes[c];

            // Source Mapping
            let sx = faceX + (c * faceW) / GRID_COLS;
            let sy = faceY + (r * faceH) / GRID_ROWS;
            let sw = faceW / GRID_COLS;
            let sh = faceH / GRID_ROWS;

            // Draw sub-image on top of background
            image(img, xPos, yPos, w, h, sx, sy, sw, sh);

            // --- RED FLASH EFFECT ---
            // Update alpha
            if (cellAlphas[c][r] > 0) {
                cellAlphas[c][r] -= 5; // Fade speed
                if (cellAlphas[c][r] < 0) cellAlphas[c][r] = 0;

                // Draw red overlay
                noStroke();
                fill(255, 0, 0, cellAlphas[c][r]);
                rect(xPos, yPos, w, h);
            }
            // ------------------------

            // Add thin white border
            noFill();
            stroke(255, 180); // Slightly transparent white
            strokeWeight(1);
            rect(xPos, yPos, w, h);

            // Draw Number Labels
            let num = 0;
            if (r === 0) num = 7 + c;
            else if (r === 1) num = 4 + c;
            else if (r === 2) num = 1 + c;

            fill(255, 200);
            noStroke();
            textAlign(LEFT, TOP);
            textSize(14);
            text(num, xPos + 5, yPos + 5);

            xPos += w;
        }
        yPos += h;
    }
}

function keyPressed() {
    let col = -1;
    let row = -1;

    // Key mapping for Numpad 1-9
    switch (key) {
        case '7': col = 0; row = 0; break;
        case '8': col = 1; row = 0; break;
        case '9': col = 2; row = 0; break;
        case '4': col = 0; row = 1; break;
        case '5': col = 1; row = 1; break;
        case '6': col = 2; row = 1; break;
        case '1': col = 0; row = 2; break;
        case '2': col = 1; row = 2; break;
        case '3': col = 2; row = 2; break;
    }

    // Fallback keys
    if (col === -1) {
        switch (key.toLowerCase()) {
            case 'q': col = 0; row = 0; break;
            case 'w': col = 1; row = 0; break;
            case 'e': col = 2; row = 0; break;
            case 'a': col = 0; row = 1; break;
            case 's': col = 1; row = 1; break;
            case 'd': col = 2; row = 1; break;
            case 'z': col = 0; row = 2; break;
            case 'x': col = 1; row = 2; break;
            case 'c': col = 2; row = 2; break;
        }
    }

    if (col !== -1 && row !== -1) {
        applyImpulse(col, row);
    }
}

function applyImpulse(c, r) {
    colVels[c] += IMPULSE;
    rowVels[r] += IMPULSE;

    // Trigger red flash (approx 50% opacity = 127/255)
    cellAlphas[c][r] = 127;
}

function windowResized() {
    location.reload();
}
