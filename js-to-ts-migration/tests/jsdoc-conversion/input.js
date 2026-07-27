/**
 * Adds two numbers together
 * @param {number} a First number
 * @param {number} b Second number
 * @returns {number} Sum of a and b
 */
function add(a, b) {
  return a + b;
}

/**
 * Greets a user
 * @param {string} name User's name
 * @returns {string} Greeting message
 */
const greet = (name) => {
  return `Hello, ${name}!`;
};

/**
 * @typedef {Object} User
 * @property {string} name
 * @property {number} age
 */

/**
 * Processes a user
 * @param {User} user User object
 * @returns {void}
 */
function processUser(user) {
  console.log(user.name);
}
