// 全局变量
let table;
let data = [];
let countries = []; 
let maxOuterRadius;

let maxLogYield = 0;
let minDepth = 0;        
let maxDepth = -Infinity; 
let absoluteMaxDepth = 0; 

let centerX, centerY;
let coreRadius = 60;
let coreHoleSize = coreRadius + 60; 
let isDataVisible = false; 

let particlesEmitted = false; 

let countrySelect; 
let regionSelect; 
let currentSelectedCountry = "N/A"; 
let currentSelectedRegion = "N/A";  

// === 日期筛选变量 ===
let yearSelect; 
let monthSelect; 
let daySelect; 
let currentSelectedYear = "N/A"; 
let currentSelectedMonth = "N/A"; 
let currentSelectedDay = "N/A";   

let animationFrame = 0;
const BASE_SCALE_DURATION = 30; 

let dataDisplayFrame = 0;
const MAX_COUNTER_FRAMES = 120; 
const TYPEWRITER_SPEED = 2; 

const FIXED_PARTICLE_COUNT = 150; 

let shakeMagnitude = 0;
const maxShakeMagnitude = 45; 
const shakeDecayRate = 0.985; 

let currentRipplesCount = 0; 
const RIPPLE_SPREAD_RATE = 0.8; 
const RIPPLE_DELAY_FRAMES = 5; 
const RIPPLE_MAX_LIFETIME = 150; 
const RIPPLE_MAX_ALPHA = 255; 

const CORE_FILL_COLOR = [255, 65, 54]; 
const CORE_GLOW_COLOR = [255, 255, 0];  

const DEPTH_COLORS = [
    [215, 166, 222], 
    [200, 194, 93],  
    [249, 108, 1],   
    [110, 133, 219]  
];

let particles = [];
const particleLifeSpan = 180; 
const TRAIL_LENGTH = 15; 

const FIXED_FINAL_RADIUS = 150; 

let currentRingColor; 

// =================================================================
// === 地图集成变量 ===
// =================================================================
const MAP_IMAGE_URL = 'assets/worldmap.png'; 
let mapImg;
let globalRipples = []; 

const IMG_W = 4030;
const IMG_H = 2076;

const DOT_R = 235;
const DOT_G = 94;
const DOT_B = 58;
const WAVE_R = 255; 
const WAVE_G = 100;
const WAVE_B = 50;

const MAP_SCALE_FACTOR = 0.10; 

let scaledW, scaledH;
let offsetX, offsetY;

const MAP_MARGIN = 100; 

const LON_MIN = -170;
const LON_MAX = 190;
const LAT_MIN = -55;
const LAT_MAX = 75;

let hoveredPoint = null;
let selectedMapPoint = null; 

// =================================================================
// === 辅助数学函数 ===
// =================================================================
function log10(val) {
    return Math.log(val) / Math.LN10;
}

// =================================================================
// === P5 生命周期函数 ===
// =================================================================

function preload() {
    try {
        // 确保文件路径正确
        table = loadTable('dataset-modified (1).csv', 'csv', 'header'); 
    } catch (e) {
        table = new p5.Table();
        console.error("无法加载CSV文件。请检查文件路径和名称。", e);
    }
    mapImg = loadImage(MAP_IMAGE_URL, img => {}, e => {
        console.error("Failed to load map image. Using placeholder logic.", e);
        mapImg = null;
    });
}

function setup() {
    let canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('p5-canvas-container');

    maxOuterRadius = min(width, height) / 2 - 40; 
    centerX = width / 2;
    centerY = height / 2;
    angleMode(DEGREES);
    colorMode(RGB, 255);
    noLoop(); 

    let countrySet = new Set(); 
    
    absoluteMaxDepth = 0; 
    
    if (data.length === 0) {
        for (let r = 0; r < table.getRowCount(); r++) {
            let dataRow = table.getRow(r);
            
            let country_str = dataRow.get('country') || 'N/A';
            let region_str = (dataRow.get('region') || 'N/A').trim();
            
            let avgYield_str = dataRow.get('average_yield') || '0';
            let depth_str = dataRow.get('depth') || '0'; 
            let id_no_str = dataRow.get('id_no') || 'ID_N/A'; 

            let avgYield_val = parseFloat(avgYield_str) || 0; 
            let baseYieldForLog = avgYield_val; 

            if (isNaN(baseYieldForLog) || baseYieldForLog <= 0) continue; 

            let logYield = log10(baseYieldForLog + 1); 
            
            let rawDepthVal = parseFloat(depth_str); 
            if (isNaN(rawDepthVal)) rawDepthVal = 0; 
            
            let depth_val = rawDepthVal; 

            if (depth_val > absoluteMaxDepth) absoluteMaxDepth = depth_val;
            
            let latitude = parseFloat(dataRow.get('latitude'));
            let longitude = parseFloat(dataRow.get('longitude'));
            
            if (isNaN(latitude) || isNaN(longitude)) continue; 

            let locationName = dataRow.get('name') || dataRow.get('region') || 'N/A';
            
            let dateStr = dataRow.get('date_DMY') || 'N/A'; 
            
            let year = 'N/A', month = 'N/A', day = 'N/A';
            if (dateStr !== 'N/A') {
                const parts = dateStr.split('/'); 
                if (parts.length === 3) {
                    day = parts[0];   
                    month = parts[1]; 
                    year = parts[2];  
                }
            }
            
            let isoDateStr = 'N/A'; 
            let dateObj = null;

            let uniqueRegionName;
            if (region_str !== 'N/A') {
                // 使用 country + region + id_no 来创建唯一的地区名，以应对不同国家有相同地区名的情况
                uniqueRegionName = `${region_str} (${id_no_str})`; 
            } else {
                uniqueRegionName = 'N/A';
            }

            data.push({
                country: country_str, 
                region: region_str,   
                logYield: logYield,
                avg_yield_val: avgYield_val, 
                yield_1_val: parseFloat(dataRow.get('yield_1') || '0'), 
                yield_u_val: parseFloat(dataRow.get('yield_u') || '0'), 
                yield_1: dataRow.get('yield_1') || '0',
                yield_u: dataRow.get('yield_u') || '0',
                date_DMY: dateStr,
                
                date_ISO: isoDateStr, 
                date_Obj: dateObj,    
                
                raw_depth_str: depth_str, 
                depth_val: depth_val, 
                
                type: dataRow.get('type') || 'N/A',
                lat: latitude,
                lon: longitude,
                name: locationName,
                
                year: year,
                month: month,
                day: day, 
                
                yield1_map: dataRow.get('yield_1') || '0',
                uniqueRegionName: uniqueRegionName, 
            });

            if (logYield > maxLogYield) {
                maxLogYield = logYield;
            }
            
            countrySet.add(country_str);
        }
    } else {
         data.forEach(d => {
            countrySet.add(d.country);
            if (d.depth_val > absoluteMaxDepth) absoluteMaxDepth = d.depth_val;
         });
    }

    minDepth = 0; 
    maxDepth = 1000; 
    
    if (absoluteMaxDepth > 1000) {
        maxDepth = ceil(absoluteMaxDepth / 100) * 100; 
    }
    
    if (minDepth === maxDepth) {
         maxDepth = minDepth + 100;
    }

    countries = [...Array.from(countrySet).filter(c => c !== 'N/A').sort()];
    
    setupP5Filters();
    calculateMapDimensions();
    
    updateSelectedPoint(); 
}

