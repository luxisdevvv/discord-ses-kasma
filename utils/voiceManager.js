import WebSocket from 'ws';
import fetch from 'node-fetch';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const sodium = require('libsodium-wrappers');

/**
 * Discord Voice Manager - Gerçek ses kanalı bağlantısı
 */
export class VoiceManager {
    constructor() {
        this.connections = new Map(); // token -> connection
    }

    /**
     * Token ile ses kanalına katıl
     * @param {string} token - Kullanıcı tokeni
     * @param {string} channelId - Ses kanalı ID'si
     * @returns {Promise<boolean>} Başarı durumu
     */
    async joinVoiceChannel(token, channelId) {
        try {
            console.log(`🎵 Ses kanalına katılma başlatılıyor: ${channelId}`);

            // Kullanıcı bilgilerini al
            const userData = await this.getUserData(token);
            if (!userData) {
                throw new Error('Kullanıcı bilgileri alınamadı');
            }

            // Kanal bilgilerini al
            const channelInfo = await this.getChannelInfo(token, channelId);
            if (!channelInfo) {
                throw new Error('Kanal bilgileri alınamadı');
            }

            console.log(`📡 Kanal bilgileri: ${channelInfo.name} (Guild: ${channelInfo.guild_id})`);

            // Gateway URL'sini al
            const gatewayUrl = await this.getGatewayUrl();
            
            // WebSocket bağlantısı oluştur
            const ws = new WebSocket(gatewayUrl);
            
            const connection = {
                token,
                channelId,
                ws,
                sessionId: null,
                guildId: channelInfo.guild_id,
                userId: userData.id,
                username: userData.username,
                heartbeatInterval: null,
                sequence: null,
                voiceSessionId: null,
                voiceEndpoint: null
            };

            return new Promise((resolve, reject) => {
                let connected = false;
                let voiceConnected = false;
                let timeout = setTimeout(() => {
                    if (!connected) {
                        ws.close();
                        reject(new Error('Bağlantı zaman aşımı'));
                    }
                }, 30000);

                ws.on('open', () => {
                    console.log(`🔗 WebSocket bağlantısı açıldı: ${userData.username}`);
                    this.identify(ws, token);
                });

                ws.on('message', async (data) => {
                    try {
                        const message = JSON.parse(data);
                        console.log(`📨 Mesaj alındı: ${message.op} ${message.t || ''}`);
                        
                        await this.handleMessage(connection, message);
                        
                        if (message.t === 'READY' && !connected) {
                            connected = true;
                            console.log(`✅ ${userData.username} Discord'a bağlandı`);
                            
                            // Ses kanalına katıl
                            await this.updateVoiceState(connection, channelId);
                        }
                        
                        if (message.t === 'VOICE_STATE_UPDATE' && message.d.user_id === userData.id) {
                            if (message.d.channel_id === channelId && !voiceConnected) {
                                voiceConnected = true;
                                clearTimeout(timeout);
                                this.connections.set(token, connection);
                                console.log(`✅ ${userData.username} ses kanalına başarıyla katıldı!`);
                                resolve(true);
                            }
                        }
                    } catch (error) {
                        console.error('Mesaj işleme hatası:', error);
                    }
                });

                ws.on('error', (error) => {
                    console.error('WebSocket hatası:', error);
                    if (!connected) {
                        clearTimeout(timeout);
                        reject(error);
                    }
                });

                ws.on('close', (code, reason) => {
                    console.log(`🔌 WebSocket bağlantısı kapandı: ${code} - ${reason}`);
                    this.connections.delete(token);
                });
            });

        } catch (error) {
            console.error('Ses kanalına katılma hatası:', error);
            throw error;
        }
    }

