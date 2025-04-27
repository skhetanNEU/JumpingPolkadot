import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Web3 from 'web3';
import contractjson from './details/contract.json';

// Contract setup
const ADDRESS = "0x02012969BC9c9428f877524C05e557d93792A9e4";
const loadedData = JSON.stringify(contractjson);
const abi = JSON.parse(loadedData);
let contract = null;
let selectedAccount = null;

function App() {
  // Game state
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [platforms, setPlatforms] = useState([]);
  const [countdown, setCountdown] = useState(3);
  const [countdownStarted, setCountdownStarted] = useState(false);
  const [selected, setSelected] = useState(null);
  
  // Game dimensions
  const [dimensions, setDimensions] = useState({ 
    width: window.innerWidth, 
    height: window.innerHeight 
  });

  // Refs for direct DOM manipulation and animation
  const gameContainerRef = useRef(null);
  const ballRef = useRef(null);
  const animationRef = useRef(null);
  const platformRefs = useRef({});
  
  // Game state ref for animation
  const gameStateRef = useRef({
    ballX: 0,
    ballY: 0,
    ballSpeedX: 0,
    ballSpeedY: 0,
    leftPressed: false,
    rightPressed: false,
    platforms: [],
    gameRunning: false,
    score: 0,
    maxHeightReached: 0,
    viewportOffset: 0,
    difficultyTimer: 0,
    currentLevel: 0,
    lastUpdateTime: 0
  });
  
  // Constants
  const ballSize = { width: 40, height: 40 };
  const platformSize = { width: 100, height: 20 };
  const publicCost = 1000000000000000000; // 0.1 ETH in wei
  const gravity = 0.4;
  const jumpForce = -15;
  const levelHeight = 200;
  const levelSpacing = 100;
  
  // Handle window resize
  useEffect(() => {
    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Platform moving animation - runs independently of game state
  useEffect(() => {
    let movingPlatformsTimer;
    
    if (gameStarted && !gameOver) {
      const updateMovingPlatforms = () => {
        const gameState = gameStateRef.current;
        const now = Date.now();
        const deltaTime = (now - gameState.lastUpdateTime) / 16; // Convert to approximate frames
        gameState.lastUpdateTime = now;
        
        // Update positions of moving platforms in the DOM directly
        gameState.platforms.forEach(platform => {
          if (platform.isMoving && platformRefs.current[platform.id]) {
            // Update position in game state
            platform.x += platform.direction * platform.speed * deltaTime;
            
            // Reverse direction at edges
            if (platform.x <= 0 || platform.x + platform.width >= dimensions.width) {
              platform.direction *= -1;
            }
            
            // Update DOM element directly
            const platformElement = platformRefs.current[platform.id];
            if (platformElement) {
              platformElement.style.left = `${platform.x}px`;
            }
          }
        });
        
        movingPlatformsTimer = requestAnimationFrame(updateMovingPlatforms);
      };
      
      gameStateRef.current.lastUpdateTime = Date.now();
      movingPlatformsTimer = requestAnimationFrame(updateMovingPlatforms);
      
      return () => {
        if (movingPlatformsTimer) {
          cancelAnimationFrame(movingPlatformsTimer);
        }
      };
    }
  }, [gameStarted, gameOver, dimensions.width]);

  // Connect to blockchain
  useEffect(() => {
    async function checkNetwork() {
      let provider = window.ethereum;
      if (!provider) {
        toast.error('Please install Metamask', { autoClose: 3000 });
        return;
      }
      
      const web3 = new Web3(provider);
      provider.on('chainChanged', () => window.location.reload());
      provider.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          selectedAccount = accounts[0];
          setSelected(selectedAccount.slice(0, 5) + '...' + selectedAccount.slice(-4));
        } else {
          window.location.reload();
        }
      });
      
      let accounts = await web3.eth.getAccounts();
      if (accounts.length > 0) {
        selectedAccount = accounts[0];
        setSelected(selectedAccount.slice(0, 5) + '...' + selectedAccount.slice(-4));
      }
    }
    
    checkNetwork();
  }, []);

  // Connect wallet
  async function onConnectClick() {
    let provider = window.ethereum;
    if (typeof provider !== 'undefined') {
      try {
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        selectedAccount = accounts[0];
        setSelected(selectedAccount.slice(0, 5) + '...' + selectedAccount.slice(-4));
      } catch (err) {
        console.log(err);
        toast.error('Connection rejected', { autoClose: 3000 });
      }
    } else {
      toast.error('Please install Metamask wallet', { autoClose: 3000 });
    }
  }

  // Generate a level with platforms
  function generateLevel(baseY) {
    const gameState = gameStateRef.current;
    const numPlatforms = 5 + Math.floor(Math.random() * 4); // 5-8 platforms per level
    const usedPositions = [];
    const newPlatforms = [];
    
    // Add solid platforms
    for (let i = 0; i < numPlatforms; i++) {
      let platformX;
      let overlap = true;
      let attempts = 0;
      
      // Try to find a position that doesn't overlap with existing platforms
      while (overlap && attempts < 10) {
        platformX = Math.random() * (dimensions.width - platformSize.width);
        overlap = false;
        
        // Check for overlap with already placed platforms
        for (let pos of usedPositions) {
          if (Math.abs(platformX - pos) < platformSize.width * 1.2) {
            overlap = true;
            break;
          }
        }
        attempts++;
      }
      
      // Create new platform
      const platformId = `platform-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`;
      const newPlatform = {
        id: platformId,
        x: platformX,
        y: baseY,
        width: platformSize.width,
        height: platformSize.height,
        isMoving: false,
        type: 'platform',
        level: Math.floor(baseY / levelHeight)
      };
      
      newPlatforms.push(newPlatform);
      usedPositions.push(platformX);
    }
    
    // Add moving platforms between this level and the next (2-3 moving platforms)
    const numMovingPlatforms = 2 + Math.floor(Math.random() * 2);
    const movingY = baseY - levelSpacing;
    
    for (let i = 0; i < numMovingPlatforms; i++) {
      let platformX;
      let overlap = true;
      let attempts = 0;
      
      // Try to find a position that doesn't overlap
      while (overlap && attempts < 10) {
        platformX = Math.random() * (dimensions.width - platformSize.width);
        overlap = false;
        
        // Check for overlap with existing positions
        for (let pos of usedPositions) {
          if (Math.abs(platformX - pos) < platformSize.width * 1.2) {
            overlap = true;
            break;
          }
        }
        attempts++;
      }
      
      // Create moving platform
      const platformId = `moving-${Date.now()}-${i}-${Math.random().toString(36).substring(7)}`;
      const newMovingPlatform = {
        id: platformId,
        x: platformX,
        y: movingY,
        width: platformSize.width,
        height: platformSize.height,
        isMoving: true,
        direction: Math.random() > 0.5 ? 1 : -1,
        speed: 1 + Math.random() * 2,
        type: 'moving-platform',
        level: Math.floor(movingY / levelHeight)
      };
      
      newPlatforms.push(newMovingPlatform);
      usedPositions.push(platformX);
    }
    
    // Update game state with new platforms
    gameState.platforms = [...gameState.platforms, ...newPlatforms];
    
    // Update React state for rendering
    setPlatforms(prevPlatforms => [...prevPlatforms, ...newPlatforms]);
  }

  // Initialize game
  function startGame() {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    setGameOver(false);
    setScore(0);
    setGameStarted(true);
    
    // Reset platform refs
    platformRefs.current = {};
    
    // Initialize ball position
    const initialBallX = dimensions.width / 2 - ballSize.width / 2;
    const initialBallY = dimensions.height / 2;
    
    // Reset game state ref
    gameStateRef.current = {
      ballX: initialBallX,
      ballY: initialBallY,
      ballSpeedX: 0,
      ballSpeedY: 0,
      leftPressed: false,
      rightPressed: false,
      platforms: [],
      gameRunning: true,
      score: 0,
      maxHeightReached: 0,
      viewportOffset: 0,
      difficultyTimer: 0,
      currentLevel: 0,
      lastUpdateTime: Date.now()
    };
    
    // Clear all platforms
    setPlatforms([]);
    
    // Add initial platform right under the ball
    const initialPlatform = {
      id: `initial-platform-${Date.now()}`,
      x: dimensions.width / 2 - platformSize.width / 2,
      y: dimensions.height / 2 + ballSize.height,
      width: platformSize.width,
      height: platformSize.height,
      isMoving: false,
      type: 'platform',
      level: 0
    };
    
    gameStateRef.current.platforms = [initialPlatform];
    setPlatforms([initialPlatform]);
    
    // Generate initial set of levels
    for (let i = 1; i <= 5; i++) {
      generateLevel(dimensions.height / 2 - i * levelHeight);
    }
    
    // Set up keyboard controls
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    // Start game loop
    startGameLoop();
  }
  
  // Game loop
  function startGameLoop() {
    const gameLoop = () => {
      if (gameStateRef.current.gameRunning) {
        update();
        render();
        animationRef.current = requestAnimationFrame(gameLoop);
      }
    };
    
    animationRef.current = requestAnimationFrame(gameLoop);
  }
  
  // Update game state
  function update() {
    const gameState = gameStateRef.current;
    
    // Move ball horizontally
    if (gameState.rightPressed) {
      gameState.ballSpeedX = 7;
    } else if (gameState.leftPressed) {
      gameState.ballSpeedX = -7;
    } else {
      gameState.ballSpeedX *= 0.9; // Friction
    }
    
    gameState.ballX += gameState.ballSpeedX;
    
    // Wrap around screen edges (ball can go through sides and reappear on the other side)
    if (gameState.ballX > dimensions.width) {
      gameState.ballX = -ballSize.width;
    } else if (gameState.ballX + ballSize.width < 0) {
      gameState.ballX = dimensions.width;
    }
    
    // Apply gravity
    gameState.ballSpeedY += gravity;
    gameState.ballY += gameState.ballSpeedY;
    
    // Check platform collision
    if (checkPlatformCollision()) {
      gameState.ballSpeedY = jumpForce;
      
      // Add jump effect
      if (ballRef.current) {
        ballRef.current.style.transform = 'translateZ(40px) scale(1.1)';
        setTimeout(() => {
          if (ballRef.current) {
            ballRef.current.style.transform = 'translateZ(20px) scale(1)';
          }
        }, 200);
      }
    }
    
    // Move viewport when player goes up
    if (gameState.ballY < dimensions.height / 2) {
      gameState.viewportOffset = dimensions.height / 2 - gameState.ballY;
      
      // Update max height and score
      gameState.maxHeightReached += gameState.viewportOffset;
      
      // Calculate score based on maximum height reached
      gameState.score = Math.floor(gameState.maxHeightReached / 10);
      setScore(gameState.score);
      
      // Update platform positions
      for (let i = 0; i < gameState.platforms.length; i++) {
        gameState.platforms[i].y += gameState.viewportOffset;
        
        // Update platform DOM element position
        const platformElement = platformRefs.current[gameState.platforms[i].id];
        if (platformElement) {
          platformElement.style.top = `${gameState.platforms[i].y}px`;
        }
      }
      
      // Keep ball in the middle of the screen vertically
      gameState.ballY = dimensions.height / 2;
      
      // Check if we need to generate a new level
      let minY = Number.MAX_VALUE;
      for (let i = 0; i < gameState.platforms.length; i++) {
        if (gameState.platforms[i].y < minY) {
          minY = gameState.platforms[i].y;
        }
      }
      
      if (minY > 0) {
        gameState.currentLevel++;
        generateLevel(-levelHeight);
      }
      
      // Update React state for rendering occasionally (not every frame)
      if (Math.random() < 0.1) { // 10% chance each frame to update React state
        setPlatforms([...gameState.platforms]);
      }
    }
    
    // Skip updating platform positions in the game loop - this is now done in the separate useEffect
    
    // Remove platforms that went off-screen
    const remainingPlatforms = gameState.platforms.filter(platform => platform.y < dimensions.height + 100);
    
    if (remainingPlatforms.length !== gameState.platforms.length) {
      gameState.platforms = remainingPlatforms;
      setPlatforms([...remainingPlatforms]);
    }
    
    // Game over if ball falls off-screen
    if (gameState.ballY > dimensions.height) {
      triggerGameOver();
    }
    
    // Increase difficulty over time
    gameState.difficultyTimer++;
    if (gameState.difficultyTimer > 1500) {
      gameState.difficultyTimer = 0;
      
      // Increase platform speed for moving platforms
      for (let i = 0; i < gameState.platforms.length; i++) {
        const platform = gameState.platforms[i];
        if (platform.isMoving) {
          platform.speed = Math.min(platform.speed + 0.5, 5);
        }
      }
    }
  }
  
  // Check platform collision
  function checkPlatformCollision() {
    const gameState = gameStateRef.current;
    
    // Only check when ball is falling
    if (gameState.ballSpeedY > 0) {
      for (let i = 0; i < gameState.platforms.length; i++) {
        const p = gameState.platforms[i];
        if (
          gameState.ballX + ballSize.width > p.x &&
          gameState.ballX < p.x + p.width &&
          gameState.ballY + ballSize.height >= p.y &&
          gameState.ballY + ballSize.height <= p.y + p.height + 5 // Added a little more tolerance
        ) {
          // Ball is on top of a platform
          return true;
        }
      }
    }
    return false;
  }
  
  // Render game objects
  function render() {
    const gameState = gameStateRef.current;
    
    // Update ball position and rotation for 3D effect
    if (ballRef.current) {
      const rotationX = gameState.ballSpeedY * 2;
      const rotationZ = -gameState.ballSpeedX * 2;
      
      ballRef.current.style.left = `${gameState.ballX}px`;
      ballRef.current.style.top = `${gameState.ballY}px`;
      ballRef.current.style.transform = `translateZ(20px) rotateX(${rotationX}deg) rotateZ(${rotationZ}deg)`;
    }
  }
  
  // Store platform ref
  const storePlatformRef = (id, element) => {
    if (element) {
      platformRefs.current[id] = element;
    }
  };
  
  // Handle game over state
  function triggerGameOver() {
    const gameState = gameStateRef.current;
    gameState.gameRunning = false;
    setGameOver(true);
    setGameStarted(false);
    
    // Clean up event listeners
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('keyup', handleKeyUp);
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchend', handleTouchEnd);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if(gameState.score >= 5000){
      // Process blockchain reward
      processPayback(); 
    }
    
  }
  
  // Process blockchain reward
  async function processPayback() {
    let provider = window.ethereum;
    if (provider) {
      const web3 = new Web3(provider);
      let accounts = await web3.eth.getAccounts();
      
      if (accounts.length > 0) {
        contract = new web3.eth.Contract(abi, ADDRESS);
        
        try {
          const receipt = await contract.methods.Payback(gameStateRef.current.score).send({ from: accounts[0] });
          
          if (receipt.status) {
            toast.success('Transaction successful, reward sent!', { autoClose: 3000 });
          } else {
            toast.error('Transaction failed', { autoClose: 3000 });
          }
        } catch (error) {
          toast.error('Transaction rejected', { autoClose: 3000 });
        }
      }
    }
  }
  
  // Keyboard event handlers
  function handleKeyDown(e) {
    if (!gameStateRef.current.gameRunning) return;
    
    if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      gameStateRef.current.rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      gameStateRef.current.leftPressed = true;
    }
  }
  
  function handleKeyUp(e) {
    if (!gameStateRef.current.gameRunning) return;
    
    if (e.key === "Right" || e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
      gameStateRef.current.rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      gameStateRef.current.leftPressed = false;
    }
  }
  
  // Touch controls for mobile
  function handleTouchStart(e) {
    if (!gameStateRef.current.gameRunning) return;
    
    const touchX = e.touches[0].clientX;
    if (touchX < dimensions.width / 2) {
      gameStateRef.current.leftPressed = true;
      gameStateRef.current.rightPressed = false;
    } else {
      gameStateRef.current.rightPressed = true;
      gameStateRef.current.leftPressed = false;
    }
  }
  
  function handleTouchEnd() {
    if (!gameStateRef.current.gameRunning) return;
    
    gameStateRef.current.leftPressed = false;
    gameStateRef.current.rightPressed = false;
  }

  // Start game button handler (with MetaMask transaction)
  async function onPlayClick() {
    let provider = window.ethereum;
    if (!provider) {
      toast.error('Please install Metamask wallet', { autoClose: 3000 });
      return;
    }
    
    const web3 = new Web3(provider);
    let accounts = await web3.eth.getAccounts();
    
    if (accounts.length === 0) {
      toast.error('Please connect Metamask wallet', { autoClose: 3000 });
      return;
    }
    
    contract = new web3.eth.Contract(abi, ADDRESS);
    
    try {
      toast.info('Transaction in process', { autoClose: 3000 });
      const receipt = await contract.methods.startPlay().send({ 
        from: accounts[0], 
        value: publicCost 
      });

      if (receipt.status) {
        toast.success('Transaction successful, countdown starting', { autoClose: 3000 });
        setCountdownStarted(true);
        
        let countdownValue = 3;
        const countdownInterval = setInterval(() => {
          setCountdown(countdownValue);
          countdownValue -= 1;
          
          if (countdownValue < 0) {
            clearInterval(countdownInterval);
            setCountdownStarted(false);
            startGame();
          }
        }, 1000);
      } else {
        toast.error('Transaction failed', { autoClose: 3000 });
      }
    } catch (error) {
      toast.error('Transaction rejected', { autoClose: 3000 });
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Countdown component
  const Countdown = ({ countdown }) => (
    <div className="countdown" style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '72px',
      color: 'white',
      textShadow: '0 0 20px rgba(255, 255, 255, 0.8)',
      zIndex: 200
    }}>
      <h1>{countdown}</h1>
    </div>
  );

  return (
    <div className="App">
      <div className="header">
        <div className="header-container" style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          width: '100%',
          position: 'absolute',
          left: 0,
          right: 0,
          zIndex: 1
        }}>
          <h1 className="siteName">Jumping Polkadot</h1>
        </div>
        <div className="connectWallet" style={{ position: 'relative', zIndex: 2 }}>
          {selected !== null ? (
            <button className="connectWalletButton">Connected {selected}</button>
          ) : (
            <button className="connectWalletButton" onClick={onConnectClick}>
              Connect to Metamask Wallet
            </button>
          )}
        </div>
      </div>
      
      <div 
        className="game-container"
        ref={gameContainerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: 'calc(100vh - 80px)',
          perspective: '1000px',
          overflow: 'hidden',
          fontFamily: "'Arial', sans-serif",
          background: 'linear-gradient(to bottom, #1a2a6c, #b21f1f, #fdbb2d)'
        }}
      >
        <div 
          className="background-layer"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              radial-gradient(circle at 50% 30%, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
            opacity: 0.5,
            pointerEvents: 'none'
          }}
        />
        
        {gameStarted && (
          <div 
            id="score"
            className="score"
            style={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              fontSize: '24px',
              color: 'white',
              zIndex: 100,
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
            }}
          >
            Score: {score}
          </div>
        )}
        
        {gameStarted && (
          <div 
            id="ball"
            className="ball"
            ref={ballRef}
            style={{
              position: 'absolute',
              width: `${ballSize.width}px`,
              height: `${ballSize.height}px`,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #ff9966, #ff5e62)',
              boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
              zIndex: 10,
              transformStyle: 'preserve-3d',
              transform: 'translateZ(20px)',
              left: `${dimensions.width / 2 - ballSize.width / 2}px`,
              top: `${dimensions.height / 2}px`
            }}
          />
        )}
        
        {gameStarted && platforms.map(platform => (
          <div
            key={platform.id}
            id={platform.id}
            ref={(el) => storePlatformRef(platform.id, el)}
            className={platform.isMoving ? 'platform moving-platform' : 'platform'}
            style={{
              position: 'absolute',
              width: `${platform.width}px`,
              height: `${platform.height}px`,
              background: platform.isMoving 
                ? 'linear-gradient(to bottom, #60a5fa, #2563eb)'
                : 'linear-gradient(to bottom, #4ade80, #16a34a)',
              borderRadius: '10px',
              boxShadow: '0 5px 10px rgba(0, 0, 0, 0.2)',
              transformStyle: 'preserve-3d',
              transform: 'translateZ(10px)',
              left: `${platform.x}px`,
              top: `${platform.y}px`
            }}
          />
        ))}
        
        {gameOver && (
          <div
            className="game-over"
            id="gameOver"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '48px',
              color: 'white',
              textAlign: 'center',
              backgroundColor: 'rgba(0, 0, 0, 1)',
              padding: '40px',
              borderRadius: '20px',
              zIndex: 100,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              opacity: 1
            }}
          >
            Game Over
            <div className="final-score" style={{
              fontSize: '36px',
              margin: '20px 0',
              color: '#4ade80',
              textShadow: '0 0 10px rgba(74, 222, 128, 0.6)'
            }}>
              Score: {score}
            </div>
            <button
              className="restart-btn"
              onClick={onPlayClick}
              style={{
                marginTop: '30px',
                padding: '15px 30px',
                fontSize: '24px',
                cursor: 'pointer',
                background: 'linear-gradient(to right, #4ade80, #16a34a)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                transition: 'all 0.3s ease'
              }}
            >
              Play Again
            </button>
          </div>
        )}
        
        {countdownStarted && <Countdown countdown={countdown} />}
        
        {!gameStarted && !countdownStarted && (
          <button 
            className="playButton" 
            onClick={onPlayClick}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              padding: '20px 60px',
              fontSize: '32px',
              background: 'linear-gradient(to right, #4ade80, #16a34a)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
              boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.3s ease',
              hover: {
                transform: 'scale(1.05) translate(-50%, -50%)'
              }
            }}
          >
            Play
          </button>
        )}
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default App;