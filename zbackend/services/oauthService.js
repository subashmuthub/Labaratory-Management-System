// services/oauthService.js - OAuth Integration Service
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

class OAuthService {
    // Google OAuth Token Exchange
    static async exchangeGoogleCodeForToken(code) {
        try {
            // Dynamic redirect URI based on current server configuration
            const serverPort = process.env.PORT || 5000;
            const redirectUri = `http://localhost:${serverPort}/api/auth/oauth/google/callback`;
            
            console.log(`🔗 Exchanging Google code with redirect URI: ${redirectUri}`);

            const response = await axios.post('https://oauth2.googleapis.com/token', {
                client_id: process.env.GOOGLE_CLIENT_ID,
                client_secret: process.env.GOOGLE_CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            });

            return response.data;
        } catch (error) {
            console.error('Google token exchange error:', error.response?.data || error.message);
            console.error('Error details:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            
            // More specific error messages for common issues
            if (error.response?.data?.error === 'invalid_grant') {
                throw new Error('Authorization code expired or already used. Please try the login process again.');
            } else if (error.response?.data?.error === 'redirect_uri_mismatch') {
                throw new Error('Redirect URI mismatch. Please ensure the redirect URI is properly configured in Google Cloud Console.');
            } else if (error.response?.data?.error === 'invalid_client') {
                throw new Error('Invalid client credentials. Please check your Google Client ID and Secret.');
            }
            
            throw new Error('Failed to exchange Google code for token');
        }
    }

    // Get Google User Profile
    static async getGoogleUserProfile(accessToken) {
        try {
            const response = await axios.get(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`);
            return response.data;
        } catch (error) {
            console.error('Google profile fetch error:', error.response?.data || error.message);
            throw new Error('Failed to fetch Google user profile');
        }
    }

    // GitHub OAuth Token Exchange
    static async exchangeGitHubCodeForToken(code) {
        try {
            console.log('🔗 Exchanging GitHub code for token');
            console.log('📋 GitHub credentials:', {
                hasClientId: !!process.env.GITHUB_CLIENT_ID,
                clientIdStart: process.env.GITHUB_CLIENT_ID?.substring(0, 8),
                hasClientSecret: !!process.env.GITHUB_CLIENT_SECRET,
                secretStart: process.env.GITHUB_CLIENT_SECRET?.substring(0, 8)
            });

            const response = await axios.post('https://github.com/login/oauth/access_token', {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code: code,
            }, {
                headers: {
                    'Accept': 'application/json',
                },
            });

            console.log('🔍 GitHub token response:', {
                status: response.status,
                data: response.data,
                hasAccessToken: !!response.data?.access_token
            });

            return response.data;
        } catch (error) {
            console.error('❌ GitHub token exchange error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message
            });
            throw new Error('Failed to exchange GitHub code for token');
        }
    }

    // Get GitHub User Profile
    static async getGitHubUserProfile(accessToken) {
        try {
            const [userResponse, emailResponse] = await Promise.all([
                axios.get('https://api.github.com/user', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                    },
                }),
                axios.get('https://api.github.com/user/emails', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                    },
                })
            ]);

            const user = userResponse.data;
            const emails = emailResponse.data;
            const primaryEmail = emails.find(email => email.primary && email.verified);

            return {
                id: user.id,
                login: user.login,
                name: user.name || user.login,
                email: primaryEmail ? primaryEmail.email : user.email,
                avatar_url: user.avatar_url,
            };
        } catch (error) {
            console.error('GitHub profile fetch error:', error.response?.data || error.message);
            throw new Error('Failed to fetch GitHub user profile');
        }
    }

    // Create or Update User from OAuth
    static async createOrUpdateOAuthUser(profile, provider) {
        try {
            console.log(`🔍 Processing ${provider} OAuth profile:`, {
                id: profile.id,
                name: profile.name || profile.login,
                email: profile.email
            });

            const email = profile.email?.toLowerCase();
            
            if (!email) {
                console.error('❌ No email in OAuth profile:', profile);
                throw new Error('No email provided by OAuth provider');
            }

            // Check if user exists
            let user = await User.findOne({ where: { email } });
            console.log(`👤 User lookup for ${email}:`, user ? 'Found existing user' : 'New user');

            if (user) {
                // Update existing user with OAuth info
                const updateFields = {
                    is_email_verified: true, // OAuth providers verify emails
                    last_login: new Date(),
                };
                
                // Update avatar URL if available
                if (profile.avatar_url || profile.picture) {
                    updateFields.avatar_url = profile.avatar_url || profile.picture;
                }
                
                // Set the correct OAuth ID field
                if (provider === 'google') {
                    updateFields.google_id = profile.id;
                } else if (provider === 'github') {
                    updateFields.github_id = profile.id;
                }
                
                console.log(`🔄 Updating existing user with fields:`, Object.keys(updateFields));
                
                try {
                    await user.update(updateFields);
                    console.log(`✅ Successfully updated user ${user.id} with OAuth data`);
                } catch (updateError) {
                    console.error(`❌ Error updating user ${user.id}:`, updateError.message);
                    throw new Error(`Failed to update user: ${updateError.message}`);
                }
            } else {
                // Create new user from OAuth profile
                const createFields = {
                    name: profile.name || profile.login || 'OAuth User',
                    email: email,
                    password: null, // OAuth users don't have passwords
                    role: 'student', // Default role (must match enum in User model)
                    is_email_verified: true,
                    last_login: new Date(),
                };
                
                // Add avatar URL if available
                if (profile.avatar_url || profile.picture) {
                    createFields.avatar_url = profile.avatar_url || profile.picture;
                }
                
                // Set the correct OAuth ID field
                if (provider === 'google') {
                    createFields.google_id = profile.id;
                } else if (provider === 'github') {
                    createFields.github_id = profile.id;
                }
                
                console.log(`👤 Creating new ${provider} OAuth user:`, createFields);
                
                try {
                    user = await User.create(createFields);
                    console.log(`✅ New ${provider} user created successfully:`, user.id);
                } catch (createError) {
                    console.error(`❌ Error creating new user:`, createError.message);
                    if (createError.name === 'SequelizeValidationError') {
                        console.error('Validation errors:', createError.errors.map(e => e.message));
                    }
                    throw new Error(`Failed to create user: ${createError.message}`);
                }
            }

            return user;
        } catch (error) {
            console.error('OAuth user creation/update error:', error);
            throw error;
        }
    }

    // Generate JWT for OAuth User
    static generateJWT(user) {
        const payload = {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };

        return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    }

    // Process Google OAuth
    static async processGoogleOAuth(code) {
        try {
            // Exchange code for token
            const tokenData = await this.exchangeGoogleCodeForToken(code);
            
            if (!tokenData.access_token) {
                throw new Error('No access token received from Google');
            }

            // Get user profile
            const profile = await this.getGoogleUserProfile(tokenData.access_token);
            
            // Create or update user
            const user = await this.createOrUpdateOAuthUser(profile, 'google');
            
            // Generate JWT
            const token = this.generateJWT(user);

            return {
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        isEmailVerified: user.is_email_verified,
                    }
                }
            };
        } catch (error) {
            console.error('Google OAuth processing error:', error);
            return {
                success: false,
                message: error.message || 'Google OAuth authentication failed'
            };
        }
    }

    // Process GitHub OAuth
    static async processGitHubOAuth(code) {
        try {
            // Exchange code for token
            const tokenData = await this.exchangeGitHubCodeForToken(code);
            
            if (!tokenData.access_token) {
                throw new Error('No access token received from GitHub');
            }

            // Get user profile
            const profile = await this.getGitHubUserProfile(tokenData.access_token);
            
            // Create or update user
            const user = await this.createOrUpdateOAuthUser(profile, 'github');
            
            // Generate JWT
            const token = this.generateJWT(user);

            return {
                success: true,
                data: {
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        isEmailVerified: user.is_email_verified,
                    }
                }
            };
        } catch (error) {
            console.error('GitHub OAuth processing error:', error);
            return {
                success: false,
                message: error.message || 'GitHub OAuth authentication failed'
            };
        }
    }
}

module.exports = OAuthService;