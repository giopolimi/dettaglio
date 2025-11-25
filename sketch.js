let table;
let explosions = [];
let font;
let minYear, maxYear;
let yearSlider;
let selectedYear = 'ALL';

function preload() {
  table = loadTable('sipri-report-explosions.csv', 'csv', 'header');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  console.log('Righe totali:', table.getRowCount());
  console.log('Colonne:', table.columns);
  
  // Carica i dati dal CSV
  for (let i = 0; i < table.getRowCount(); i++) {
    let row = table.getRow(i);
    
    // Prova a ottenere year in diversi modi
    let year = row.get('year');
    if (!year || year === '') {
      year = row.get('Year');
    }
    year = parseInt(year);
    
    // Prova yield_upper e yield_1
    let yield_upper = parseFloat(row.get('yield_u'));
    let yield_lower = parseFloat(row.get('yield_1'));
    
    let country = row.get('country') || row.get('Country') || 'Unknown';
    let purpose = row.get('purpose') || row.get('Purpose') || 'Unknown';
    let name = row.get('name') || row.get('Name') || '';
    
    // Usa yield_upper se disponibile, altrimenti yield_lower
    let yieldValue = 0;
    if (!isNaN(yield_upper) && yield_upper > 0) {
      yieldValue = yield_upper;
    } else if (!isNaN(yield_lower) && yield_lower > 0) {
      yieldValue = yield_lower;
    }
    
    // Salta righe senza anno valido
    if (isNaN(year)) continue;
    
    explosions.push({
      year: year,
      yield: yieldValue,
      country: country,
      purpose: purpose,
      name: name,
      x: random(80, width - 80),
      y: random(120, height - 80),
      size: map(max(yieldValue, 1), 0, 5000, 4, 15, true)
    });
  }
  
  console.log('Esplosioni caricate:', explosions.length);
  
  // Trova anno min e max
  minYear = min(explosions.map(e => e.year));
  maxYear = max(explosions.map(e => e.year));
  
  console.log('Anno minimo:', minYear, 'Anno massimo:', maxYear);
  
  // Ordina per anno
  explosions.sort((a, b) => a.year - b.year);
  
  // Crea slider per filtrare per anno
  createYearFilter();
}

function draw() {
  background(18, 18, 20);
  
  // Header stile interfaccia computer
  drawHeader();
  
  // Griglia di sfondo
  drawGrid();
  
  // Filtra esplosioni per anno selezionato
  let filteredExplosions = explosions;
  if (selectedYear !== 'ALL') {
    filteredExplosions = explosions.filter(e => e.year === selectedYear);
  }
  
  // Disegna tutti i punti filtrati
  for (let exp of filteredExplosions) {
    let col = getColorForYield(exp.yield);
    
    // Effetto glow
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = col;
    
    fill(col);
    noStroke();
    circle(exp.x, exp.y, exp.size);
    
    drawingContext.shadowBlur = 0;
  }
  
  // Legenda
  drawLegend();
  
  // Info al passaggio del mouse
  drawHoverInfo(filteredExplosions);
}

function drawHeader() {
  fill(255, 255, 255, 30);
  noStroke();
  rect(0, 0, width, 100);
  
  // Linea separatore
  stroke(255, 255, 255, 100);
  strokeWeight(2);
  line(0, 100, width, 100);
  
  // Titolo
  noStroke();
  fill(255, 255, 255);
  textFont('sans-serif');
  textSize(28);
  textAlign(LEFT, CENTER);
  text('NUCLEAR TESTS DATABASE', 30, 30);
  
  // Info secondaria
  textSize(14);
  fill(150, 150, 160);
  let filteredCount = selectedYear === 'ALL' ? explosions.length : explosions.filter(e => e.year === selectedYear).length;
  text(`Total Events: ${filteredCount}`, width - 200, 30);
  
  // Label filtro anno
  fill(255, 255, 255);
  textSize(16);
  textAlign(LEFT, CENTER);
  text('Filter by Year:', 30, 70);
}

function drawGrid() {
  stroke(40, 40, 45);
  strokeWeight(1);
  
  // Linee verticali
  for (let x = 0; x < width; x += 50) {
    line(x, 100, x, height);
  }
  
  // Linee orizzontali
  for (let y = 100; y < height; y += 50) {
    line(0, y, width, y);
  }
}

