let commonPassword = 'default_password';

// CryptoJS functions
function generateRandomIV() {
    return CryptoJS.lib.WordArray.random(16);
}

function encrypt(data, password) {
    const iv = generateRandomIV();
    const key = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse('73616c74'), { keySize: 256/32 });
    const encrypted = CryptoJS.AES.encrypt(data, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
    return `${iv.toString()}:${encrypted.toString()}`;
}

function decrypt(encryptedData, password) {
    try {
        const [ivHex, encrypted] = encryptedData.split(':');
        if (!ivHex || !encrypted) {
            throw new Error("Invalid encrypted data format.");
        }
        const iv = CryptoJS.enc.Hex.parse(ivHex);
        const key = CryptoJS.PBKDF2(password, CryptoJS.enc.Hex.parse('73616c74'), { keySize: 256/32 });
        const decrypted = CryptoJS.AES.decrypt(encrypted, key, { iv: iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 });
        return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error("An error occurred during decryption:", error.message);
        return null;
    }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateMessageContent') {
        updateMessageContent(request.state);
        sendResponse({ status: 'done' });
    } else if (request.action === 'updatePassword') {
        commonPassword = request.password;
        sendResponse({ status: 'password updated' });
    }
});

// Modify the updateMessageContent function to handle encryption/decryption
function updateMessageContent(state) {
    const messageContents = document.querySelectorAll('.message_content p');

    messageContents.forEach(p => {
        if (state) {
            if (p.textContent === 'done' && !p.dataset.encrypted) {
                const encrypted = encrypt('Ok', commonPassword);
                p.textContent = encrypted;
                p.dataset.encrypted = 'true';
            }
        } else {
            if (p.dataset.encrypted === 'true') {
                const decrypted = decrypt(p.textContent, commonPassword);
                p.textContent = decrypted || 'done';
                p.dataset.encrypted = 'false';
            }
        }
    });
}

// Add a mutation observer to encrypt outgoing messages and decrypt incoming messages
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('message_content')) {
                    const p = node.querySelector('p');
                    if (p && !p.dataset.encrypted) {
                        const encrypted = encrypt(p.textContent, commonPassword);
                        p.textContent = encrypted;
                        p.dataset.encrypted = 'true';
                    }
                }
            });
        }
    });
});

observer.observe(document.body, { childList: true, subtree: true });

// Decrypt messages when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const messageContents = document.querySelectorAll('.message_content p');
    messageContents.forEach(p => {
        if (p.dataset.encrypted === 'true') {
            const decrypted = decrypt(p.textContent, commonPassword);
            p.textContent = decrypted || p.textContent;
        }
    });
});

// Load the common password from storage when the content script initializes
chrome.storage.sync.get('commonPassword', function(data) {
    if (data.commonPassword) {
        commonPassword = data.commonPassword;
    }
});