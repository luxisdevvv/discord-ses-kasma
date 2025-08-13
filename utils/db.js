import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'db.json');

/**
 * Veritabanından tüm kullanıcıları okur
 * @returns {Array} Kullanıcı listesi
 */
export function readUsers() {
    try {
        const data = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(data).users || [];
    } catch (error) {
        console.error('Veritabanı okuma hatası:', error);
        return [];
    }
}

/**
 * Kullanıcı listesini veritabanına yazar
 * @param {Array} users - Kullanıcı listesi
 */
export function writeUsers(users) {
    try {
        const data = { users };
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Veritabanı yazma hatası:', error);
    }
}

/**
 * Yeni kullanıcı ekler
 * @param {string} token - Kullanıcı tokeni
 * @param {string} voiceChannelID - Ses kanalı ID'si
 * @returns {boolean} Başarı durumu
 */
export function addUser(token, voiceChannelID) {
    const users = readUsers();
    
    // Aynı token zaten var mı kontrol et
    if (users.find(user => user.token === token)) {
        return false;
    }
    
    users.push({ token, voiceChannelID, addedAt: new Date().toISOString() });
    writeUsers(users);
    return true;
}

/**
 * Kullanıcıyı token ile kaldırır
 * @param {string} token - Kullanıcı tokeni
 * @returns {boolean} Başarı durumu
 */
export function removeUser(token) {
    const users = readUsers();
    const initialLength = users.length;
    
    const filteredUsers = users.filter(user => user.token !== token);
    
    if (filteredUsers.length === initialLength) {
        return false; // Kullanıcı bulunamadı
    }
    
    writeUsers(filteredUsers);
    return true;
}

/**
 * Kullanıcı sayısını döndürür
 * @returns {number} Kullanıcı sayısı
 */
export function getUserCount() {
    return readUsers().length;
}

/**
 * Belirli bir token ile kullanıcı arar
 * @param {string} token - Kullanıcı tokeni
 * @returns {Object|null} Kullanıcı objesi veya null
 */
export function findUserByToken(token) {
    const users = readUsers();
    return users.find(user => user.token === token) || null;
}