function drawLegend() {
  let legendX = 30;
  let legendY = height - 120;
  
  // Box della legenda
  fill(18, 18, 20, 200);
  stroke(255, 255, 255, 100);
  strokeWeight(2);
  rect(legendX - 10, legendY - 10, 250, 110, 5);
  
  // Titolo legenda
  noStroke();
  fill(255, 255, 255);
  textFont('sans-serif');
  textSize(14);
  textAlign(LEFT, TOP);
  text('YIELD (kilotons)', legendX, legendY);
  
  // Categorie
  let yieldRanges = [
    { range: '0-19 kt', color: '#dabfffff' },
    { range: '20 kt', color: '#cf83ffff' },
    { range: '21-150 kt', color: '#ff24f0ff' },
    { range: '151-4999 kt', color: '#d1009dff' },
    { range: '5000+ kt', color: '#760057ff' }
  ];
  
  textSize(11);
  fill(200, 200, 210);
  
  for (let i = 0; i < yieldRanges.length; i++) {
    let yPos = legendY + 25 + (i * 15);
    
    // Pallino
    fill(yieldRanges[i].color);
    noStroke();
    circle(legendX + 5, yPos, 8);
    
    // Testo
    fill(200, 200, 210);
    textAlign(LEFT, CENTER);
    text(yieldRanges[i].range, legendX + 20, yPos);
  }
}

function drawHoverInfo(filteredExplosions) {
  // Trova l'esplosione più vicina al mouse
  let closest = null;
  let closestDist = 30; // Soglia di distanza
  
  for (let exp of filteredExplosions) {
    let d = dist(mouseX, mouseY, exp.x, exp.y);
    if (d < closestDist) {
      closestDist = d;
      closest = exp;
    }
  }
  
  if (closest) {
    // Box info
    let boxWidth = 250;
    let boxHeight = 110;
    let boxX = mouseX + 20;
    let boxY = mouseY - 60;
    
    // Mantieni il box nei bordi dello schermo
    if (boxX + boxWidth > width - 10) boxX = mouseX - boxWidth - 20;
    if (boxY < 70) boxY = 70;
    if (boxY + boxHeight > height - 10) boxY = height - boxHeight - 10;
    
    // Disegna box
    fill(18, 18, 20, 240);
    stroke(255, 255, 255);
    strokeWeight(2);
    rect(boxX, boxY, boxWidth, boxHeight, 5);
    
    // Informazioni
    noStroke();
    fill(255, 255, 255);
    textFont('sans-serif');
    textSize(12);
    textAlign(LEFT, TOP);
    
    let infoY = boxY + 10;
    text(`Year: ${closest.year}`, boxX + 10, infoY);
    infoY += 18;
    text(`Country: ${closest.country}`, boxX + 10, infoY);
    infoY += 18;
    text(`Yield: ${closest.yield} kt`, boxX + 10, infoY);
    infoY += 18;
    text(`Purpose: ${closest.purpose}`, boxX + 10, infoY);
    infoY += 18;
    if (closest.name && closest.name !== '') {
      text(`Name: ${closest.name}`, boxX + 10, infoY);
    }
    
    // Evidenzia il punto
    stroke(255, 255, 255);
    strokeWeight(2);
    noFill();
    circle(closest.x, closest.y, closest.size + 8);
  }
}

function getColorForYield(y) {
  if (y >= 0 && y <= 19) return color('#dabfffff');
  else if (y === 20) return color('#cf83ffff');
  else if (y >= 21 && y <= 150) return color('#ff24f0ff');
  else if (y >= 151 && y <= 4999) return color('#d1009dff');
  else if (y >= 5000) return color('#760057ff');
  else return color('#dabfffff'); // default
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Ridistribuisci i punti
  for (let exp of explosions) {
    exp.x = random(80, width - 80);
    exp.y = random(120, height - 80);
  }
  
  // Riposiziona lo slider
  if (yearSlider) {
    yearSlider.position(180, 55);
  }
}

function createYearFilter() {
  // Crea dropdown per selezione anno
  yearSlider = createSelect();
  yearSlider.position(180, 55);
  yearSlider.style('font-family', 'sans-serif');
  yearSlider.style('font-size', '14px');
  yearSlider.style('padding', '5px 10px');
  yearSlider.style('background-color', '#121214');
  yearSlider.style('color', '#ffffff');
  yearSlider.style('border', '2px solid rgba(255, 255, 255, 0.3)');
  yearSlider.style('border-radius', '4px');
  yearSlider.style('cursor', 'pointer');
  
  // Aggiungi opzione "ALL"
  yearSlider.option('ALL YEARS', 'ALL');
  
  // Aggiungi tutti gli anni disponibili
  let uniqueYears = [...new Set(explosions.map(e => e.year))].sort((a, b) => a - b);
  for (let year of uniqueYears) {
    yearSlider.option(year.toString(), year);
  }
  
  // Callback quando cambia la selezione
  yearSlider.changed(() => {
    let val = yearSlider.value();
    selectedYear = val === 'ALL' ? 'ALL' : parseInt(val);
  });
}