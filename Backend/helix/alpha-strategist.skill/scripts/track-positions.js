#!/usr/bin/env node
/**
 * Position Tracking Manager
 * Manages open positions state for the Alpha Strategist
 * Usage: 
 *   node track-positions.js list
 *   node track-positions.js add <positionJson>
 *   node track-positions.js remove <positionId>
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const POSITIONS_FILE = process.env.POSITIONS_FILE || 
  path.join(__dirname, '..', '..', '..', 'data', 'positions', 'open-positions.json');

function ensurePositionsFile() {
  const dir = path.dirname(POSITIONS_FILE);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  if (!fs.existsSync(POSITIONS_FILE)) {
    fs.writeFileSync(POSITIONS_FILE, JSON.stringify({ positions: [] }, null, 2));
  }
}

function loadPositions() {
  ensurePositionsFile();
  const data = fs.readFileSync(POSITIONS_FILE, 'utf8');
  return JSON.parse(data);
}

function savePositions(data) {
  ensurePositionsFile();
  fs.writeFileSync(POSITIONS_FILE, JSON.stringify(data, null, 2));
}

function listPositions() {
  const data = loadPositions();
  return data.positions;
}

function addPosition(position) {
  const data = loadPositions();
  
  // Add timestamp if not present
  if (!position.openedAt) {
    position.openedAt = Date.now();
  }
  
  // Generate ID if not present
  if (!position.id) {
    position.id = `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  data.positions.push(position);
  savePositions(data);
  
  return position;
}

function removePosition(positionId) {
  const data = loadPositions();
  const index = data.positions.findIndex(p => p.id === positionId);
  
  if (index === -1) {
    throw new Error(`Position ${positionId} not found`);
  }
  
  const removed = data.positions.splice(index, 1)[0];
  savePositions(data);
  
  return removed;
}

function updatePosition(positionId, updates) {
  const data = loadPositions();
  const position = data.positions.find(p => p.id === positionId);
  
  if (!position) {
    throw new Error(`Position ${positionId} not found`);
  }
  
  Object.assign(position, updates);
  savePositions(data);
  
  return position;
}

function getPosition(positionId) {
  const data = loadPositions();
  return data.positions.find(p => p.id === positionId);
}

// CLI execution
if (require.main === module) {
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'list':
        const positions = listPositions();
        console.log(JSON.stringify(positions, null, 2));
        break;
        
      case 'add':
        const positionJson = process.argv[3];
        if (!positionJson) {
          throw new Error('Position JSON required');
        }
        const position = JSON.parse(positionJson);
        const added = addPosition(position);
        console.log(JSON.stringify(added, null, 2));
        break;
        
      case 'remove':
        const positionId = process.argv[3];
        if (!positionId) {
          throw new Error('Position ID required');
        }
        const removed = removePosition(positionId);
        console.log(JSON.stringify(removed, null, 2));
        break;
        
      case 'get':
        const getId = process.argv[3];
        if (!getId) {
          throw new Error('Position ID required');
        }
        const found = getPosition(getId);
        console.log(JSON.stringify(found, null, 2));
        break;
        
      default:
        console.error('Usage: node track-positions.js <list|add|remove|get> [args]');
        process.exit(1);
    }
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

module.exports = {
  listPositions,
  addPosition,
  removePosition,
  updatePosition,
  getPosition
};
