// Flipdot Display Controller
// This handles the web interface for controlling the flipdot display

const flipdotBoard = document.getElementById('flipdotBoard');
const backBtn = document.getElementById('backBtn');
const playPauseBtn = document.getElementById('playPauseBtn');
const forwardBtn = document.getElementById('forwardBtn');

// Initialize canvas size
flipdotBoard.width = 84;  // 28 * 3 panels
flipdotBoard.height = 56; // 14 * 4 panels

// Animation state
let animationFrames = [];
let currentFrame = 0;
let playing = true;
let animationInterval = null;

// Sample animation frames for demonstration
function generateSampleFrames() {
  const frames = [];
  const ctx = flipdotBoard.getContext('2d');
  
  for (let i = 0; i < 10; i++) {
    const frame = document.createElement('canvas');
    frame.width = flipdotBoard.width;
    frame.height = flipdotBoard.height;
    const frameCtx = frame.getContext('2d');
    
    // Create a simple animation pattern
    frameCtx.fillStyle = '#000';
    frameCtx.fillRect(0, 0, frame.width, frame.height);
    
    frameCtx.fillStyle = '#fff';
    const x = (i * 8) % (frame.width - 10);
    const y = (i * 4) % (frame.height - 10);
    frameCtx.fillRect(x, y, 10, 10);
    
    frames.push(frame);
  }
  
  return frames;
}

function eraseBoard() {
  const ctx = flipdotBoard.getContext('2d');
  ctx.clearRect(0, 0, flipdotBoard.width, flipdotBoard.height);
}

function showFrame(frameIdx) {
  if (animationFrames.length === 0) return;
  
  eraseBoard();
  const frame = animationFrames[frameIdx];
  const ctx = flipdotBoard.getContext('2d');
  ctx.drawImage(frame, 0, 0);
}

function playAnimation() {
  if (animationInterval) return;
  playPauseBtn.textContent = 'Pause';
  playing = true;
  animationInterval = setInterval(() => {
    currentFrame = (currentFrame + 1) % animationFrames.length;
    showFrame(currentFrame);
  }, 500);
}

function pauseAnimation() {
  playPauseBtn.textContent = 'Play';
  playing = false;
  clearInterval(animationInterval);
  animationInterval = null;
}

// Event listeners
backBtn.addEventListener('click', () => {
  pauseAnimation();
  currentFrame = (currentFrame - 1 + animationFrames.length) % animationFrames.length;
  showFrame(currentFrame);
});

forwardBtn.addEventListener('click', () => {
  pauseAnimation();
  currentFrame = (currentFrame + 1) % animationFrames.length;
  showFrame(currentFrame);
});

playPauseBtn.addEventListener('click', () => {
  if (playing) {
    pauseAnimation();
  } else {
    playAnimation();
  }
});

// Initialize
animationFrames = generateSampleFrames();
showFrame(currentFrame);
playAnimation();

