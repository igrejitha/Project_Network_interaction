
const canvasEnhanced = document.getElementById('networkCanvasEnhanced');
const ctxEnhanced = canvasEnhanced.getContext('2d');
//const nodeLabel = document.getElementById('nodeLabel');
//const tooltipDiv = document.getElementById('networkAnimationTooltip');
canvasEnhanced.width = canvasEnhanced.parentElement.offsetWidth;
canvasEnhanced.height = canvasEnhanced.parentElement.offsetHeight;

const phrases = [
    "Empower your projects with Cybereum's cutting-edge platform.",
    "Dive deep into data-driven decision-making.",
    "Harness the power of Cybereum's futuristic platform.",
    "Blend of advanced algorithms and intuitive design.",
    "ML for forecasting, AI for intelligence, DLT for collaboration.",
    "Every piece of data tells a story with Cybereum.",
    "Redefine the boundaries of project management.",
    "We offer experiences, not just tools.",
    "Revolutionize the way you perceive project management.",
    "Take a leap into the future with Cybereum.",
    "Experience the next-gen project analytics.",
    "Where innovation meets intuition.",
    "Your project's success, our priority.",
    "Elevate project management norms through Cybereum",
    "Strategic choices through data-driven insights.",
    "Leapfrog into the future with Cybereum at your side.",
    "Predictive analytics, intelligent AI, and collaborative DLT - Cybereum's trifecta."
];

const connectionLabel = document.getElementById('connectionLabel');
const synergyPhrases = [
    "Synergistic combination of AI & DLT",
    "DLT for collaboration",
    "AI for intelligence and assistance",
    "ML for forecasting",
    "Connecting project teams into a symbiotic organization"
];
let lastPhraseIndex = -1;  // to keep track of last shown phrase

class NodeEnhanced {
    constructor(x, y, phrase) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.radius = Math.random() * 5 + 5;
        this.color = 'rgba(205, 250, 255, 0.8)';
        this.phrase = phrase;
    }

    draw() {
        ctxEnhanced.beginPath();
        ctxEnhanced.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctxEnhanced.fillStyle = this.color;
        ctxEnhanced.fill();
        ctxEnhanced.shadowColor = 'rgba(205, 250, 255, 1)';
        ctxEnhanced.shadowBlur = 15;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvasEnhanced.width) this.vx = -this.vx;
        if (this.y < 0 || this.y > canvasEnhanced.height) this.vy = -this.vy;

        this.draw();
    }
}

const nodesEnhanced = [];
for (let i = 0; i < phrases.length; i++) {
    const x = Math.random() * canvasEnhanced.width;
    const y = Math.random() * canvasEnhanced.height;
    nodesEnhanced.push(new NodeEnhanced(x, y, phrases[i]));
}

canvasEnhanced.addEventListener('mousemove', (e) => {
    const tooltipDiv = document.getElementById('networkAnimationTooltip');
    const rect = canvasEnhanced.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let closestNodes = [];
    nodesEnhanced.forEach(node => {
        if (Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2) < Math.pow(node.radius * 7, 2)) {
            closestNodes.push(node);
        }
    });

    if (closestNodes.length === 1) {
        tooltipDiv.style.display = 'block';  // Make the tooltip visible
        tooltipDiv.innerHTML = closestNodes[0].phrase;
        tooltipDiv.style.left = `${closestNodes[0].x}px`;
        tooltipDiv.style.top = `${closestNodes[0].y - 20}px`; // Above the node
        tooltipDiv.style.transform = 'scale(1)';
        tooltipDiv.style.opacity = '1';
    } else if (closestNodes.length >= 2) {
        console.log('Two or more closest nodes found!');  // Debug line
        const midX = (closestNodes[0].x + closestNodes[1].x) / 2;
        const midY = (closestNodes[0].y + closestNodes[1].y) / 2;

        lastPhraseIndex = (lastPhraseIndex + 1) % synergyPhrases.length;
        connectionLabel.innerHTML = synergyPhrases[lastPhraseIndex];
        connectionLabel.style.left = `${midX}px`;
        connectionLabel.style.top = `${midY}px`;
        connectionLabel.style.display = 'block';  // <-- Make sure you're setting display to block
        connectionLabel.style.transform = 'scale(1)';
        connectionLabel.style.opacity = '1';
        connectionLabel.style.animation = 'fadeIn 0.5s ease-out';
    } else {
        tooltipDiv.style.display = 'none';  // Hide the tooltip
        connectionLabel.style.display = 'none';  // <-- Also hide the connectionLabel
        connectionLabel.style.transform = 'scale(0)';
        connectionLabel.style.opacity = '0';
        tooltipDiv.style.transform = 'scale(0)';
        tooltipDiv.style.opacity = '0';
    }
});

