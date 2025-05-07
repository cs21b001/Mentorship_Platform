const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Sanitize HTML content
exports.sanitizeHtml = (content) => {
    if (!content) return content;
    
    if (Array.isArray(content)) {
        return content.map(item => typeof item === 'string' ? DOMPurify.sanitize(item) : item);
    }
    
    if (typeof content === 'string') {
        return DOMPurify.sanitize(content);
    }
    
    return content;
}; 