function draw() {
    textFont('Libre Franklin'); 
    
    background(0);
    drawStarryBackground();
    
    let sortedData = filterData();
    
    let totalYieldSum = sortedData.reduce((sum, d) => sum + d.avg_yield_val, 0); 
    
    if (isDataVisible || particles.length > 0 || hoveredPoint !== null) {
        loop();
    } else {
         noLoop(); 
    }
    
    if (sortedData.length > 0 && totalYieldSum === 0) {
        totalYieldSum = sortedData.reduce((sum, d) => sum + Math.pow(10, d.logYield) - 1, 0);
    }
    
    let maxDataPoint = sortedData.length > 0 ? filterData()[filterData().length - 1] : null;

    if (isDataVisible && maxDataPoint) {
        let t = map(maxDataPoint.depth_val, minDepth, maxDepth, 0, 1); 
        t = constrain(t, 0, 1);
        currentRingColor = getColorForDepth(t); 
    } else {
        currentRingColor = color(DEPTH_COLORS[0]); 
    }
    const ringColor = currentRingColor;

    let currentRadiusShake = 0;

    if (isDataVisible && shakeMagnitude > 0) {
        currentRadiusShake = random(-shakeMagnitude / 2, shakeMagnitude / 2);
        shakeMagnitude *= shakeDecayRate;
        if (shakeMagnitude < 0.1) shakeMagnitude = 0;
    }

    push();
    translate(centerX, centerY); 

    drawDarkCoreGlow(); 
    drawCoreText(); 
    drawCoreForeground(); 
    
    const finalRadius = FIXED_FINAL_RADIUS; 
    const totalAnimationFrames = BASE_SCALE_DURATION;
    const ringsFullyDrawn = (sortedData.length > 0 && animationFrame >= totalAnimationFrames);

    if (isDataVisible) {
        let currentRadius = map(animationFrame, 0, totalAnimationFrames, coreHoleSize, finalRadius);
        currentRadius = constrain(currentRadius, coreHoleSize, finalRadius);
        
        if (currentRadius >= coreHoleSize) { 
            drawSingleSoftRing(currentRadius, ringColor, currentRadiusShake);
        }

        if (ringsFullyDrawn) {
            if (currentRipplesCount === 0 && sortedData.length > 0) {
                let logSum = log10(totalYieldSum + 1);
                let calculatedRipples = floor(logSum * 5); 
                currentRipplesCount = constrain(calculatedRipples, 5, 60); 
                currentRipplesCount = max(currentRipplesCount, 5); 
            }
        }
        
        if (currentRipplesCount > 0) {
            drawRipples(finalRadius, currentRipplesCount, ringColor);
        }

        if (ringsFullyDrawn && !particlesEmitted) {
            emitParticles(ringColor); 
        }

        let isRippleActive = animationFrame < (currentRipplesCount * RIPPLE_DELAY_FRAMES + RIPPLE_MAX_LIFETIME + BASE_SCALE_DURATION);
        
        if (!ringsFullyDrawn || (ringsFullyDrawn && (particles.length > 0 || shakeMagnitude > 0 || isRippleActive))) {
            animationFrame++;
        }
        
        if (ringsFullyDrawn && maxDataPoint) {
            dataDisplayFrame++;
        }
    }

    pop(); 

    if (isDataVisible && ringsFullyDrawn && maxDataPoint) {
        drawDataDetail(maxDataPoint); 
    }

    drawDepthScale();

    if (isDataVisible || particles.length > 0) {
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
        }
        
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].display();
            if (particles[i].isDead()) {
                particles.splice(i, 1);
            }
        }
    }
    
    drawMapVisualization();
}

// =================================================================
// === 绘制辅助函数 (与之前版本相同，略) ===
// =================================================================

function drawSingleSoftRing(outerRadius, ringColor, radiusOffset) {
    push();
    noFill();

    let currentRadius = outerRadius + radiusOffset; 
    let baseColor = color(ringColor); 
    let shakeFactor = abs(radiusOffset) / (maxShakeMagnitude / 2); 
    
    const HIGH_LIGHT_R = 255; 
    const HIGH_LIGHT_G = 255;
    const HIGH_LIGHT_B = 100;
    
    let highlight = color(HIGH_LIGHT_R, HIGH_LIGHT_G, HIGH_LIGHT_B);
    let mixedColor = lerpColor(baseColor, highlight, shakeFactor);
    mixedColor.setAlpha(255); 

    mixedColor.setAlpha(180); 
    stroke(mixedColor);
    strokeWeight(1.5 + shakeFactor * 2); 
    circle(0, 0, currentRadius * 2);

    const OUTER_GLOW_STEPS = 16; 
    const OUTER_SPREAD_FACTOR = 2.0; 
    let glowBaseColor = color(ringColor); 

    for (let i = 1; i <= OUTER_GLOW_STEPS; i++) {
        glowBaseColor.setAlpha(map(i, 1, OUTER_GLOW_STEPS, 20, 0));
        stroke(glowBaseColor);
        strokeWeight(i * 1.5); 
        circle(0, 0, currentRadius * 2 + i * OUTER_SPREAD_FACTOR); 
    }

    const innerGlowSteps = 40;
    const maxInnerAlpha = 20;
    const innerSpreadFactor = 2;

    for (let i = 1; i <= innerGlowSteps; i++) {
        glowBaseColor.setAlpha(map(i, 1, innerGlowSteps, maxInnerAlpha, 0));
        stroke(glowBaseColor);
        strokeWeight(i * 1.8);
        circle(0, 0, currentRadius * 2 - i * innerSpreadFactor);
    }
    const innerGlowSteps2 = 10;
    const maxInnerAlpha2= 100;
    const innerSpreadFactor2 = 1;

    for (let i = 1; i <= innerGlowSteps2; i++) {
        glowBaseColor.setAlpha(map(i, 1, innerGlowSteps2, maxInnerAlpha2, 0));
        stroke(glowBaseColor);
        strokeWeight(i * 1.8);
        circle(0, 0, currentRadius * 2 - i * innerSpreadFactor2);
    }

    pop();
}

function drawStarryBackground() {
    randomSeed(99); 
    for (let i = 0; i < 300; i++) {
        let x = random(width);
        let y = random(height);
        let starSize = random(1, 3);
        let alpha = random(100, 255);
        fill(255, 255, 255, alpha);
        noStroke();
        ellipse(x, y, starSize, starSize);
    }
}

