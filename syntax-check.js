// Mobile Responsiveness Check and Fix
// Simple syntax validation

const fs = require('fs');
const path = require('path');

function validateTSXSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Basic bracket matching
    let openBraces = 0;
    let openParens = 0;
    let openBrackets = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const nextChar = content[i + 1];
      
      // Skip JSX comments
      if (char === '/' && nextChar === '*') {
        let j = i + 2;
        while (j < content.length - 1) {
          if (content[j] === '*' && content[j + 1] === '/') {
            i = j + 1;
            break;
          }
          j++;
        }
        continue;
      }
      
      // Skip line comments
      if (char === '/' && nextChar === '/') {
        while (i < content.length && content[i] !== '\n') {
          i++;
        }
        continue;
      }
      
      // Count brackets
      if (char === '{') openBraces++;
      if (char === '}') openBraces--;
      if (char === '(') openParens++;
      if (char === ')') openParens--;
      if (char === '[') openBrackets++;
      if (char === ']') openBrackets--;
    }
    
    console.log('Syntax Analysis:');
    console.log(`Open braces: ${openBraces}`);
    console.log(`Open parentheses: ${openParens}`);
    console.log(`Open brackets: ${openBrackets}`);
    
    if (openBraces !== 0 || openParens !== 0 || openBrackets !== 0) {
      console.log('❌ Syntax errors detected!');
      return false;
    } else {
      console.log('✅ Basic syntax looks good');
      return true;
    }
    
  } catch (error) {
    console.error('Error reading file:', error);
    return false;
  }
}

// Test the project details page
const projectDetailsPath = '/Users/konjarehm/Documents/Programmieren/VSC /REACT/learning/personal_dashboard/app/dashboard/projects/[id]/page.tsx';
validateTSXSyntax(projectDetailsPath);
