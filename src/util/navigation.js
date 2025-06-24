import moment from 'moment';

const DIRECTIONS = ['RIGHT', 'LEFT', 'FORWARD', 'BACKWARD'];
const distanceThreshold = 0.05; // 10% - rate
const distanceFilter = 0.3; // 50% - jump rate
const distanceNear = 3; // 2 m
const angleStep = 15;
const timeThreshold = 400;
const angleThreshold = 3; // 10% - rate
const defaultTxPower = -42; // default txPower

let currentState, previousState;

currentState = {
  state: DIRECTIONS[2],
  isActive: false,
  orientation: 0, // Starting from North Counterclockwise
  distance: 1,
  stepCount: 0,
  direction: 0,
  directionCounter: 0,
  stateTime: moment().valueOf()
};

// let currentState = previousState;
previousState = currentState;

export const navigate = (sensors) => {
  if (!sensors || !sensors.distance) return;

  if (sensors.useAngle && sensors.closestAngle) {
    return handleInitDirection(sensors);
  }

  // console.log('sensor data:', sensors);
  const { currentDirection, diffAngle } = getDirection(previousState.orientation, sensors.orientation);

  const distanceRate = Math.abs(previousState.distance - sensors.distance) / previousState.distance;
  const angleRate = parseInt(diffAngle / angleStep);
  const isMove = sensors.stepCount > previousState.stepCount;
  const timeSpan = moment().valueOf() - previousState.stateTime;
  currentState.directionCounter = previousState.directionCounter;

  if (
    !isMove &&
    Math.abs(diffAngle) < angleThreshold &&
    (distanceRate < distanceThreshold || distanceRate > distanceFilter || distanceRate < distanceNear)
  ) {
    currentState.distance = sensors.distance;
    currentState.orientation = sensors.orientation;
    currentState.stepCount = sensors.stepCount;
    currentState.stateTime = moment().valueOf();
    // currentState.state = previousState.state;
    // currentState.direction = previousState.direction;
    currentState.isActive = true;
    previousState = currentState;
    return currentState;
  }

  // State Machine
  const activeState = currentState.state;
  // currentState.isActive = false;
  switch (activeState) {
    // State1: Finding the Forward Direction. Rotation - Left/Right
    case DIRECTIONS[0]: // prev state RIGHT
      // Keep Rotating or switch direction unless we have a MOVE
      if (distanceRate > distanceThreshold && sensors.distance < currentState.distance) {
        // Change State to Forward
        // currentState.state = DIRECTIONS[2];
        currentState.directionCounter = 0;
        currentState.isActive = false;
      } else if (distanceRate > distanceThreshold && sensors.distance > currentState.distance) {
        // if (currentDirection === DIRECTIONS[0] && timeSpan > timeThreshold) {
        // if (isMove)
        currentState.directionCounter = currentDirection === DIRECTIONS[0]
            ? previousState.directionCounter - angleRate
            : previousState.directionCounter + angleRate;
        currentState.isActive = currentState.directionCounter > 0;
      } else {
        currentState.isActive = true;
      }
      break;

    case DIRECTIONS[1]: // prev state LEFT
      // Keep Rotating or switch direction unless we have a MOVE
      if (distanceRate > distanceThreshold && sensors.distance <= currentState.distance) {
        // Change State to Forward
        currentState.directionCounter = 0;
        currentState.isActive = false;
      } else if (distanceRate > distanceThreshold && sensors.distance > currentState.distance) {
        // if (isMove)
        currentState.directionCounter = currentDirection === DIRECTIONS[0]
            ? previousState.directionCounter - angleRate
            : previousState.directionCounter + angleRate;
        currentState.isActive = currentState.directionCounter < 0;
      } else {
        // currentState.state = currentDirection;
        currentState.isActive = true;
      }
      break;

    case DIRECTIONS[2]: // prev state FORWARD
      if (distanceRate > distanceThreshold && sensors.distance > currentState.distance) {
        // Change State to rotation
        currentState.isActive = false;
        currentState.directionCounter = 0;
        if (isMove || timeSpan > timeThreshold)
        currentState.directionCounter = currentDirection === DIRECTIONS[0] ? -1 : 1;
      } else {
        // currentState.state = DIRECTIONS[2];
        currentState.isActive = true;
        currentState.directionCounter = 0;
      }
      break;

    // State3: Current state is backward
    default:
      // currentState.state = DIRECTIONS[2];
      currentState.isActive = false;
      currentState.directionCounter = 0;
  }

  currentState.orientation = sensors.orientation;
  currentState.distance = sensors.distance;
  currentState.stepCount = sensors.stepCount;
  currentState.direction = currentState.directionCounter * angleStep;
  currentState.state = getRotation(currentState.direction);
  currentState.stateTime = moment().valueOf();

  let transitionState = currentState.isActive ? currentState : previousState;
  previousState = { ...currentState };

  return transitionState;
};

export const rssiToDistance = (rssi) => {
  if (!rssi) return;
  const ratio = Number(rssi) / defaultTxPower;
  return 0.89976 * Math.pow(ratio, 4.5) + 0.5;
};

const handleInitDirection = (sensors) => {
  const { currentDirection, diffAngle } = getDirection(currentState.orientation, sensors.closestAngle.alpha);
  console.log(currentState.orientation, sensors.closestAngle.alpha);
  console.log(currentDirection, diffAngle);
  currentState.state = currentDirection;
  currentState.distance = sensors.distance;
  currentState.orientation = sensors.diffAngle;
  currentState.stepCount = sensors.stepCount;
  currentState.stateTime = moment().valueOf();
  currentState.isActive = true;
  currentState.direction = -diffAngle;
  previousState = currentState;
  console.log(currentState);
  return currentState;
};

const getDirection = (orientation1, orientation2) => {
  let diff = ((orientation2 - orientation1 + 540) % 360) - 180;

  // if difference in angle is less then 10 degrees then ignore
  if (Math.abs(diff) < angleThreshold) {
    return { currentDirection: previousState.state, diffAngle: diff };
  } else if (diff >= 0) return { currentDirection: DIRECTIONS[1], diffAngle: diff };

  return { currentDirection: DIRECTIONS[0], diffAngle: diff };
};

const getRotation = (angle) => {
  if (angle === 0) {
    return DIRECTIONS[2];
  } else if ((angle > 0 && angle < 180) || (angle < 0 && Math.abs(angle) > 180)) {
    return DIRECTIONS[0];
  } else return DIRECTIONS[1];
};
