#!/usr/bin/env node

/**
 * Mobile Responsiveness Test Script
 * Tests various mobile viewport sizes and checks for responsive design issues
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const MOBILE_VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 667, deviceScaleFactor: 2 },
  { name: 'iPhone 12', width: 390, height: 844, deviceScaleFactor: 3 },
  { name: 'iPhone 12 Pro Max', width: 428, height: 926, deviceScaleFactor: 3 },
  { name: 'Samsung Galaxy S21', width: 360, height: 800, deviceScaleFactor: 3 },
  { name: 'iPad Mini', width: 768, height: 1024, deviceScaleFactor: 2 },
  { name: 'Small Mobile', width: 320, height: 568, deviceScaleFactor: 2 },
];

async function testMobileResponsiveness() {
  console.log('🚀 Starting mobile responsiveness tests for Project Details Page...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for automated testing
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const viewport of MOBILE_VIEWPORTS) {
      console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      const page = await browser.newPage();
      await page.setViewport(viewport);
      
      // Navigate to project details page (replace with actual URL)
      const testUrl = 'http://localhost:3000/dashboard/projects/test-project-id';
      
      try {
        await page.goto(testUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        
        // Test for horizontal scrolling
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        
        if (hasHorizontalScroll) {
          console.log(`  ❌ Horizontal scrolling detected on ${viewport.name}`);
        } else {
          console.log(`  ✅ No horizontal scrolling on ${viewport.name}`);
        }
        
        // Test text overflow
        const overflowingElements = await page.evaluate(() => {
          const elements = document.querySelectorAll('*');
          const overflowing = [];
          
          elements.forEach(el => {
            if (el.scrollWidth > el.clientWidth && el.clientWidth > 0) {
              overflowing.push({
                tagName: el.tagName,
                className: el.className,
                id: el.id,
                scrollWidth: el.scrollWidth,
                clientWidth: el.clientWidth
              });
            }
          });
          
          return overflowing;
        });
        
        if (overflowingElements.length > 0) {
          console.log(`  ⚠️  Found ${overflowingElements.length} potentially overflowing elements on ${viewport.name}`);
          overflowingElements.slice(0, 3).forEach(el => {
            console.log(`    - ${el.tagName}.${el.className}`);
          });
        } else {
          console.log(`  ✅ No text overflow detected on ${viewport.name}`);
        }
        
        // Test button accessibility (minimum touch target size)
        const smallButtons = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button');
          const small = [];
          
          buttons.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            if (rect.width < 44 || rect.height < 44) {
              small.push({
                text: btn.textContent?.trim() || 'No text',
                width: rect.width,
                height: rect.height
              });
            }
          });
          
          return small;
        });
        
        if (smallButtons.length > 0) {
          console.log(`  ⚠️  Found ${smallButtons.length} buttons below recommended touch target size (44px) on ${viewport.name}`);
        } else {
          console.log(`  ✅ All buttons meet touch target requirements on ${viewport.name}`);
        }
        
        // Take screenshot for visual verification
        const screenshotDir = path.join(__dirname, 'mobile-test-screenshots');
        if (!fs.existsSync(screenshotDir)) {
          fs.mkdirSync(screenshotDir, { recursive: true });
        }
        
        const screenshotPath = path.join(screenshotDir, `${viewport.name.replace(/\s+/g, '-').toLowerCase()}.png`);
        await page.screenshot({ 
          path: screenshotPath, 
          fullPage: true 
        });
        
        console.log(`  📸 Screenshot saved: ${screenshotPath}`);
        
      } catch (error) {
        console.log(`  ❌ Error testing ${viewport.name}: ${error.message}`);
      }
      
      await page.close();
      console.log('');
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
  } finally {
    await browser.close();
  }
  
  console.log('✨ Mobile responsiveness testing completed!');
  console.log('\n📋 Summary:');
  console.log('- Check screenshots in ./mobile-test-screenshots/ folder');
  console.log('- Review any warnings or errors above');
  console.log('- Test manually on actual devices when possible');
}

// CSS Analysis Helper
async function analyzeCSSResponsiveness() {
  console.log('\n🔍 Analyzing CSS for mobile responsiveness patterns...\n');
  
  const projectDetailsPath = path.join(__dirname, 'app/dashboard/projects/[id]/page.tsx');
  const mobileCSS = path.join(__dirname, 'app/dashboard/projects/mobile-responsive.css');
  
  if (fs.existsSync(projectDetailsPath)) {
    const content = fs.readFileSync(projectDetailsPath, 'utf8');
    
    // Check for responsive classes
    const responsivePatterns = [
      /xs:/g,
      /sm:/g,
      /md:/g,
      /lg:/g,
      /xl:/g,
      /break-words/g,
      /overflow-wrap-anywhere/g,
      /truncate/g,
      /min-w-0/g,
      /max-w-full/g,
      /w-full/g
    ];
    
    responsivePatterns.forEach((pattern, index) => {
      const matches = content.match(pattern);
      const patternNames = ['xs:', 'sm:', 'md:', 'lg:', 'xl:', 'break-words', 'overflow-wrap-anywhere', 'truncate', 'min-w-0', 'max-w-full', 'w-full'];
      console.log(`${patternNames[index].padEnd(20)} - ${matches ? matches.length : 0} occurrences`);
    });
  }
  
  if (fs.existsSync(mobileCSS)) {
    console.log('\n✅ Mobile-specific CSS file found');
  } else {
    console.log('\n⚠️  Mobile-specific CSS file not found');
  }
}

// Run tests
if (require.main === module) {
  // analyzeCSSResponsiveness();
  // testMobileResponsiveness();
  
  console.log('📱 Mobile Responsiveness Test Suite');
  console.log('=====================================\n');
  console.log('To run this test:');
  console.log('1. Install puppeteer: npm install puppeteer');
  console.log('2. Start your development server: npm run dev');
  console.log('3. Update the testUrl in this script with your actual project URL');
  console.log('4. Run: node mobile-test.js\n');
  
  analyzeCSSResponsiveness();
}

module.exports = {
  testMobileResponsiveness,
  analyzeCSSResponsiveness,
  MOBILE_VIEWPORTS
};
