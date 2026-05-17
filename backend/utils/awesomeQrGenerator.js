const { AwesomeQR } = require('awesome-qr');
const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs');
const path = require('path');

/**
 * Generate a professional QR code with burgundy, black, and snow white theme
 * @param {string} data - The URL to encode in QR code
 * @param {string} restaurantName - Name of the restaurant
 * @param {Object} options - Additional options for QR generation
 * @returns {Promise<string>} Base64 encoded image
 */
const generateProfessionalQR = async (data, restaurantName, options = {}) => {
  try {
    // Professional QR code options with burgundy theme
    const qrOptions = {
      text: data,
      size: 350,
      margin: 15,
      correctLevel: AwesomeQR.CorrectLevel.H, // High error correction
      backgroundImage: undefined,
      backgroundDimming: 'rgba(0,0,0,0)',
      logoImage: undefined,
      logoScale: 0.15,
      logoMargin: 8,
      logoCornerRadius: 12,
      whiteMargin: true,
      dotScale: 0.4,
      maskedDots: false,
      colorDark: '#000000', // Pure black for QR pattern
      colorLight: '#FFFAFA', // Snow white
      autoColor: false,
      ...options
    };

    // Generate the base QR code
    const qrBuffer = await new AwesomeQR(qrOptions).draw();
    
    // Create canvas for professional layout
    const canvasWidth = 500;
    const canvasHeight = 650;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Professional burgundy gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, '#800020'); // Deep burgundy
    gradient.addColorStop(0.3, '#9B2342'); // Mid burgundy  
    gradient.addColorStop(0.7, '#722F37'); // Dark burgundy
    gradient.addColorStop(1, '#5D1A1D'); // Very dark burgundy
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Add elegant outer border
    ctx.strokeStyle = '#FFFAFA'; // Snow white border
    ctx.lineWidth = 3;
    ctx.setLineDash([]);
    ctx.strokeRect(15, 15, canvasWidth - 30, canvasHeight - 30);
    
    // Add inner accent border
    ctx.strokeStyle = 'rgba(255, 250, 250, 0.6)'; // Semi-transparent snow white
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 20, canvasWidth - 40, canvasHeight - 40);

    // Restaurant name at the top with professional typography
    ctx.fillStyle = '#FFFAFA'; // Snow white text
    let fontSize = 28;
    ctx.font = `${fontSize}px Georgia, serif`; // Professional serif font
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add subtle text shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Auto-adjust font size for restaurant name
    const maxNameWidth = canvasWidth - 80;
    while (ctx.measureText(restaurantName).width > maxNameWidth && fontSize > 16) {
      fontSize -= 2;
      ctx.font = `${fontSize}px Georgia, serif`;
    }
    
    ctx.fillText(restaurantName, canvasWidth / 2, 70);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Professional decorative line under restaurant name
    const lineY = 100;
    const lineStartX = 80;
    const lineEndX = canvasWidth - 80;
    
    // Create elegant line with gradient
    const lineGradient = ctx.createLinearGradient(lineStartX, lineY, lineEndX, lineY);
    lineGradient.addColorStop(0, 'rgba(255, 250, 250, 0.2)');
    lineGradient.addColorStop(0.5, '#FFFAFA');
    lineGradient.addColorStop(1, 'rgba(255, 250, 250, 0.2)');
    
    ctx.strokeStyle = lineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lineStartX, lineY);
    ctx.lineTo(lineEndX, lineY);
    ctx.stroke();

    // QR code positioning and styling
    const qrSize = 350;
    const qrX = (canvasWidth - qrSize) / 2;
    const qrY = 140;
    
    // Create professional QR code background with subtle shadow
    const bgPadding = 20;
    const bgX = qrX - bgPadding;
    const bgY = qrY - bgPadding;
    const bgSize = qrSize + (bgPadding * 2);
    
    // Add drop shadow for QR background
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
    
    // QR background with rounded corners
    const cornerRadius = 15;
    ctx.fillStyle = '#FFFAFA'; // Snow white background
    ctx.beginPath();
    ctx.moveTo(bgX + cornerRadius, bgY);
    ctx.lineTo(bgX + bgSize - cornerRadius, bgY);
    ctx.quadraticCurveTo(bgX + bgSize, bgY, bgX + bgSize, bgY + cornerRadius);
    ctx.lineTo(bgX + bgSize, bgY + bgSize - cornerRadius);
    ctx.quadraticCurveTo(bgX + bgSize, bgY + bgSize, bgX + bgSize - cornerRadius, bgY + bgSize);
    ctx.lineTo(bgX + cornerRadius, bgY + bgSize);
    ctx.quadraticCurveTo(bgX, bgY + bgSize, bgX, bgY + bgSize - cornerRadius);
    ctx.lineTo(bgX, bgY + cornerRadius);
    ctx.quadraticCurveTo(bgX, bgY, bgX + cornerRadius, bgY);
    ctx.closePath();
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Draw the QR code
    const qrImage = await loadImage(qrBuffer);
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    // Professional "SCAN MENU" button
    const btnWidth = 280;
    const btnHeight = 50;
    const btnX = (canvasWidth - btnWidth) / 2;
    const btnY = qrY + qrSize + 35;
    const btnRadius = 25;
    
    // Button shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 6;
    
    // Create professional button with rounded corners
    ctx.fillStyle = '#000000'; // Black button
    ctx.beginPath();
    ctx.moveTo(btnX + btnRadius, btnY);
    ctx.lineTo(btnX + btnWidth - btnRadius, btnY);
    ctx.quadraticCurveTo(btnX + btnWidth, btnY, btnX + btnWidth, btnY + btnRadius);
    ctx.lineTo(btnX + btnWidth, btnY + btnHeight - btnRadius);
    ctx.quadraticCurveTo(btnX + btnWidth, btnY + btnHeight, btnX + btnWidth - btnRadius, btnY + btnHeight);
    ctx.lineTo(btnX + btnRadius, btnY + btnHeight);
    ctx.quadraticCurveTo(btnX, btnY + btnHeight, btnX, btnY + btnHeight - btnRadius);
    ctx.lineTo(btnX, btnY + btnRadius);
    ctx.quadraticCurveTo(btnX, btnY, btnX + btnRadius, btnY);
    ctx.closePath();
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Button border for elegance
    ctx.strokeStyle = '#FFFAFA';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Button text
    ctx.fillStyle = '#FFFAFA'; // Snow white text
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN MENU', canvasWidth / 2, btnY + btnHeight / 2 + 2);

    // Professional separator line above company name
    const bottomLineY = canvasHeight - 80;
    const bottomLineGradient = ctx.createLinearGradient(lineStartX, bottomLineY, lineEndX, bottomLineY);
    bottomLineGradient.addColorStop(0, 'rgba(255, 250, 250, 0.2)');
    bottomLineGradient.addColorStop(0.5, '#FFFAFA');
    bottomLineGradient.addColorStop(1, 'rgba(255, 250, 250, 0.2)');
    
    ctx.strokeStyle = bottomLineGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lineStartX, bottomLineY);
    ctx.lineTo(lineEndX, bottomLineY);
    ctx.stroke();

    // Company branding "Qruzine" at the bottom
    ctx.fillStyle = '#FFFAFA'; // Snow white
    ctx.font = '22px Georgia, serif'; // Elegant serif font
    ctx.textAlign = 'center';
    
    // Add subtle shadow for company name
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 3;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText('Qruzine', canvasWidth / 2, canvasHeight - 40);

    // Convert canvas to base64
    const base64Image = canvas.toDataURL('image/png', 0.95);
    return base64Image;

  } catch (error) {
    console.error('Professional QR code generation error:', error);
    throw new Error('Failed to generate professional QR code');
  }
};

