let table;
let explosions = [];
let minYear, maxYear;
let yearSlider;
let selectedYear = 'ALL';
let selectedExplosion = null;

function preload() {
    table = loadTable('sipri-report-explosions.csv', 'csv', 'header');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    
    // Carica i dati dal CSV
    for (let i = 0; i < table.getRowCount(); i++) {
        let row = table.getRow(i);
        let year = parseInt(row.get('year') || row.get('Year'));
        if (isNaN(year)) continue;
        
        let yield_upper = parseFloat(row.get('yield_u'));
        let yield_lower = parseFloat(row.get('yield_1'));
        let yieldValue = (!isNaN(yield_upper) && yield_upper > 0) ? yield_upper : 
                         (!isNaN(yield_lower) && yield_lower > 0) ? yield_lower : 0;
        
        explosions.push({
            year: year,
            yield: yieldValue,
            country: row.get('country') || row.get('Country') || 'Unknown',
            purpose: row.get('purpose') || row.get('Purpose') || 'Unknown',
            name: row.get('name') || row.get('Name') || '',
            x: random(80, width - 80),
            y: random(120, height - 100),
            size: map(max(yieldValue, 1), 0, 5000, 4, 15, true)
        });
    }
    
    explosions.sort((a, b) => a.year - b.year);
    minYear = min(explosions.map(e => e.year));
    maxYear = max(explosions.map(e => e.year));
    createYearFilter();
}

function draw() {
    background(18, 18, 20);
    drawHeader();
    drawGrid();
    
    let filtered = selectedYear === 'ALL' ? explosions : explosions.filter(e => e.year === selectedYear);
    
    // Disegna le esplosioni
    for (let exp of filtered) {
        let col = getColorForYield(exp.yield);
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = col;
        fill(col);
        noStroke();
        circle(exp.x, exp.y, exp.size);
        drawingContext.shadowBlur = 0;
    }
    
    drawLegend();
    drawHoverInfo(filtered);
}

function drawHeader() {
    fill(255, 255, 255, 30);
    noStroke();
    rect(0, 0, width, 95);

    fill(255);
    noStroke();
    textFont('sans-serif');
    textSize(28);
    textAlign(LEFT, CENTER);
    text('NUCLEAR TESTS DATABASE', 30, 30);

    fill(255);
    textSize(16);
    text('Filter by Year:', 30, 70);

    let boxX = width - 320;
    let boxY = 15;
    let boxW = 280;
    let boxH = 60;

    push();
    noFill();
    stroke(255, 90);
    strokeWeight(2);
    rect(boxX, boxY + 3, boxW, boxH, 12);
    pop();

    push();
    fill(255);
    textSize(18);
    text('Discover more:', width - 300, 37);
    pop();

    push();
    fill(215, 166, 222);
    textSize(18);
    text('click to detonate a bomb', width - 300, 60);
    pop();
}


function drawGrid() {
    for (let x = 0; x < width; x += 50) line(x, 100, x, height);
    for (let y = 100; y < height; y += 50) line(0, y, width, y);
}

function drawLegend() {
    // TOTALE BOMBE (a sinistra)
    let count = selectedYear === 'ALL' ? explosions.length : explosions.filter(e => e.year === selectedYear).length;
    let tx = 30, ty = height - 70;
    
    fill(18, 18, 20, 250);
    rect(tx, ty, 180, 50, 5);
    
    fill(150, 150, 160);
    textSize(11);
    textAlign(LEFT, TOP);
    text('TOTAL EVENTS', tx + 15, ty + 12);
    fill(255);
    textSize(20);
    text(count, tx + 15, ty + 26);
    
    let boxX = width - 460;
    let boxY = height - 70;
    let boxW = 430;
    let boxH = 50;
    
    fill(18, 18, 20, 250);
    rect(boxX, boxY, boxW, boxH, 5);
    
    fill(255);
    textFont('sans-serif');
    textSize(9);
    textAlign(LEFT, TOP);
    text('YIELD (kilotons)', boxX + 15, boxY + 12);
    
    let ranges = [
        { range: '0-19 kt', color: '#dabfffff' },
        { range: '20 kt', color: '#cf83ffff' },
        { range: '21-150 kt', color: '#ff24f0ff' },
        { range: '151-4999 kt', color: '#d1009dff' },
        { range: '5000+ kt', color: '#760057ff' }
    ];
    
    textSize(8);
    let startX = boxX + 15;
    let startY = boxY + 30;
    let spacing = 80;
    
    for (let i = 0; i < ranges.length; i++) {
        let xPos = startX + (i * spacing);
        fill(ranges[i].color);
        noStroke();
        circle(xPos + 4, startY, 7);
        fill(200, 200, 210);
        textAlign(LEFT, CENTER);
        text(ranges[i].range, xPos + 12, startY);
    }
}