function drawDarkCoreGlow() {
    push();
    
    noStroke();
    fill(CORE_FILL_COLOR[0], CORE_FILL_COLOR[1], CORE_FILL_COLOR[2]);
    circle(0, 0, coreRadius * 2); 

    let glowBaseColor = color(200, 193, 94); 
    const GLOW_STEPS = 8; 
    const START_RADIUS_OFFSET = -12; 
    const MAX_WEIGHT_MULTIPLIER = 10; 
    
    for (let i = 1; i <= GLOW_STEPS; i++) {
        let alpha = map(i, 1, GLOW_STEPS, 80, 0); 
        let weight = i * MAX_WEIGHT_MULTIPLIER; 

        glowBaseColor.setAlpha(alpha);
        stroke(glowBaseColor);
        strokeWeight(weight);
        noFill();
        
        circle(0, 0, coreRadius * 2 + START_RADIUS_OFFSET); 
    }
    
    noFill();
    stroke(255, 255, 200, 200); 
    strokeWeight(1);
    circle(0, 0, coreRadius * 2);

    pop();
}

function drawCoreForeground() {
    // Placeholder
}

function drawCoreText() {
    push();
    
    let coreText = isDataVisible ? 'CLEAR' : 'DETONATE'; 
    
    fill(255, 255, 200); 
    textSize(16);
    textAlign(CENTER, CENTER);
    text(coreText, 0, 0);
    
    pop();
}

function drawRipples(finalRadius, rippleCount, rippleColor) {
    if (rippleCount <= 0) return;
    
    push();
    noFill();
    let currentColor = color(rippleColor.levels[0], rippleColor.levels[1], rippleColor.levels[2], 255);

    let currentAnimFrame = animationFrame - BASE_SCALE_DURATION; 
    if (currentAnimFrame < 0) currentAnimFrame = 0;

    let overallAlpha = map(currentAnimFrame, 0, RIPPLE_MAX_LIFETIME, RIPPLE_MAX_ALPHA, 0);
    overallAlpha = constrain(overallAlpha, 0, RIPPLE_MAX_ALPHA);

    if (overallAlpha <= 0) {
        pop();
        return;
    }

    for (let i = 0; i < rippleCount; i++) {
        
        let rippleLife = currentAnimFrame; 

        let initialRadius = finalRadius + (i * RIPPLE_SPREAD_RATE * RIPPLE_DELAY_FRAMES);
        let rippleRadius = initialRadius + (rippleLife * RIPPLE_SPREAD_RATE); 
        
        let alphaFactor = map(i, 0, rippleCount - 1, 0.3, 1.0); 
        
        let finalAlpha = overallAlpha * alphaFactor;
        finalAlpha = constrain(finalAlpha, 0, RIPPLE_MAX_ALPHA); 
        
        let weight = 1.0; 
        
        currentColor.setAlpha(finalAlpha); 
        
        stroke(currentColor);
        strokeWeight(weight);
        
        if (rippleRadius < maxOuterRadius * 1.5) { 
            circle(0, 0, rippleRadius * 2);
        }
    }
    
    pop();
}

function drawDataDetail(dataPoint) {
    if (!dataPoint) return;
    
    push();
    
    let yieldColor = color(currentRingColor.levels[0], currentRingColor.levels[1], currentRingColor.levels[2], 255); 
    
    const roughHeight = 550; 
    let startY = centerY - (roughHeight / 2);
    
    translate(150, startY); 
    
    const LINE_SPACING_BIG = 40; 
    const LINE_SPACING_SMALL = 20; 
    
    let y = 0; 
    
    noStroke();
    textAlign(LEFT, TOP);

    const drawItem = (label, value, labelSize = 16, valueSize = 28, valueColor) => {
        fill(200); 
        textSize(labelSize);
        text(label, 0, y);
        y += LINE_SPACING_SMALL; 

        fill(valueColor); 
        textSize(valueSize);
        text(value, 0, y);
        y += LINE_SPACING_BIG * 1.5; 
    };
    
    let counterProgress = constrain(dataDisplayFrame / MAX_COUNTER_FRAMES, 0, 1);
    let currentYield1 = lerp(0, dataPoint.yield_1_val, counterProgress);
    let currentYieldU = lerp(0, dataPoint.yield_u_val, counterProgress);
    
    let formatNum = (num, finalStr) => {
        if (num === 0) return '0';
        if (finalStr.includes('e') || finalStr.includes('E')) {
             return num.toExponential(2);
        }
        let parts = finalStr.split('.');
        let precision = parts.length > 1 ? parts[1].length : 0;
        return num.toFixed(precision);
    };

    let displayYield1 = formatNum(currentYield1, dataPoint.yield_1);
    let displayYieldU = formatNum(currentYieldU, dataPoint.yield_u);

    if (counterProgress === 1) {
        displayYield1 = dataPoint.yield_1;
        displayYieldU = dataPoint.yield_u;
    }

    const MAX_YIELD_SIZE = 48; 
    
    drawItem('FORCE_1', displayYield1, 16, MAX_YIELD_SIZE, yieldColor); 
    drawItem('FORCE_U', displayYieldU, 16, MAX_YIELD_SIZE, yieldColor); 

    let displayDepthM = dataPoint.depth_val.toFixed(1); 
    if (dataPoint.depth_val % 1 === 0) {
         displayDepthM = dataPoint.depth_val.toFixed(0); 
    }
    
    const typewriterData = [
        { label: 'COUNTRY', value: dataPoint.country },     
        { label: 'REGION', value: dataPoint.uniqueRegionName }, 
        { label: 'DATE', value: dataPoint.date_DMY },      
        { label: 'DEPTH (m)', value: displayDepthM },    
        { label: 'TYPE', value: dataPoint.type },          
    ];
    
    const VALUE_SIZE_NORMAL = 26; 
    const LABEL_SIZE_NORMAL = 12; 
    
    let detailAlpha = map(dataDisplayFrame, 0, MAX_COUNTER_FRAMES, 50, 255);
    detailAlpha = constrain(detailAlpha, 50, 255);

    let charIndex = floor(dataDisplayFrame / TYPEWRITER_SPEED);
    let totalChars = 0;
    
    for (let i = 0; i < typewriterData.length; i++) {
        let item = typewriterData[i];
        let fullText = item.value;
        let labelText = item.label;
        
        let startCharIndex = totalChars;
        totalChars += fullText.length;
        
        let charsToShow = constrain(charIndex - startCharIndex, 0, fullText.length);
        let displayedValue = fullText.substring(0, charsToShow);

        fill(200, detailAlpha); 
        textSize(LABEL_SIZE_NORMAL);
        text(labelText, 0, y);
        y += LINE_SPACING_SMALL;

        fill(255, detailAlpha); 
        textSize(VALUE_SIZE_NORMAL);
        text(displayedValue, 0, y);
        y += LINE_SPACING_BIG; 
    }
    
    pop();
}

