/**
 * Debounce a function call.
 * @param {Function} fn - function to debounce
 * @param {number} ms - delay in milliseconds (default: 300)
 * @returns {Function} debounced function
 */
export function debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), ms);
    };
}