function drawHoverInfo(filtered) {
    let exp = selectedExplosion;
    
    if (!exp) {
        let closest = null, minDist = 30;
        for (let e of filtered) {
            let d = dist(mouseX, mouseY, e.x, e.y);
            if (d < minDist) { minDist = d; closest = e; }
        }
        exp = closest;
    }
    
    if (!exp) return;
    
    let pad = 15, lineH = 18, labelH = 12;
    let h = pad + (exp.name ? labelH + lineH + 8 : 0) + (labelH + lineH + 8) * 2 + pad;
    let w = 280, x = exp.x + 25, y = exp.y - h / 2;
    
    if (x + w > width - 10) x = exp.x - w - 25;
    if (y < 110) y = 110;
    if (y + h > height - 10) y = height - h - 10;
    
    fill(18, 18, 20, 245);
    rect(x, y, w, h, 8);
    
    fill(255);
    textFont('sans-serif');
    textAlign(LEFT, TOP);
    let infoY = y + pad;
    
    if (exp.name) {
        fill(200, 200, 200);
        textSize(9);
        text('NAME', x + pad, infoY);
        infoY += labelH;
        fill(255);
        textSize(13);
        text(exp.name, x + pad, infoY);
        infoY += lineH + 8;
    }
    
    fill(200, 200, 200);
    textSize(9);
    text('COUNTRY', x + pad, infoY);
    infoY += labelH;
    fill(255);
    textSize(13);
    text(exp.country, x + pad, infoY);
    infoY += lineH + 8;
    
    fill(200, 200, 200);
    textSize(9);
    text('PURPOSE', x + pad, infoY);
    infoY += labelH;
    fill(255);
    textSize(13);
    text(exp.purpose, x + pad, infoY);
    
    noFill();
    circle(exp.x, exp.y, exp.size + 8);
}

function getColorForYield(y) {
    if (y >= 0 && y <= 19) return color('#dabfffff');
    if (y === 20) return color('#cf83ffff');
    if (y >= 21 && y <= 150) return color('#ff24f0ff');
    if (y >= 151 && y <= 4999) return color('#d1009dff');
    if (y >= 5000) return color('#760057ff');
    return color('#dabfffff');
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    for (let exp of explosions) {
        exp.x = random(80, width - 80);
        exp.y = random(120, height - 100);
    }
    if (yearSlider) yearSlider.position(180, 55);
}

function createYearFilter() {
    yearSlider = createSelect();
    yearSlider.position(137, 59);
    yearSlider.style('font-family', 'sans-serif');
    yearSlider.style('font-size', '14px');
    yearSlider.style('padding', '5px 10px');
    yearSlider.style('background-color', '#121214');
    yearSlider.style('color', '#ffffff');
    yearSlider.style('border', '2px solid rgba(255, 255, 255, 0.3)');
    yearSlider.style('border-radius', '4px');
    yearSlider.style('cursor', 'pointer');
    
    yearSlider.option('ALL YEARS', 'ALL');
    let years = [...new Set(explosions.map(e => e.year))].sort((a, b) => a - b);
    for (let year of years) yearSlider.option(year.toString(), year);
    
    yearSlider.changed(() => {
        selectedYear = yearSlider.value() === 'ALL' ? 'ALL' : parseInt(yearSlider.value());
        selectedExplosion = null;
    });
}

function mousePressed() {
    let filtered = selectedYear === 'ALL' ? explosions : explosions.filter(e => e.year === selectedYear);
    
    let clicked = null, minDist = 30;
    for (let exp of filtered) {
        let d = dist(mouseX, mouseY, exp.x, exp.y);
        if (d < minDist && d < exp.size / 2 + 10) { 
            minDist = d; 
            clicked = exp; 
        }
    }
    
    if (clicked) {
        // Naviga alla seconda pagina quando si clicca su una bomba
        let params = new URLSearchParams({
            country: clicked.country,
            name: clicked.name,
            year: clicked.year,
            yield: clicked.yield
        });
        window.location.href = 'page.html?' + params.toString();
    } else {
        selectedExplosion = null;
    }
}