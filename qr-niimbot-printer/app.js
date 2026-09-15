// Configuration de l'application
const CONFIG = {
    printer: {
        name: 'Niimbot D110A',
        serviceUUID: '12345678-1234-5678-9abc-123456789012',
        characteristicUUID: '87654321-4321-8765-cba9-876543210987'
    },
    qr: {
        size: 128,
        errorCorrectionLevel: 'M',
        foreground: '#000000',
        background: '#ffffff'
    },
    label: {
        widthMM: 15,
        widthPixels: 118,
        dpi: 203,
        minHeightMM: 20
    }
};

// État de l'application
let appState = {
    currentURL: '',
    qrCode: null,
    bluetoothDevice: null,
    bluetoothCharacteristic: null,
    isConnected: false,
    currentQRCanvas: null
};

// Éléments DOM
const elements = {
    urlInput: document.getElementById('url-input'),
    generateBtn: document.getElementById('generate-qr'),
    qrPreview: document.getElementById('qr-preview'),
    urlText: document.getElementById('url-text'),
    labelPreview: document.getElementById('label-preview'),
    connectBtn: document.getElementById('connect-printer'),
    disconnectBtn: document.getElementById('disconnect-printer'),
    printBtn: document.getElementById('print-label'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    printerName: document.getElementById('printer-name'),
    printDensity: document.getElementById('print-density'),
    printCopies: document.getElementById('print-copies'),
    labelCanvas: document.getElementById('label-canvas'),
    notificationContainer: document.getElementById('notification-container')
};

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', function() {
    // Attendre que la bibliothèque QRCode soit chargée
    if (typeof QRCode === 'undefined') {
        setTimeout(initializeApp, 100);
    } else {
        initializeApp();
    }
});

function initializeApp() {
    // Vérifier que QRCode est disponible
    if (typeof QRCode === 'undefined') {
        showNotification('Erreur: Bibliothèque QRCode non chargée', 'error');
        return;
    }

    // Vérifier le support Web Bluetooth
    if (!navigator.bluetooth) {
        showNotification('Votre navigateur ne supporte pas Web Bluetooth. Utilisez Chrome, Edge ou Opera.', 'error');
    }

    // Écouteurs d'événements
    elements.generateBtn.addEventListener('click', generateQRCode);
    elements.connectBtn.addEventListener('click', connectToPrinter);
    elements.disconnectBtn.addEventListener('click', disconnectFromPrinter);
    elements.printBtn.addEventListener('click', printLabel);
    elements.urlInput.addEventListener('input', handleURLInput);
    elements.urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            generateQRCode();
        }
    });

    // Initialiser l'état de l'interface
    updateUIState();
}

function handleURLInput() {
    const url = elements.urlInput.value.trim();
    if (url && isValidURL(url)) {
        elements.generateBtn.disabled = false;
    } else {
        elements.generateBtn.disabled = true;
    }
}

