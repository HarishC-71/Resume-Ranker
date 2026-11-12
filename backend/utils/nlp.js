const natural = require('natural');

const skillsToSearch = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'c', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust',
  'react', 'react native', 'next.js', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'fastapi', 'spring boot', 'asp.net',
  'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra', 'sqlite', 'dynamodb',
  'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'jenkins', 'git', 'github', 'gitlab', 'linux', 'bash', 'ci/cd',
  'machine learning', 'deep learning', 'nlp', 'computer vision', 'data science', 'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras', 'opencv',
  'html', 'css', 'sass', 'tailwind', 'bootstrap', 'material-ui', 'figma', 'sketch', 'adobe xd', 'graphql', 'rest api',
  'agile', 'scrum', 'kanban', 'jira', 'confluence', 'trello', 'slack',
  'communication', 'leadership', 'problem solving', 'teamwork', 'time management', 'mern', 'mean'
];

const extractSkills = (text = '', jdSkills = []) => {
  if (!text || typeof text !== 'string') return [];

  const normalizedJdSkills = (Array.isArray(jdSkills) ? jdSkills : []).map(s => String(s).toLowerCase().trim());
  const allSkills = new Set([...skillsToSearch, ...normalizedJdSkills]);

  const foundSkills = new Set();
  const lowerText = text.toLowerCase();

  allSkills.forEach(skill => {
    if (!skill) return;
    const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|\\s|[.,/\\(\\):;])(${escapedSkill})($|\\s|[.,/\\(\\):;])`, 'i');

    if (regex.test(lowerText)) {
      foundSkills.add(skill);
    }
  });

  return Array.from(foundSkills);
};

const extractJDSkills = (jdText = '') => {
  return extractSkills(jdText, []);
};

const calculateCosineSimilarity = (textA = '', textB = '') => {
  const tokenizer = new natural.WordTokenizer();
  const tokensA = tokenizer.tokenize((textA || '').toLowerCase()) || [];
  const tokensB = tokenizer.tokenize((textB || '').toLowerCase()) || [];

  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const uniqueTokens = Array.from(new Set([...tokensA, ...tokensB]));
  const vectorA = uniqueTokens.map(token => tokensA.includes(token) ? 1 : 0);
  const vectorB = uniqueTokens.map(token => tokensB.includes(token) ? 1 : 0);

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < uniqueTokens.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magA += vectorA[i] * vectorA[i];
    magB += vectorB[i] * vectorB[i];
  }

  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);

  return (magA && magB) ? dotProduct / (magA * magB) : 0;
};

const calculateMatchScore = (resumeText = '', jdText = '', resumeSkills = [], jdSkills = []) => {
  const safeResumeSkills = Array.isArray(resumeSkills) ? resumeSkills : [];
  const safeJdSkills = Array.isArray(jdSkills) ? jdSkills : [];

  let matchScore = 0;

  if (safeJdSkills.length > 0) {
    const matchedSkills = safeJdSkills.filter(skill => safeResumeSkills.includes(skill.toLowerCase()));
    const skillScore = matchedSkills.length / safeJdSkills.length;
    const cosineSimilarity = calculateCosineSimilarity(jdText, resumeText);

    // Weighted score: 65% skills overlap, 35% text similarity
    matchScore = (skillScore * 0.65) + (cosineSimilarity * 0.35);
  } else {
    // If no explicit JD skills matched, evaluate general semantic similarity
    matchScore = calculateCosineSimilarity(jdText, resumeText);
  }

  return Math.min(100, Math.max(0, Math.round(matchScore * 100)));
};

const getMissingSkills = (resumeSkills = [], jdSkills = []) => {
  const safeResume = (resumeSkills || []).map(s => String(s).toLowerCase());
  return (jdSkills || []).filter(skill => !safeResume.includes(String(skill).toLowerCase()));
};

const getBonusSkills = (resumeSkills = [], jdSkills = []) => {
  const safeJd = (jdSkills || []).map(s => String(s).toLowerCase());
  return (resumeSkills || []).filter(skill => !safeJd.includes(String(skill).toLowerCase()));
};

module.exports = {
  extractSkills,
  extractJDSkills,
  calculateMatchScore,
  getMissingSkills,
  getBonusSkills
};