/**
 * Generate professional QR code with custom logo
 * @param {string} data - The URL to encode
 * @param {string} restaurantName - Restaurant name
 * @param {string} logoPath - Path to logo image (optional)
 * @param {Object} options - Additional options
 * @returns {Promise<string>} Base64 encoded image
 */
const generateProfessionalQRWithLogo = async (data, restaurantName, logoPath = null, options = {}) => {
  try {
    let logoImage = undefined;
    
    if (logoPath && fs.existsSync(logoPath)) {
      logoImage = await loadImage(logoPath);
    }

    const qrOptions = {
      text: data,
      size: 350,
      margin: 15,
      correctLevel: AwesomeQR.CorrectLevel.H, // High error correction for logo
      logoImage: logoImage,
      logoScale: 0.12, // Smaller logo for professional look
      logoMargin: 10,
      logoCornerRadius: 15,
      whiteMargin: true,
      colorDark: '#000000', // Black QR pattern
      colorLight: '#FFFAFA', // Snow white
      ...options
    };

    return await generateProfessionalQR(data, restaurantName, qrOptions);
  } catch (error) {
    console.error('Professional QR with logo generation error:', error);
    // Fallback to regular professional QR if logo fails
    return await generateProfessionalQR(data, restaurantName, options);
  }
};

/**
 * Generate minimal professional QR code
 * @param {string} data - The URL to encode
 * @param {string} restaurantName - Restaurant name  
 * @param {Object} options - Options for QR generation
 * @returns {Promise<string>} Base64 encoded image
 */
const generateMinimalProfessionalQR = async (data, restaurantName, options = {}) => {
  try {
    // Create a more minimal version with the same professional theme
    const canvasWidth = 400;
    const canvasHeight = 500;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Solid burgundy background
    ctx.fillStyle = '#722F37'; // Professional burgundy
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Generate QR code
    const qrOptions = {
      text: data,
      size: 280,
      margin: 10,
      correctLevel: AwesomeQR.CorrectLevel.M,
      colorDark: '#000000',
      colorLight: '#FFFAFA',
      ...options
    };

    const qrBuffer = await new AwesomeQR(qrOptions).draw();
    const qrImage = await loadImage(qrBuffer);
    
    // Restaurant name
    ctx.fillStyle = '#FFFAFA';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(restaurantName, canvasWidth / 2, 50);
    
    // QR code with white background
    const qrSize = 280;
    const qrX = (canvasWidth - qrSize) / 2;
    const qrY = 80;
    
    ctx.fillStyle = '#FFFAFA';
    ctx.fillRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30);
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    
    // Scan menu text
    ctx.fillStyle = '#FFFAFA';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText('SCAN MENU', canvasWidth / 2, qrY + qrSize + 40);
    
    // Qruzine branding
    ctx.font = '18px Arial, sans-serif';
    ctx.fillText('Qruzine', canvasWidth / 2, canvasHeight - 30);

    const base64Image = canvas.toDataURL('image/png', 0.95);
    return base64Image;
  } catch (error) {
    console.error('Minimal professional QR generation error:', error);
    throw new Error('Failed to generate minimal professional QR code');
  }
};

module.exports = {
  generateProfessionalQR,
  generateProfessionalQRWithLogo,
  generateMinimalProfessionalQR
};