function getColorForDepth(normalizedDepth) {
    let numColors = DEPTH_COLORS.length;
    let index = normalizedDepth * (numColors - 1);
    
    let idx1 = floor(index);
    let idx2 = ceil(index);
    let frac = index - idx1;
    
    if (idx1 === idx2) {
        return color(DEPTH_COLORS[idx1]);
    }

    let c1 = color(DEPTH_COLORS[idx1]);
    let c2 = color(DEPTH_COLORS[idx2]);
    
    return lerpColor(c1, c2, frac);
}

function drawDepthScale() {
    push();
    const scaleMargin = 40;
    const scaleWidth = 12; 
    const scaleHeight = height - 120; 

    const scaleX = width - scaleMargin;
    const scaleYStart = 60; 
    const scaleYEnd = scaleYStart + scaleHeight; 
    
    const gradientYStart = scaleYStart + scaleWidth / 2; 
    const gradientYEnd = scaleYEnd - scaleWidth / 2;
    const gradientHeight = gradientYEnd - gradientYStart;

    
    noStroke();

    for (let y = gradientYStart; y <= gradientYEnd; y++) {
        let t = map(y, gradientYStart, gradientYEnd, 0, 1); 
        let c = getColorForDepth(t);
        stroke(c);
        line(scaleX - scaleWidth / 2, y, scaleX + scaleWidth / 2, y);
    }
    
    let topCapColor = getColorForDepth(0); 
    fill(topCapColor);
    noStroke(); 
    arc(scaleX, gradientYStart, scaleWidth, scaleWidth, 180, 0); 

    let bottomCapColor = getColorForDepth(1); 
    fill(bottomCapColor);
    noStroke(); 
    arc(scaleX, gradientYEnd, scaleWidth, scaleWidth, 0, 180); 

    stroke(255, 255, 255, 100);
    strokeWeight(1);
    noFill();
    rect(scaleX - scaleWidth / 2, gradientYStart - scaleWidth / 2, scaleWidth, gradientHeight + scaleWidth, scaleWidth / 2); 

    fill(255);
    noStroke();
    textSize(14);
    textAlign(CENTER, BOTTOM);
    text('DEPTH (m)', scaleX, scaleYStart - 10); 

    const majorTicks = 5; 
    const labelOffset = 15; 

    for (let i = 0; i <= majorTicks; i++) {
        let normalizedDepth = i / majorTicks; 
        
        let currentDepth = lerp(minDepth, maxDepth, normalizedDepth); 
        
        let y = map(normalizedDepth, 0, 1, gradientYStart, gradientYEnd);
        
        stroke(255, 255, 255, 180); 
        strokeWeight(1);
        line(scaleX - scaleWidth / 2, y, scaleX - scaleWidth / 2 - 5, y); 

        fill(200);
        noStroke();
        textSize(12); 
        textAlign(RIGHT, CENTER);
        
        let displayDepth = (currentDepth % 1 === 0) ? currentDepth.toFixed(0) : currentDepth.toFixed(1);
        
        text(displayDepth, scaleX - scaleWidth / 2 - labelOffset, y);
    }
    
    let maxDataPoint = filterData().length > 0 ? filterData()[filterData().length - 1] : null;

    if (maxDataPoint && isDataVisible) {
        
        let dataDepthVal = maxDataPoint.depth_val; 
        
        let t = map(dataDepthVal, minDepth, maxDepth, 0, 1); 
        t = constrain(t, 0, 1);
        
        let highlightColor = getColorForDepth(t); 
        let depthY = map(t, 0, 1, gradientYStart, gradientYEnd);
        depthY = constrain(depthY, gradientYStart, gradientYEnd);

        fill(highlightColor);
        stroke(255, 255, 255); 
        strokeWeight(2);
        ellipse(scaleX, depthY, 15, 15); 

        stroke(highlightColor);
        strokeWeight(2);
        drawingContext.setLineDash([5, 5]); 
        line(scaleX - 7, depthY, scaleX - 250, depthY);
        drawingContext.setLineDash([]); 

        fill(highlightColor); 
        noStroke(); 
        textSize(12); 
        textAlign(RIGHT, CENTER);
        
        let displayMaxDepth = (dataDepthVal % 1 === 0) ? dataDepthVal.toFixed(0) : dataDepthVal.toFixed(1);
        
        text(`MAX DEPTH: ${displayMaxDepth}`, scaleX - 260, depthY); 
    }

    pop();
}

class Particle {
    
    constructor(x, y, color, initialVelocity) {
        this.pos = createVector(x, y);
        this.vel = initialVelocity.copy();
        this.acc = createVector(0, 0);
        this.lifespan = particleLifeSpan;
        this.baseColor = color; 
        this.size = random(2.5, 5.5); 
        this.history = []; 
    }

    update() {
        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0);
        this.lifespan--;

        this.history.push(this.pos.copy());
        if (this.history.length > TRAIL_LENGTH) {
            this.history.shift(); 
        }
    }

    display() {
        let currentLifeAlpha = map(this.lifespan, 0, particleLifeSpan, 0, 255);
        let finalAlpha = min(currentLifeAlpha, 255); 
        
        push();
        
        for (let i = 0; i < this.history.length; i++) {
            let trailPos = this.history[i];
            let trailSize = map(i, 0, this.history.length, 0.5, this.size);
            let trailAlpha = map(i, 0, this.history.length, 0, finalAlpha / 2);
            
            this.baseColor.setAlpha(trailAlpha);
            fill(this.baseColor);
            noStroke();
            ellipse(trailPos.x, trailPos.y, trailSize);
        }

        this.baseColor.setAlpha(finalAlpha);
        fill(this.baseColor);
        ellipse(this.pos.x, this.pos.y, this.size);
        
        pop();
    }

    isDead() {
        return this.lifespan < 0;
    }
}

function emitParticles(ringColor) {
    let totalYield = filterData().reduce((sum, d) => sum + d.avg_yield_val, 0);
    if (totalYield === 0) {
         totalYield = filterData().reduce((sum, d) => sum + Math.pow(10, d.logYield) - 1, 0);
    }
    
    let logYield = log10(totalYield + 1);
    let particleCount = FIXED_PARTICLE_COUNT; 
    
    particlesEmitted = true; 

    for (let i = 0; i < particleCount; i++) {
        let angle = random(360);
        let startRadius = FIXED_FINAL_RADIUS; 
        let startX = centerX + startRadius * cos(angle);
        let startY = centerY + startRadius * sin(angle);

        let speedMagnitude = map(logYield, 0, maxLogYield, 0.5, 10); 
        let velocity = createVector(cos(angle), sin(angle));
        velocity.mult(random(speedMagnitude * 0.8, speedMagnitude * 1.2));

        particles.push(new Particle(startX, startY, color(ringColor), velocity));
    }
}

