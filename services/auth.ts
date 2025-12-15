import { User } from '../types';
import { db } from './persistence';

// Simulation of a JWT structure
interface SessionToken {
  userId: string;
  email: string;
  expiry: number;
  signature: string; // Fake signature
}

const TOKEN_KEY = 'nexus_auth_token';
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 5;

class AuthService {
  private requestLog: Record<string, number[]> = {};
  private otpStore: Record<string, string> = {}; // email -> code

  // --- Security Utilities ---

  private checkRateLimit(ipOrId: string): boolean {
    const now = Date.now();
    const timestamps = this.requestLog[ipOrId] || [];
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Filter out old requests
    const recentRequests = timestamps.filter(t => t > windowStart);
    this.requestLog[ipOrId] = [...recentRequests, now];

    return recentRequests.length < MAX_REQUESTS;
  }

  private generateToken(user: User): string {
    const payload: SessionToken = {
      userId: user.id,
      email: user.email,
      expiry: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      signature: Math.random().toString(36).substring(7)
    };
    return btoa(JSON.stringify(payload));
  }

  private verifyToken(token: string): SessionToken | null {
    try {
      const payload: SessionToken = JSON.parse(atob(token));
      if (Date.now() > payload.expiry) return null;
      return payload;
    } catch (e) {
      return null;
    }
  }

  // --- Auth Methods ---

  async loginWithPassword(email: string): Promise<{ user?: User; token?: string; error?: string }> {
    if (!this.checkRateLimit(email)) {
      return { error: 'Too many login attempts. Please try again later.' };
    }

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const user = db.login(email); // In real app, this would verify password hash
    if (!user) {
      return { error: 'Invalid credentials.' };
    }

    const token = this.generateToken(user);
    localStorage.setItem(TOKEN_KEY, token);
    return { user, token };
  }

  async sendOTP(email: string): Promise<{ success: boolean; error?: string }> {
    if (!this.checkRateLimit(email)) {
        return { success: false, error: 'Please wait before requesting another code.' };
    }

    await new Promise(resolve => setTimeout(resolve, 600));

    // Simulate OTP generation
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.otpStore[email] = code;
    
    console.log(`%c[Nexus Security] OTP for ${email}: ${code}`, "color: #3f83f8; font-size: 14px; font-weight: bold;");
    return { success: true };
  }

  async verifyOTP(email: string, code: string): Promise<{ user?: User; token?: string; error?: string }> {
    await new Promise(resolve => setTimeout(resolve, 800));

    if (this.otpStore[email] !== code) {
        return { error: 'Invalid verification code.' };
    }

    // Check if user exists, if not, create temp one (or handle signup flow)
    let user = db.login(email);
    if (!user) {
        // Auto-signup for demo purposes if OTP is verified
        const name = email.split('@')[0];
        user = db.signup(name, email);
    }

    delete this.otpStore[email]; // Consume OTP
    const token = this.generateToken(user);
    localStorage.setItem(TOKEN_KEY, token);
    
    return { user, token };
  }

  async socialLogin(provider: 'google' | 'github'): Promise<{ user: User; token: string }> {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock Social Login
      const email = `user_${provider}@example.com`;
      let user = db.login(email);
      if (!user) {
          user = db.signup(`${provider.charAt(0).toUpperCase() + provider.slice(1)} User`, email);
      }
      const token = this.generateToken(user);
      localStorage.setItem(TOKEN_KEY, token);
      return { user, token };
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);
    db.logout();
  }

  // --- Session ---

  restoreSession(): User | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    const payload = this.verifyToken(token);
    if (!payload) {
        this.logout();
        return null;
    }

    const user = db.getCurrentUser();
    if (user && user.id === payload.userId) {
        return user;
    }
    return null;
  }
}

export const auth = new AuthService();