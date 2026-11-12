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

const extractNameAndContact = (text) => {
  if (!text || typeof text !== 'string') {
    return { name: '', email: '', phone: '' };
  }

  // Email regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = text.match(emailRegex);
  const email = emailMatch ? emailMatch[0] : '';

  // Phone regex: matches 10-digit, formatted phone numbers with country codes
  const phoneRegex = /(?:(?:\+?\d{1,3}[\s-]?)?\(?\d{3,4}\)?[\s-]?)?\d{3}[\s-]?\d{4}|\b\d{10}\b/;
  const phoneMatch = text.match(phoneRegex);
  const phone = phoneMatch ? phoneMatch[0].trim() : '';

  // Name extraction from top lines
  const headerLines = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && line.length < 50)
    .slice(0, 8);

  let name = '';
  for (const line of headerLines) {
    // Avoid lines with emails, links, addresses or keywords
    if (
      /@|http|www|\.com|phone|email|mobile|resume|curriculum|vitae|address|namakkal|india|street|page/i.test(line)
    ) {
      continue;
    }
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && !/[0-9_+=\/\\#*]/.test(line)) {
      name = line;
      break;
    }
  }

  return { name, email, phone };
};

module.exports = { parseResume, extractNameAndContact };