// =================================================================
// === 筛选逻辑及级联更新 ===
// =================================================================

function filterData() {
    let filtered = data.filter(d => {
        let countryMatch = currentSelectedCountry === "N/A" || d.country === currentSelectedCountry;
        let regionMatch = currentSelectedRegion === "N/A" || d.uniqueRegionName === currentSelectedRegion;
        
        let yearMatch = currentSelectedYear === "N/A" || d.year === currentSelectedYear;
        let monthMatch = currentSelectedMonth === "N/A" || d.month === currentSelectedMonth;
        let dayMatch = currentSelectedDay === "N/A" || d.day === currentSelectedDay;
        
        return countryMatch && regionMatch && yearMatch && monthMatch && dayMatch;
    });
    
    filtered.sort((a, b) => a.avg_yield_val - b.avg_yield_val);
    
    return filtered;
}

function setupP5Filters() {
    countrySelect = document.getElementById('countrySelect');
    regionSelect = document.getElementById('regionSelect');
    
    yearSelect = document.getElementById('yearSelect'); 
    monthSelect = document.getElementById('monthSelect'); 
    daySelect = document.getElementById('daySelect'); 

    // --- 国家选择器初始化 ---
    countrySelect.innerHTML = '';
    countrySelect.add(new Option("N/A (All)", "N/A")); 
    
    let sortedCountries = countries.filter(c => c !== 'N/A').sort();
    sortedCountries.forEach(c => countrySelect.add(new Option(c, c))); 
    countrySelect.value = "N/A";
    currentSelectedCountry = "N/A";

    // --- 事件监听 ---
    countrySelect.addEventListener('change', countryChanged);
    regionSelect.addEventListener('change', regionChanged);
    
    yearSelect.addEventListener('change', yearChanged);
    monthSelect.addEventListener('change', monthChanged);
    daySelect.addEventListener('change', dayChanged);

    // 初始设置：不自动选择，但更新选项
    updateRegionOptions(currentSelectedCountry, false);
    updateYearOptions(false);
    
    // 确保默认值设置正确
    currentSelectedYear = yearSelect.value;
    currentSelectedMonth = monthSelect.value;
    currentSelectedDay = daySelect.value;
}

// =================================================================
// === 年月日级联更新函数 ===
// =================================================================

/**
 * 根据当前选中的国家/地区，获取用于日期筛选的数据子集
 * * @returns {Array<Object>} 过滤后的数据
 */
function getDataForDateFiltering() {
    // 日期选项的可用性只应受国家和地区的限制
    return data.filter(d => {
        let countryMatch = currentSelectedCountry === "N/A" || d.country === currentSelectedCountry;
        let regionMatch = currentSelectedRegion === "N/A" || d.uniqueRegionName === currentSelectedRegion;
        return countryMatch && regionMatch;
    });
}

function updateYearOptions(autoSelect = false) {
    // **注意：** 这里的 dataForFilter 只受国家/地区限制
    const dataForFilter = getDataForDateFiltering(); 
    let availableYears = new Set(["N/A"]);

    dataForFilter.forEach(d => {
        if (d.year && d.year !== 'N/A') {
            availableYears.add(d.year);
        }
    });

    let sortedYears = Array.from(availableYears).filter(y => y !== 'N/A').sort().reverse();
    
    yearSelect.innerHTML = '';
    yearSelect.add(new Option("N/A", "N/A")); 
    sortedYears.forEach(y => yearSelect.add(new Option(y, y)));

    let finalSelection = currentSelectedYear;
    
    // 【修正点】: 如果当前选定的年份在新选项中不可用，或强制自动选择 (autoSelect=true)
    if (!availableYears.has(currentSelectedYear) || autoSelect) { 
        if (sortedYears.length > 0 && autoSelect) {
            // 自动选择第一个年份（最新的）
            finalSelection = sortedYears[0]; 
        } else {
            // 如果 autoSelect=false，或没有有效年份，退回到 "N/A"
            finalSelection = "N/A";
        }
    } else {
        // 如果 currentSelectedYear 在可用选项中，保留它
        finalSelection = currentSelectedYear; 
    }
    
    yearSelect.value = finalSelection;
    currentSelectedYear = finalSelection;
    
    updateMonthOptions(autoSelect); 
}

function updateMonthOptions(autoSelect = false) {
    // **注意：** 这里的 dataForFilter 既受国家/地区限制，也受已选定年份的限制
    const dataForFilter = getDataForDateFiltering().filter(d => 
        currentSelectedYear === "N/A" || d.year === currentSelectedYear
    );
    
    let availableMonths = new Set(["N/A"]);
    const monthNames = { "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun", 
                         "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec" };

    dataForFilter.forEach(d => {
        if (d.month && d.month !== 'N/A') {
            availableMonths.add(d.month);
        }
    });

    let sortedMonths = Array.from(availableMonths).filter(m => m !== 'N/A').sort();
    
    monthSelect.innerHTML = '';
    monthSelect.add(new Option("N/A", "N/A")); 
    
    sortedMonths.forEach(m => monthSelect.add(new Option(monthNames[m] || m, m)));
    
    let finalSelection = currentSelectedMonth;
    
    // 【修正点】: 如果当前选定的月份在新选项中不可用，或强制自动选择 (autoSelect=true)
    if (!availableMonths.has(currentSelectedMonth) || autoSelect) {
        if (sortedMonths.length > 0 && autoSelect) {
            // 自动选择第一个月份 (最早的)
            finalSelection = sortedMonths[0]; 
        } else {
            finalSelection = "N/A";
        }
    } else {
        finalSelection = currentSelectedMonth;
    }
    
    monthSelect.value = finalSelection;
    currentSelectedMonth = finalSelection;
    
    updateDayOptions(autoSelect); 
}

function updateDayOptions(autoSelect = false) {
    // **注意：** 这里的 dataForFilter 既受国家/地区限制，也受已选定年份和月份的限制
    const dataForFilter = getDataForDateFiltering().filter(d => 
        (currentSelectedYear === "N/A" || d.year === currentSelectedYear) &&
        (currentSelectedMonth === "N/A" || d.month === currentSelectedMonth)
    );
    
    let availableDays = new Set(["N/A"]);

    dataForFilter.forEach(d => {
        if (d.day && d.day !== 'N/A') {
            availableDays.add(d.day);
        }
    });

    let sortedDays = Array.from(availableDays).filter(d => d !== 'N/A').sort((a, b) => parseInt(a) - parseInt(b));
    
    daySelect.innerHTML = '';
    daySelect.add(new Option("N/A", "N/A")); 
    sortedDays.forEach(d => daySelect.add(new Option(d, d)));

    let finalSelection = currentSelectedDay;
    
    // 【修正点】: 如果当前选定的日期在新选项中不可用，或强制自动选择 (autoSelect=true)
    if (!availableDays.has(currentSelectedDay) || autoSelect) {
        if (sortedDays.length > 0 && autoSelect) {
            finalSelection = sortedDays[0]; 
        } else {
            finalSelection = "N/A";
        }
    } else {
        finalSelection = currentSelectedDay;
    }
    
    daySelect.value = finalSelection;
    currentSelectedDay = finalSelection;
}