    /**
     * Token ile ses kanalından çık
     * @param {string} token - Kullanıcı tokeni
     * @returns {Promise<boolean>} Başarı durumu
     */
    async leaveVoiceChannel(token) {
        try {
            const connection = this.connections.get(token);
            if (!connection) {
                console.log('Aktif bağlantı bulunamadı');
                return true;
            }

            console.log(`🎵 Ses kanalından çıkılıyor: ${connection.username}`);

            // Voice state güncelle (ses kanalından çık)
            await this.updateVoiceState(connection, null);

            // WebSocket bağlantısını kapat
            if (connection.ws && connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.close(1000, 'Normal kapatma');
            }

            // Heartbeat'i durdur
            if (connection.heartbeatInterval) {
                clearInterval(connection.heartbeatInterval);
            }

            this.connections.delete(token);
            console.log(`✅ ${connection.username} ses kanalından çıktı`);
            return true;

        } catch (error) {
            console.error('Ses kanalından çıkma hatası:', error);
            throw error;
        }
    }

    /**
     * Kullanıcı bilgilerini al
     */
    async getUserData(token) {
        try {
            console.log('🔍 Token kontrolü yapılıyor...');
            
            const response = await fetch('https://discord.com/api/v9/users/@me', {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`📡 API Yanıt Kodu: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Hatası:', errorText);
                throw new Error(`Token geçersiz (${response.status}): ${errorText}`);
            }

            const userData = await response.json();
            console.log(`✅ Token geçerli - Kullanıcı: ${userData.username}`);
            return userData;
        } catch (error) {
            console.error('Kullanıcı bilgileri alma hatası:', error);
            throw error;
        }
    }

    /**
     * Gateway URL'sini al
     */
    async getGatewayUrl() {
        try {
            const response = await fetch('https://discord.com/api/v9/gateway');
            const data = await response.json();
            return `${data.url}?v=9&encoding=json`;
        } catch (error) {
            console.error('Gateway URL alma hatası:', error);
            throw error;
        }
    }

    /**
     * Discord'a identify gönder
     */
    identify(ws, token) {
        const identifyPayload = {
            op: 2,
            d: {
                token: token,
                capabilities: 16381,
                properties: {
                    os: "Windows",
                    browser: "Discord Client",
                    device: "Discord Client",
                    system_locale: "tr-TR",
                    browser_user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Discord/1.0.9013 Chrome/120.0.0.0 Safari/537.36",
                    browser_version: "1.0.9013",
                    os_version: "10",
                    referrer: "",
                    referring_domain: "",
                    referrer_current: "",
                    referring_domain_current: "",
                    release_channel: "stable",
                    client_build_number: 225158,
                    client_event_source: null
                },
                presence: {
                    status: "online",
                    since: 0,
                    activities: [],
                    afk: false
                },
                compress: false,
                client_state: {
                    guild_hashes: {},
                    highest_last_message_id: "0",
                    read_state_version: 0,
                    user_guild_settings_version: -1,
                    user_settings_version: -1,
                    private_channels_version: "0",
                    api_code_version: 0
                }
            }
        };

        console.log(`📤 Identify payload gönderiliyor...`);
        ws.send(JSON.stringify(identifyPayload));
    }

    /**
     * Mesajları işle
     */
    async handleMessage(connection, message) {
        // Sequence numarasını güncelle
        if (message.s !== null) {
            connection.sequence = message.s;
        }

        switch (message.op) {
            case 10: // Hello
                this.startHeartbeat(connection, message.d.heartbeat_interval);
                break;
            case 0: // Dispatch
                await this.handleDispatch(connection, message);
                break;
        }
    }

    /**
     * Dispatch mesajlarını işle
     */
    async handleDispatch(connection, message) {
        switch (message.t) {
            case 'READY':
                console.log(`✅ ${connection.username} Discord'a bağlandı`);
                console.log(`📋 Session ID: ${message.d.session_id}`);
                connection.sessionId = message.d.session_id;
                break;
            case 'VOICE_STATE_UPDATE':
                if (message.d.user_id === connection.userId) {
                    console.log(`🎵 ${connection.username} ses durumu güncellendi:`);
                    console.log(`   - Kanal ID: ${message.d.channel_id}`);
                    console.log(`   - Session ID: ${message.d.session_id}`);
                    console.log(`   - Mute: ${message.d.self_mute}`);
                    console.log(`   - Deaf: ${message.d.self_deaf}`);
                }
                break;
            case 'VOICE_SERVER_UPDATE':
                console.log(`🎵 Voice server güncellendi:`);
                console.log(`   - Endpoint: ${message.d.endpoint}`);
                console.log(`   - Token: ${message.d.token}`);
                connection.voiceEndpoint = message.d.endpoint;
                connection.voiceToken = message.d.token;
                break;
        }
    }

    /**
     * Heartbeat başlat
     */
    startHeartbeat(connection, interval) {
        connection.heartbeatInterval = setInterval(() => {
            if (connection.ws.readyState === WebSocket.OPEN) {
                const heartbeat = {
                    op: 1,
                    d: connection.sequence
                };
                connection.ws.send(JSON.stringify(heartbeat));
            }
        }, interval);
    }

    /**
     * Voice state güncelle (ses kanalına katıl/çık)
     */
    async updateVoiceState(connection, channelId) {
        try {
            console.log(`🎵 Voice state güncelleniyor: ${channelId || 'çıkış'}`);
            console.log(`🏛️ Guild ID: ${connection.guildId}`);

            const voiceStateUpdate = {
                op: 4,
                d: {
                    guild_id: connection.guildId,
                    channel_id: channelId,
                    self_mute: false,
                    self_deaf: false,
                    self_video: false
                }
            };

            console.log(`📤 Voice state payload:`, JSON.stringify(voiceStateUpdate, null, 2));
            connection.ws.send(JSON.stringify(voiceStateUpdate));
            console.log(`✅ Voice state güncellendi: ${channelId || 'çıkış'}`);

        } catch (error) {
            console.error('Voice state güncelleme hatası:', error);
            throw error;
        }
    }

    /**
     * Kanal bilgilerini al
     */
    async getChannelInfo(token, channelId) {
        try {
            console.log(`🔍 Kanal bilgileri alınıyor: ${channelId}`);
            
            const response = await fetch(`https://discord.com/api/v9/channels/${channelId}`, {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Kanal API Hatası:', errorText);
                throw new Error(`Kanal bilgileri alınamadı (${response.status}): ${errorText}`);
            }

            const channelData = await response.json();
            console.log(`✅ Kanal bulundu: ${channelData.name} (${channelData.type})`);
            
            if (channelData.type !== 2) { // 2 = Voice Channel
                throw new Error('Bu kanal bir ses kanalı değil!');
            }

            return channelData;
        } catch (error) {
            console.error('Kanal bilgileri alma hatası:', error);
            throw error;
        }
    }

    /**
     * Kullanıcının guild'lerini al
     */
    async getUserGuilds(token) {
        try {
            const response = await fetch('https://discord.com/api/v9/users/@me/guilds', {
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Guild bilgileri alınamadı');
            }

            return await response.json();
        } catch (error) {
            console.error('Guild alma hatası:', error);
            return [];
        }
    }

    /**
     * Aktif bağlantıları listele
     */
    getActiveConnections() {
        return Array.from(this.connections.values()).map(conn => ({
            username: conn.username,
            channelId: conn.channelId,
            userId: conn.userId
        }));
    }

    /**
     * Belirli bir token için bağlantı durumu
     */
    getConnectionStatus(token) {
        const connection = this.connections.get(token);
        if (!connection) {
            return { connected: false };
        }

        return {
            connected: connection.ws.readyState === WebSocket.OPEN,
            username: connection.username,
            channelId: connection.channelId,
            userId: connection.userId
        };
    }
}

// Singleton instance
export const voiceManager = new VoiceManager();
