const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

const parseResume = async (filePath, mimetype) => {
  let parser = null;
  try {
    let text = '';
    const ext = path.extname(filePath).toLowerCase();
    const isPdf = mimetype === 'application/pdf' || ext === '.pdf';
    const isDocx = mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ext === '.docx';
    const isDoc = mimetype === 'application/msword' || ext === '.doc';

    if (isPdf) {
      const dataBuffer = fs.readFileSync(filePath);
      parser = new PDFParse({ data: dataBuffer });
      const data = await parser.getText();
      text = data?.text || '';
    } else if (isDocx || isDoc) {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value || '';
    } else {
      throw new Error(`Unsupported file format: ${ext || mimetype}`);
    }

    return text.trim();
  } catch (error) {
    console.error(`Error parsing resume (${filePath}):`, error.message);
    return '';
  } finally {
    if (parser && typeof parser.destroy === 'function') {
      try {
        await parser.destroy();
      } catch (e) {
        // Safe destroy ignoring cleanup error
      }
    }
  }
};

const cleanPhone = (raw) => {
  if (!raw) return '';
  // Strip characters except leading '+', '(', or digits, and trailing ')' or digits
  return raw.replace(/^[^\d+(]+|[^\d)]+$/g, '').trim();
};

const extractPhone = (text) => {
  if (!text || typeof text !== 'string') return '';

  // 1. Explicitly labeled phone numbers (highest confidence)
  // e.g. 'Phone: +91 75503 06962', 'Mobile: 7550306962', 'Contact: (123) 456-7890'
  const labeledRegex = /(?:phone|mobile|tel|telephone|cell|contact|ph\b)[\s.:#*-]*((?:\+\d{1,3}[\s.-]*)?(?:\(?\d{2,5}\)?[\s.-]*)?\d{3,5}[\s.-]?\d{3,5}(?:[\s.-]?\d{1,4})?)/i;
  const labeledMatch = text.match(labeledRegex);
  if (labeledMatch) {
    const cleaned = cleanPhone(labeledMatch[1]);
    const digitCount = (cleaned.match(/\d/g) || []).length;
    if (digitCount >= 7 && digitCount <= 15) {
      return cleaned;
    }
  }

  // 2. International phone numbers with +country code
  // e.g. '+91 75503 06962', '+91-75503-06962', '+1 (555) 123-4567', '+44 20 7946 0958', '+91 9876543210'
  const intlRegex = /\+\d{1,3}[\s.-]?(?:\(?\d{2,5}\)?[\s.-]*)?\d{3,5}[\s.-]?\d{4,5}(?:[\s.-]?\d{1,4})?/g;
  const intlMatches = text.match(intlRegex);
  if (intlMatches) {
    for (const match of intlMatches) {
      const cleaned = cleanPhone(match);
      const digitCount = (cleaned.match(/\d/g) || []).length;
      if (digitCount >= 10 && digitCount <= 15) {
        return cleaned;
      }
    }
  }

  // 3. Indian 5+5 format: '75503 06962', '75503-06962'
  const fivePlusFiveRegex = /\b[6-9]\d{4}[\s.-]\d{5}\b/g;
  const fiveMatches = text.match(fivePlusFiveRegex);
  if (fiveMatches) {
    for (const match of fiveMatches) {
      const cleaned = cleanPhone(match);
      const digitCount = (cleaned.match(/\d/g) || []).length;
      if (digitCount === 10) {
        return cleaned;
      }
    }
  }

  // 4. Standard 3-group formatted national numbers: '(555) 123-4567', '555-123-4567', '123.456.7890'
  const formattedRegex = /(?:\(?\d{3}\)?[\s.-])\d{3}[\s.-]\d{4}/g;
  const formattedMatches = text.match(formattedRegex);
  if (formattedMatches) {
    for (const match of formattedMatches) {
      const cleaned = cleanPhone(match);
      const digitCount = (cleaned.match(/\d/g) || []).length;
      if (digitCount >= 10 && digitCount <= 12) {
        return cleaned;
      }
    }
  }

  // 5. Raw 10 to 12 digit numbers (e.g. '7550306962', '07550306962', '917550306962')
  const rawRegex = /\b(?:0|\+?91)?([6-9]\d{9})\b|\b\d{10,12}\b/g;
  const rawMatches = text.match(rawRegex);
  if (rawMatches) {
    for (const match of rawMatches) {
      const cleaned = cleanPhone(match);
      const digitCount = (cleaned.match(/\d/g) || []).length;
      if (digitCount >= 10 && digitCount <= 12) {
        return cleaned;
      }
    }
  }

  return '';
};

const extractNameAndContact = (text) => {
  if (!text || typeof text !== 'string') {
    return { name: '', email: '', phone: '' };
  }

  // Email regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0].replace(/[.,;:)]+$/, '').trim() : '';

  // Phone extraction
  const phone = extractPhone(text);

  // Name extraction from top lines
  const headerLines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.length < 60)
    .slice(0, 10);

  let name = '';
  for (const line of headerLines) {
    // Avoid lines with emails, links, addresses or resume section keywords
    if (
      /@|http|www|\.com|\.org|\.net|\.in|\.io|linkedin|github|codechef|leetcode|phone|email|mobile|tel\b|resume|curriculum|vitae|summary|objective|education|experience|skills|projects|profile|address|street|road|pincode|postal|page\s*\d/i.test(line)
    ) {
      continue;
    }
    // Avoid lines that are common job titles without a name
    if (
      /^(full\s*stack|frontend|backend|software|web|data|intern|engineer|developer|architect|consultant|manager|analyst)(\s+(developer|engineer|intern|internship|specialist))?$/i.test(line)
    ) {
      continue;
    }

    const words = line.split(/\s+/);
    // Names typically have 1 to 4 words and no digits or symbols like _, +, =, #, etc.
    if (words.length >= 1 && words.length <= 4 && !/[0-9_+=\/\\#*|:]/.test(line)) {
      // If 1 word, must be at least 3 letters
      if (words.length === 1 && line.length < 3) continue;
      name = line;
      break;
    }
  }

  return { name, email, phone };
};

module.exports = { parseResume, extractNameAndContact };