/**
 * 根据当前选定的日期，过滤国家选项并自动选择第一个有效国家。
 * 国家选项的可用性只受日期的限制。
 * * @param {boolean} autoSelect 是否自动选择第一个有效国家。
 */
function updateCountryFromDate(autoSelect = false) {
    // 1. 根据当前日期筛选，找到所有匹配的国家
    let availableCountries = new Set(["N/A"]);
    
    data.forEach(d => {
        let yearMatch = currentSelectedYear === "N/A" || d.year === currentSelectedYear;
        let monthMatch = currentSelectedMonth === "N/A" || d.month === currentSelectedMonth;
        let dayMatch = currentSelectedDay === "N/A" || d.day === currentSelectedDay;
        
        if (yearMatch && monthMatch && dayMatch && d.country !== 'N/A') {
            availableCountries.add(d.country);
        }
    });

    let sortedCountries = Array.from(availableCountries).filter(c => c !== 'N/A').sort();
    
    // 2. 重新填充国家下拉菜单（避免显示不存在的选项）
    countrySelect.innerHTML = '';
    countrySelect.add(new Option("N/A (All)", "N/A")); 
    sortedCountries.forEach(c => countrySelect.add(new Option(c, c)));
    
    // 3. 自动选择逻辑
    let finalSelection = currentSelectedCountry;
    let isCurrentCountryValid = availableCountries.has(currentSelectedCountry);

    // 【修正点】: 如果当前国家无效，或者需要自动选择
    if (!isCurrentCountryValid || autoSelect) { 
        if (sortedCountries.length > 0 && autoSelect) { // 仅在 autoSelect=true 且有数据时自动选择
            finalSelection = sortedCountries[0]; 
        } else {
            finalSelection = "N/A";
        }
    } else {
        finalSelection = currentSelectedCountry;
    }
    
    countrySelect.value = finalSelection;
    currentSelectedCountry = finalSelection;
}

/**
 * 更新地区选项。同时受国家和日期筛选器的限制。
 * * @param {string} selectedCountry 当前选定的国家
 * @param {boolean} autoSelect 是否自动选择第一个有效地区
 */
function updateRegionOptions(selectedCountry, autoSelect = false) {
    regionSelect.innerHTML = '';
    regionSelect.add(new Option("N/A (All)", "N/A")); 
    
    let uniqueRegionNames = new Set();
    
    // 筛选数据：必须匹配国家 AND 日期
    data.filter(d => 
        (d.country === selectedCountry) &&
        (currentSelectedYear === "N/A" || d.year === currentSelectedYear) &&
        (currentSelectedMonth === "N/A" || d.month === currentSelectedMonth) &&
        (currentSelectedDay === "N/A" || d.day === currentSelectedDay)
    ).forEach(d => {
        if (d.uniqueRegionName !== 'N/A') {
            uniqueRegionNames.add(d.uniqueRegionName);
        }
    });

    let regions = Array.from(uniqueRegionNames).filter(r => r !== 'N/A').sort();
    regions.forEach(r => regionSelect.add(new Option(r, r))); 

    let finalSelection = currentSelectedRegion;
    
    // 【修正点】: 自动选择逻辑
    if (!uniqueRegionNames.has(currentSelectedRegion) || autoSelect) {
        if (autoSelect && regions.length > 0) { // 仅在 autoSelect=true 且有数据时自动选择
            finalSelection = regions[0]; 
        } else {
            finalSelection = "N/A";
        }
    } else {
        finalSelection = currentSelectedRegion;
    }
    
    regionSelect.value = finalSelection; 
    currentSelectedRegion = finalSelection;
}

// =================================================================
// === 筛选器事件处理函数 (已修正自动选择逻辑) ===
// =================================================================

function countryChanged() {
    // 1. 设置新的国家值
    currentSelectedCountry = countrySelect.value;
    
    // 2. 重置整个日期系统（因为它依赖于国家/地区）
    currentSelectedYear = "N/A"; 
    currentSelectedMonth = "N/A"; 
    currentSelectedDay = "N/A"; 
    
    // 仅在选择了具体国家时才自动选择日期
    const shouldAutoSelect = currentSelectedCountry !== "N/A";
    updateYearOptions(shouldAutoSelect); 

    // 3. 重置并更新地区
    currentSelectedRegion = "N/A"; 
    updateRegionOptions(currentSelectedCountry, shouldAutoSelect); 
    
    filterChanged();
}

function regionChanged() {
    // 1. 设置新的地区值
    currentSelectedRegion = regionSelect.value;
    
    // 2. 重置整个日期系统
    currentSelectedYear = "N/A"; 
    currentSelectedMonth = "N/A"; 
    currentSelectedDay = "N/A"; 
    
    // 只要国家或地区有选择，就自动选择日期
    const shouldAutoSelect = currentSelectedRegion !== "N/A" || currentSelectedCountry !== "N/A";
    updateYearOptions(shouldAutoSelect); 
    
    filterChanged();
}

function yearChanged() {
    // 1. 设置新的年份值
    currentSelectedYear = yearSelect.value;
    
    // 检查用户是否选择了 "N/A"
    const isClearing = currentSelectedYear === "N/A";
    const shouldAutoSelect = !isClearing; // 如果是清除操作，则不自动选择

    // 2. 日期级联 (Year -> Month -> Day)
    currentSelectedMonth = "N/A"; 
    currentSelectedDay = "N/A"; 
    updateMonthOptions(shouldAutoSelect); 

    // 3. 国家/地区级联 (Date -> Country -> Region)
    // 重置国家和地区
    currentSelectedCountry = "N/A"; 
    currentSelectedRegion = "N/A"; 
    
    // 自动选择第一个有效的国家
    updateCountryFromDate(shouldAutoSelect); 
    
    // 更新地区选项
    updateRegionOptions(currentSelectedCountry, shouldAutoSelect); 

    filterChanged();
}

function monthChanged() {
    // 1. 设置新的月份值
    currentSelectedMonth = monthSelect.value;
    
    // 检查用户是否选择了 "N/A"
    const isClearing = currentSelectedMonth === "N/A";
    const shouldAutoSelect = !isClearing;

    // 2. 日期级联 (Month -> Day)
    currentSelectedDay = "N/A"; 
    updateDayOptions(shouldAutoSelect); 

    // 3. 国家/地区级联 (Date -> Country -> Region)
    // 重置国家和地区
    currentSelectedCountry = "N/A"; 
    currentSelectedRegion = "N/A"; 
    
    // 自动选择第一个有效的国家
    updateCountryFromDate(shouldAutoSelect); 
    
    // 更新地区选项
    updateRegionOptions(currentSelectedCountry, shouldAutoSelect); 

    filterChanged();
}