let connectionDivs = [];

const maxConnections = nodesEnhanced.length * (nodesEnhanced.length - 1) / 2;
const connectionPool = Array.from({ length: maxConnections }, (_, i) => {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.padding = '5px 10px';
    div.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    div.style.borderRadius = '5px';
    div.style.color = '#cdfaff';
    div.style.pointerEvents = 'none';
    div.style.fontSize = '14px';
    div.style.zIndex = '1000';
    div.style.display = 'none';
    document.querySelector('.project-network-animation-enhanced').appendChild(div);
    return div;
});

// Create a mapping to store a synergy phrase for each unique pair of nodes
const nodePairToSynergyPhrase = new Map();

function animateEnhanced() {
    ctxEnhanced.clearRect(0, 0, canvasEnhanced.width, canvasEnhanced.height);

    nodesEnhanced.forEach(node => {
        node.update();
    });

    connectionLabel.style.display = 'none';  // Hide the connectionLabel by default

    for (let i = 0; i < nodesEnhanced.length; i++) {
        for (let j = i + 1; j < nodesEnhanced.length; j++) {
            const dx = nodesEnhanced[i].x - nodesEnhanced[j].x;
            const dy = nodesEnhanced[i].y - nodesEnhanced[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 150) {
                ctxEnhanced.beginPath();
                ctxEnhanced.moveTo(nodesEnhanced[i].x, nodesEnhanced[i].y);
                ctxEnhanced.lineTo(nodesEnhanced[j].x, nodesEnhanced[j].y);
                ctxEnhanced.strokeStyle = 'rgba(205, 250, 255, ' + (1 - distance / 150) + ')';
                ctxEnhanced.lineWidth = 0.5;
                ctxEnhanced.stroke();

                // Show the connectionLabel between the nodes
                const midX = (nodesEnhanced[i].x + nodesEnhanced[j].x) / 2;
                const midY = (nodesEnhanced[i].y + nodesEnhanced[j].y) / 2;

                // Create a unique identifier for each pair of nodes
                const nodePairIdentifier = `${i}-${j}`;

                // Assign a synergy phrase to each unique pair of nodes, if not already done
                if (!nodePairToSynergyPhrase.has(nodePairIdentifier)) {
                    nodePairToSynergyPhrase.set(nodePairIdentifier, synergyPhrases[lastPhraseIndex]);
                    lastPhraseIndex = (lastPhraseIndex + 1) % synergyPhrases.length;
                }

                connectionLabel.innerHTML = nodePairToSynergyPhrase.get(nodePairIdentifier);
                connectionLabel.style.left = `${midX}px`;
                connectionLabel.style.top = `${midY}px`;
                connectionLabel.style.display = 'block';  // Make sure you're setting display to block
            }
        }
    }

    requestAnimationFrame(animateEnhanced);
}


animateEnhanced();

document.querySelector('.block-title.text-white').addEventListener('mouseover', function () {
    this.style.color = '#5ac8fa';  // Change to the desired "lit up" color
    this.style.textShadow = '0 0 15px #5ac8fa';  // Adds a glow effect
});

document.querySelector('.block-title.text-white').addEventListener('mouseout', function () {
    this.style.color = 'white';  // Resets to the original color
    this.style.textShadow = '0 0 10px #5ac8fa';  // Resets to the original shadow
});