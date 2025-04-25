const { stopDocker } = require('./docker-control');

module.exports = async () => {
  await stopDocker();
};
