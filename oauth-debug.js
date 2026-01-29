// Debug OAuth Flow Issues
async function debugOAuth() {
    console.log('🔍 DEBUG: Starting OAuth Flow Test');
    
    try {
        // Test 1: Check backend OAuth endpoint
        console.log('1️⃣ Testing backend OAuth endpoint...');
        const response = await fetch('http://localhost:5000/api/auth/oauth/google');
        const data = await response.json();
        console.log('Backend response:', data);
        
        if (!data.success) {
            console.error('❌ Backend OAuth endpoint failed:', data.message);
            return;
        }
        
        // Test 2: Check Google OAuth URL format
        console.log('2️⃣ Validating OAuth URL...');
        const url = new URL(data.authUrl);
        console.log('✅ Valid OAuth URL:', url.origin + url.pathname);
        console.log('   - Client ID:', url.searchParams.get('client_id'));
        console.log('   - Redirect URI:', decodeURIComponent(url.searchParams.get('redirect_uri')));
        console.log('   - Scopes:', url.searchParams.get('scope'));
        
        // Test 3: Check environment variables (frontend can't access backend env, but can check if endpoints work)
        console.log('3️⃣ Testing backend configuration...');
        try {
            const debugResponse = await fetch('http://localhost:5000/api/auth/oauth/google/debug');
            const debugData = await debugResponse.json();
            console.log('Debug info:', debugData.debug);
        } catch (err) {
            console.log('Debug endpoint not available (normal)');
        }
        
        // Test 4: Test actual OAuth initiation (don't complete, just test start)
        console.log('4️⃣ OAuth URL ready for testing:');
        console.log('👆 Copy and paste this URL in browser to test manually:', data.authUrl);
        
        console.log('✅ OAuth flow debug complete - check results above');
        
    } catch (error) {
        console.error('❌ OAuth debug failed:', error);
    }
}

// Auto-run when page loads
if (typeof window !== 'undefined') {
    debugOAuth();
}

// Export for manual testing
if (typeof module !== 'undefined') {
    module.exports = { debugOAuth };
}