function dayChanged() {
    // 1. 设置新的日期值
    currentSelectedDay = daySelect.value;
    
    // 检查用户是否选择了 "N/A"
    const isClearing = currentSelectedDay === "N/A";
    const shouldAutoSelect = !isClearing;

    // 2. 国家/地区级联 (Date -> Country -> Region)
    // 重置国家和地区
    currentSelectedCountry = "N/A"; 
    currentSelectedRegion = "N/A"; 
    
    // 自动选择第一个有效的国家
    updateCountryFromDate(shouldAutoSelect); 
    
    // 更新地区选项
    updateRegionOptions(currentSelectedCountry, shouldAutoSelect); 
    
    filterChanged();
}

/**
 * 【新增函数】重置单个筛选器
 * @param {string} filterType - 要重置的筛选器类型 ('country', 'region', 'year', 'month', 'day')
 */
function resetSingleFilter(filterType) {
    stopAnimation();
    
    switch (filterType) {
        case 'country':
            currentSelectedCountry = "N/A";
            countrySelect.value = "N/A";
            // 级联重置地区和日期
            currentSelectedRegion = "N/A";
            // 重置日期系统，不自动选择
            currentSelectedYear = "N/A"; 
            currentSelectedMonth = "N/A"; 
            currentSelectedDay = "N/A"; 
            updateYearOptions(false); 
            // 更新地区选项
            updateRegionOptions("N/A", false); 
            break;
            
        case 'region':
            currentSelectedRegion = "N/A";
            regionSelect.value = "N/A";
            // 重置日期系统，不自动选择
            currentSelectedYear = "N/A"; 
            currentSelectedMonth = "N/A"; 
            currentSelectedDay = "N/A"; 
            updateYearOptions(false);
            break;
            
        case 'year':
            currentSelectedYear = "N/A";
            yearSelect.value = "N/A";
            // 级联重置月和日
            currentSelectedMonth = "N/A";
            currentSelectedDay = "N/A";
            updateMonthOptions(false); // 这一步会级联到 Day
            // 级联重置国家/地区
            currentSelectedCountry = "N/A";
            currentSelectedRegion = "N/A";
            updateCountryFromDate(false); // 更新国家选项
            updateRegionOptions("N/A", false); // 更新地区选项
            break;
            
        case 'month':
            currentSelectedMonth = "N/A";
            monthSelect.value = "N/A";
            // 级联重置日
            currentSelectedDay = "N/A";
            updateDayOptions(false);
            // 级联重置国家/地区
            currentSelectedCountry = "N/A";
            currentSelectedRegion = "N/A";
            updateCountryFromDate(false); 
            updateRegionOptions("N/A", false); 
            break;
            
        case 'day':
            currentSelectedDay = "N/A";
            daySelect.value = "N/A";
            // 重置国家/地区
            currentSelectedCountry = "N/A";
            currentSelectedRegion = "N/A";
            updateCountryFromDate(false); 
            updateRegionOptions("N/A", false); 
            break;
    }
    
    filterChanged();
}

// 保持此函数用于内部逻辑，例如地图点击重置所有，但移除HTML中的按钮调用
function resetFilters() {
    currentSelectedCountry = "N/A";
    currentSelectedRegion = "N/A";
    currentSelectedYear = "N/A";
    currentSelectedMonth = "N/A";
    currentSelectedDay = "N/A";
    
    countrySelect.value = "N/A";
    regionSelect.value = "N/A";
    yearSelect.value = "N/A";
    monthSelect.value = "N/A";
    daySelect.value = "N/A";
    
    // 重新更新选项，但不自动选择
    // 只需要调用顶层更新函数，它们会级联
    updateYearOptions(false); 
    updateCountryFromDate(false);
    updateRegionOptions(currentSelectedCountry, false);
    
    filterChanged();
    stopAnimation();
}


function startAnimation() {
    let filteredData = filterData();
    
    // 只有当至少有一个筛选器被选中且有数据时才允许 DETONATE
    let isSelectionActive = (
        currentSelectedCountry !== "N/A" || 
        currentSelectedRegion !== "N/A" || 
        currentSelectedYear !== "N/A" ||
        currentSelectedMonth !== "N/A" ||
        currentSelectedDay !== "N/A"
    ) && filteredData.length > 0;
    
    if (isSelectionActive && !isDataVisible) {
        isDataVisible = true;
        animationFrame = 0;
        dataDisplayFrame = 0;
        particles = []; 
        particlesEmitted = false;
        shakeMagnitude = maxShakeMagnitude; 
        currentRipplesCount = 0; 

        // 找到最匹配或最大的点作为核心显示点
        selectedMapPoint = filteredData.find(d => 
             d.country === currentSelectedCountry && 
             d.uniqueRegionName === currentSelectedRegion &&
             (currentSelectedYear === "N/A" || d.year === currentSelectedYear) &&
             (currentSelectedMonth === "N/A" || d.month === currentSelectedMonth) &&
             (currentSelectedDay === "N/A" || d.day === currentSelectedDay)
        ) || filteredData[filteredData.length - 1] || null; 
        
        loop(); 
        return true;
    }
    return false;
}

function stopAnimation() {
    if (isDataVisible) {
        isDataVisible = false;
        animationFrame = 0;
        dataDisplayFrame = 0;
        particlesEmitted = false;
        shakeMagnitude = 0; 
        currentRipplesCount = 0; 
        loop(); 
        return true;
    }
    return false;
}

function updateSelectedPoint() {
    let filteredData = filterData();

    // 找到最匹配的或最大的点
    let selected = filteredData.find(d => 
        d.country === currentSelectedCountry && 
        d.uniqueRegionName === currentSelectedRegion &&
        (currentSelectedYear === "N/A" || d.year === currentSelectedYear) &&
        (currentSelectedMonth === "N/A" || d.month === currentSelectedMonth) &&
        (currentSelectedDay === "N/A" || d.day === currentSelectedDay)
    ) || filteredData[filteredData.length - 1] || null;
    
    selectedMapPoint = selected;
    
    if (!isDataVisible && particles.length === 0 && hoveredPoint === null) {
         noLoop(); 
    } else {
         loop(); 
    }
}

function filterChanged() {
    stopAnimation();
    updateSelectedPoint();
}

// =================================================================
// === 地图可视化函数 (与之前版本相同，略) ===
// =================================================================

function calculateMapDimensions() {
    if (!mapImg) return;
    
    scaledW = IMG_W * MAP_SCALE_FACTOR;
    scaledH = IMG_H * MAP_SCALE_FACTOR; 
    
    const SHIFT_DOWN_AMOUNT = 50; 

    offsetX = width - scaledW - MAP_MARGIN;
    
    offsetY = height - scaledH - MAP_MARGIN + SHIFT_DOWN_AMOUNT; 
}