function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        // Permettre les URLs sans protocole
        try {
            new URL('http://' + string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

function generateQRCode() {
    let url = elements.urlInput.value.trim();
    
    if (!url) {
        showNotification('Veuillez entrer une URL', 'error');
        return;
    }

    // Ajouter http:// si pas de protocole
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    if (!isValidURL(url)) {
        showNotification('Veuillez entrer une URL valide', 'error');
        return;
    }

    appState.currentURL = url;
    elements.generateBtn.classList.add('loading');
    elements.generateBtn.disabled = true;

    // Nettoyer l'aperçu précédent
    elements.qrPreview.innerHTML = '';
    elements.urlText.textContent = '';

    // Créer un canvas pour le QR code
    const canvas = document.createElement('canvas');
    elements.qrPreview.appendChild(canvas);

    // Générer le QR code
    try {
        QRCode.toCanvas(canvas, url, {
            width: CONFIG.qr.size,
            height: CONFIG.qr.size,
            margin: 2,
            errorCorrectionLevel: CONFIG.qr.errorCorrectionLevel,
            color: {
                dark: CONFIG.qr.foreground,
                light: CONFIG.qr.background
            }
        }, function(error) {
            elements.generateBtn.classList.remove('loading');
            elements.generateBtn.disabled = false;

            if (error) {
                console.error('Erreur QR Code:', error);
                showNotification('Erreur lors de la génération du QR code: ' + error.message, 'error');
                return;
            }

            // Succès
            appState.currentQRCanvas = canvas;
            elements.urlText.textContent = url;
            
            // Mettre à jour l'aperçu de l'étiquette
            updateLabelPreview();
            
            showNotification('QR code généré avec succès', 'success');
        });
    } catch (error) {
        elements.generateBtn.classList.remove('loading');
        elements.generateBtn.disabled = false;
        console.error('Erreur lors de la génération:', error);
        showNotification('Erreur lors de la génération du QR code', 'error');
    }
}

function updateLabelPreview() {
    if (!appState.currentQRCanvas || !appState.currentURL) return;

    elements.labelPreview.innerHTML = '';
    elements.labelPreview.classList.add('has-content');

    // Créer une version miniature du QR code
    const qrContainer = document.createElement('div');
    qrContainer.className = 'qr-code';
    
    const qrCanvas = document.createElement('canvas');
    qrCanvas.width = 64;
    qrCanvas.height = 64;
    
    const ctx = qrCanvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(appState.currentQRCanvas, 0, 0, 64, 64);
    
    qrContainer.appendChild(qrCanvas);
    elements.labelPreview.appendChild(qrContainer);

    // Ajouter l'URL
    const urlDisplay = document.createElement('div');
    urlDisplay.className = 'url-display';
    urlDisplay.textContent = appState.currentURL;
    elements.labelPreview.appendChild(urlDisplay);
}

async function connectToPrinter() {
    if (!navigator.bluetooth) {
        showNotification('Web Bluetooth n\'est pas supporté par votre navigateur', 'error');
        return;
    }

    try {
        elements.connectBtn.classList.add('loading');
        elements.connectBtn.disabled = true;

        showNotification('Recherche de l\'imprimante...', 'info');

        // Rechercher l'appareil Bluetooth
        // --- THIS IS THE CORRECTED PART ---
        const device = await navigator.bluetooth.requestDevice({
            filters: [{
                // We now filter directly for the service the printer provides.
                services: [CONFIG.printer.serviceUUID]
            }],
            // It's still good practice to list the service as optional to ensure access.
            optionalServices: [CONFIG.printer.serviceUUID]
        });
        // --- END OF CORRECTION ---

        showNotification('Connexion à l\'imprimante...', 'info');

        // Se connecter au serveur GATT
        const server = await device.gatt.connect();
        
        // Obtenir le service
        const service = await server.getPrimaryService(CONFIG.printer.serviceUUID);
        
        // Obtenir la caractéristique
        const characteristic = await service.getCharacteristic(CONFIG.printer.characteristicUUID);

        // Sauvegarder les références
        appState.bluetoothDevice = device;
        appState.bluetoothCharacteristic = characteristic;
        appState.isConnected = true;

        // Écouter les déconnexions
        device.addEventListener('gattserverdisconnected', handleDisconnection);

        updateUIState();
        showNotification(`Connecté à ${device.name}`, 'success');

    } catch (error) {
        console.error('Erreur de connexion:', error);
        let errorMessage = 'Erreur de connexion à l\'imprimante';
        
        if (error.name === 'NotFoundError') {
            errorMessage = 'Aucune imprimante trouvée. Assurez-vous que votre Niimbot est allumée et détectable.';
        } else if (error.name === 'SecurityError') {
            errorMessage = 'Accès Bluetooth refusé. Veuillez autoriser l\'accès Bluetooth.';
        } else if (error.name === 'NotSupportedError') {
            errorMessage = 'Bluetooth non supporté sur cet appareil.';
        }
        
        showNotification(errorMessage, 'error');
        appState.isConnected = false;
        updateUIState();
    } finally {
        elements.connectBtn.classList.remove('loading');
        // This was also a small bug, the button should be re-enabled if connection fails.
        // It was correct in your code, just pointing it out.
        elements.connectBtn.disabled = appState.isConnected; 
    }
}

async function disconnectFromPrinter() {
    if (appState.bluetoothDevice && appState.bluetoothDevice.gatt.connected) {
        await appState.bluetoothDevice.gatt.disconnect();
    }
    
    appState.bluetoothDevice = null;
    appState.bluetoothCharacteristic = null;
    appState.isConnected = false;
    
    updateUIState();
    showNotification('Déconnecté de l\'imprimante', 'info');
}

function handleDisconnection() {
    appState.isConnected = false;
    appState.bluetoothDevice = null;
    appState.bluetoothCharacteristic = null;
    
    updateUIState();
    showNotification('Imprimante déconnectée', 'error');
}

function updateUIState() {
    // Mettre à jour l'état de connexion
    if (appState.isConnected) {
        elements.statusDot.className = 'status-dot status-dot--connected';
        elements.statusText.textContent = 'Connecté';
        elements.printerName.textContent = appState.bluetoothDevice ? appState.bluetoothDevice.name : '';
        elements.connectBtn.classList.add('hidden');
        elements.disconnectBtn.classList.remove('hidden');
        elements.printBtn.disabled = !appState.currentQRCanvas;
    } else {
        elements.statusDot.className = 'status-dot status-dot--disconnected';
        elements.statusText.textContent = 'Déconnecté';
        elements.printerName.textContent = '';
        elements.connectBtn.classList.remove('hidden');
        elements.disconnectBtn.classList.add('hidden');
        elements.printBtn.disabled = true;
    }
}

async function printLabel() {
    if (!appState.isConnected || !appState.bluetoothCharacteristic || !appState.currentQRCanvas) {
        showNotification('Impossible d\'imprimer: vérifiez la connexion et le QR code', 'error');
        return;
    }

    try {
        elements.printBtn.classList.add('loading');
        elements.printBtn.disabled = true;

        showNotification('Préparation de l\'impression...', 'info');

        // Créer l'image de l'étiquette
        const labelImageData = await createLabelImage();
        
        // Convertir en format d'impression
        const printData = await convertToPrintFormat(labelImageData);
        
        // Obtenir les paramètres d'impression
        const density = parseInt(elements.printDensity.value);
        const copies = parseInt(elements.printCopies.value);

        showNotification('Envoi à l\'imprimante...', 'info');

        // Envoyer les données d'impression
        for (let i = 0; i < copies; i++) {
            await sendPrintData(printData, density);
            if (i < copies - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000)); // Pause entre copies
            }
        }

        showNotification(`Impression terminée (${copies} copie${copies > 1 ? 's' : ''})`, 'success');

    } catch (error) {
        console.error('Erreur d\'impression:', error);
        showNotification('Erreur lors de l\'impression: ' + error.message, 'error');
    } finally {
        elements.printBtn.classList.remove('loading');
        elements.printBtn.disabled = false;
    }
}

