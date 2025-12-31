function startTimer() {
  return Date.now();
}

function endTimer(startTime) {
  return Date.now() - startTime;
}

module.exports = {
  startTimer,
  endTimer,
};