function lonToMapX(lon) {
    return map(lon, LON_MIN, LON_MAX, offsetX, offsetX + scaledW);
}

function latToMapY(lat) {
    return map(lat, LAT_MIN, LAT_MAX, offsetY + scaledH, offsetY);
}

function drawMapVisualization() {
    if (!mapImg) return;
    
    push();
    
    translate(offsetX, offsetY);
    
    tint(255, 50); 
    image(mapImg, 0, 0, scaledW, scaledH);
    noTint();
    
    stroke(255, 100);
    strokeWeight(1);
    noFill();
    rect(0, 0, scaledW, scaledH);
    
    for (let d of data) {
        let mapX = lonToMapX(d.lon);
        let mapY = latToMapY(d.lat);
        
        if (mapX < offsetX || mapX > offsetX + scaledW || mapY < offsetY || mapY > offsetY + scaledH) continue;
        
        let dotSize = 3;
        let dotColor = color(DOT_R, DOT_G, DOT_B);
        let alpha = 200;
        let strokeAlpha = 150; 
        
        let isHovered = hoveredPoint === d;
        let isSelected = selectedMapPoint === d;

        if (isHovered || isSelected) {
            dotSize = 20; // *** 修改气泡大小
            strokeAlpha = 0; 
            // ... (省略其他代码) ...
        }

        if (isSelected && frameCount % 30 === 0) { 
            globalRipples.push({
                x: mapX - offsetX, 
                y: mapY - offsetY, 
                radius: 0, 
                maxRadius: 30, 
                alpha: 255,
                waveColor: color(WAVE_R, WAVE_G, WAVE_B, 255), 
            });
        }

        dotColor.setAlpha(alpha);
        fill(dotColor);

        if (strokeAlpha > 0) {
            stroke(255, strokeAlpha);
            strokeWeight(1);
        } else {
            noStroke(); 
        }
        
        circle(mapX - offsetX, mapY - offsetY, dotSize);
    }
    
    if (hoveredPoint) {
        drawHoverInfo(hoveredPoint);
    }
    
    pop();
    
    updateAndDrawGlobalRipples();
}

function drawHoverInfo(d) {
    const INFO_BOX_WIDTH = 120; 
    const INFO_BOX_HEIGHT = 50; 
    const PADDING = 10;
    const X_OFFSET = 10;
    const Y_OFFSET = -INFO_BOX_HEIGHT - 10;
    
    let mapX = lonToMapX(d.lon);
    let mapY = latToMapY(d.lat);
    
    let drawX = mapX - offsetX + X_OFFSET;
    let drawY = mapY - offsetY + Y_OFFSET;

    if (drawX + INFO_BOX_WIDTH > scaledW) {
        drawX = mapX - offsetX - INFO_BOX_WIDTH - X_OFFSET;
    }
    if (drawY < 0) {
        drawY = mapY - offsetY + 10;
    }

    push();
    translate(drawX, drawY);
    
    fill(0, 0, 0, 200);
    noStroke();
    rect(0, 0, INFO_BOX_WIDTH, INFO_BOX_HEIGHT, 5);
    
    fill(255);
    textSize(12);
    textAlign(LEFT, TOP);
    let textY = PADDING;
    
    let lat = d.lat.toFixed(2);
    let lon = d.lon.toFixed(2); 
    
    text(`Lat: ${lat}`, PADDING, textY);
    textY += 16;
    text(`Lon: ${lon}`, PADDING, textY);
    
    pop();
}

function updateAndDrawGlobalRipples() {
     push();
     translate(offsetX, offsetY); 
     
     for (let i = globalRipples.length - 1; i >= 0; i--) {
        let r = globalRipples[i];
        
        r.radius += 0.5; 
        r.alpha -= 5; 
        
        r.waveColor.setAlpha(constrain(r.alpha, 0, 255));
        
        if (r.alpha > 0) {
            noFill();
            stroke(r.waveColor);
            strokeWeight(1.5);
            circle(r.x, r.y, r.radius * 2);
        } else {
            globalRipples.splice(i, 1);
        }
     }
     pop();
}

function mousePressed() {
    let d = dist(mouseX, mouseY, centerX, centerY);
    if (d < coreRadius) {
        if (isDataVisible) {
            stopAnimation();
            
        } else {
            let started = startAnimation();
            if (!started) {
                console.log("Cannot DETONATE: No valid selection with data.");
            }
        }
        return; 
    }
    
    if (data.length > 0) {
        let clickedMapPoint = checkMapClick(mouseX, mouseY);
        if (clickedMapPoint) {
            // 1. 设置国家，重置日期，并自动选择第一个有效日期
            countrySelect.value = clickedMapPoint.country;
            currentSelectedCountry = clickedMapPoint.country;
            
            // 重置日期
            currentSelectedYear = "N/A"; 
            currentSelectedMonth = "N/A"; 
            currentSelectedDay = "N/A"; 
            
            // 强制自动选择
            updateYearOptions(true); 
            
            // 2. 更新地区选项，并选中地区（依赖于新的国家和日期）
            updateRegionOptions(clickedMapPoint.country, false); 
            regionSelect.value = clickedMapPoint.uniqueRegionName;
            currentSelectedRegion = clickedMapPoint.uniqueRegionName;
            
            filterChanged(); 
        }
    }
}

function mouseMoved() {
    // 检查鼠标是否悬停在地图气泡上
    hoveredPoint = checkMapHover(mouseX, mouseY);
    
    // 检查鼠标是否悬停在中心核心区域
    let d = dist(mouseX, mouseY, centerX, centerY);
    let isOverCore = (d < coreRadius);

    // 动态设置鼠标指针样式
    if (isOverCore) {
        // 如果在核心区域，显示小手
        document.getElementById('p5-canvas-container').style.cursor = 'pointer';
    } else if (hoveredPoint) {
        // 如果在地图气泡上，也显示小手
        document.getElementById('p5-canvas-container').style.cursor = 'pointer';
    } else {
        // 否则，恢复默认箭头
        document.getElementById('p5-canvas-container').style.cursor = 'default';
    }

    if (hoveredPoint || isDataVisible || particles.length > 0) {
        loop();
    } else {
         noLoop(); 
    }
}

function checkMapHover(mx, my) {
    let foundPoint = null;
    let tolerance = 8; 

    for (let d of data) {
        let mapX = lonToMapX(d.lon);
        let mapY = latToMapY(d.lat);
        
        if (dist(mx, my, mapX, mapY) < tolerance) {
            foundPoint = d;
            break;
        }
    }
    return foundPoint;
}

function checkMapClick(mx, my) {
    return checkMapHover(mx, my);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    maxOuterRadius = min(width, height) / 2 - 40;
    centerX = width / 2;
    centerY = height / 2;
    calculateMapDimensions();
}