async function createLabelImage() {
    const canvas = elements.labelCanvas;
    const ctx = canvas.getContext('2d');
    
    // Dimensions de l'étiquette
    const labelWidth = CONFIG.label.widthPixels;
    const qrSize = 80; // Taille du QR code sur l'étiquette
    const padding = 8;
    
    // Préparer le texte
    ctx.font = '10px Arial';
    const textLines = wrapText(ctx, appState.currentURL, labelWidth - padding * 2, 10);
    const totalTextHeight = textLines.length * 12;
    const labelHeight = qrSize + totalTextHeight + padding * 3;
    
    // Configurer le canvas
    canvas.width = labelWidth;
    canvas.height = labelHeight;
    
    // Fond blanc
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, labelWidth, labelHeight);
    
    // Dessiner le QR code centré
    const qrX = (labelWidth - qrSize) / 2;
    const qrY = padding;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(appState.currentQRCanvas, qrX, qrY, qrSize, qrSize);
    
    // Dessiner le texte de l'URL
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    
    const textY = qrY + qrSize + padding;
    textLines.forEach((line, index) => {
        ctx.fillText(line, labelWidth / 2, textY + (index * 12) + 12);
    });
    
    return ctx.getImageData(0, 0, labelWidth, labelHeight);
}

function wrapText(ctx, text, maxWidth, fontSize) {
    const words = text.split(/[\s\/]+/);
    const lines = [];
    let currentLine = '';
    
    ctx.font = `${fontSize}px Arial`;
    
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = ctx.measureText(testLine).width;
        
        if (testWidth > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    }
    
    if (currentLine) {
        lines.push(currentLine);
    }
    
    return lines;
}

async function convertToPrintFormat(imageData) {
    // Convertir les données d'image en format bitmap pour imprimante thermique
    const { data, width, height } = imageData;
    const bitmapData = [];
    
    // Convertir chaque pixel en noir ou blanc
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x += 8) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
                if (x + bit < width) {
                    const pixelIndex = ((y * width) + (x + bit)) * 4;
                    const r = data[pixelIndex];
                    const g = data[pixelIndex + 1];
                    const b = data[pixelIndex + 2];
                    
                    // Convertir en niveau de gris puis en noir/blanc
                    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
                    if (gray < 128) {
                        byte |= (1 << (7 - bit));
                    }
                }
            }
            bitmapData.push(byte);
        }
    }
    
    return {
        width: width,
        height: height,
        data: bitmapData
    };
}

async function sendPrintData(printData, density) {
    if (!appState.bluetoothCharacteristic) {
        throw new Error('Aucune connexion Bluetooth active');
    }
    
    // Commandes d'impression pour Niimbot D110A
    const commands = [];
    
    // Initialisation
    commands.push(new Uint8Array([0x1B, 0x40])); // ESC @
    
    // Définir la densité
    commands.push(new Uint8Array([0x1B, 0x37, density]));
    
    // Définir la largeur
    commands.push(new Uint8Array([0x1B, 0x57, printData.width]));
    
    // Envoyer les données bitmap
    const chunkSize = 20; // Taille des chunks pour Bluetooth
    const dataArray = new Uint8Array(printData.data);
    
    for (let i = 0; i < dataArray.length; i += chunkSize) {
        const chunk = dataArray.slice(i, i + chunkSize);
        commands.push(chunk);
    }
    
    // Commande d'impression
    commands.push(new Uint8Array([0x1B, 0x4A, 0x10])); // ESC J
    
    // Envoyer toutes les commandes
    for (const command of commands) {
        await appState.bluetoothCharacteristic.writeValue(command);
        await new Promise(resolve => setTimeout(resolve, 50)); // Petit délai
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    
    elements.notificationContainer.appendChild(notification);
    
    // Afficher la notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Gestion des erreurs globales
window.addEventListener('error', function(e) {
    console.error('Erreur JavaScript:', e.error);
    showNotification('Une erreur inattendue s\'est produite', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Promesse rejetée:', e.reason);
    showNotification('Erreur de traitement', 'error');
});