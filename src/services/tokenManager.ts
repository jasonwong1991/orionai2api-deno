/**
 * Token pool management service
 */

import * as log from "@std/log";
import { config } from "../core/config.ts";

const logger = log.getLogger();

interface TokenStatus {
  token: string;
  lastUsed?: Date;
  failureCount: number;
  isActive: boolean;
}

interface TokenPoolStatus {
  totalTokens: number;
  availableTokens: number;
  failedTokens: number;
  tokenDetails: Array<{
    tokenSuffix: string;
    status: "active" | "failed";
    failureCount: number;
    lastUsed?: Date;
  }>;
}

export class TokenManager {
  private tokens: TokenStatus[] = [];
  private currentIndex = 0;
  private readonly maxFailures = 5;
  private readonly recoveryTimeMs = 10 * 60 * 1000; // 10 minutes

  initialize(): void {
    this.tokens = config.tokenPool.map((token) => ({
      token,
      failureCount: 0,
      isActive: true,
    }));

    logger.info(`TokenManager initialized with ${this.tokens.length} tokens`);
  }

  getToken(): string | null {
    if (this.tokens.length === 0) {
      logger.error("No tokens available in the pool");
      return null;
    }

    // Clean up expired failed tokens
    this.cleanupFailedTokens();

    // Get available tokens
    const availableTokens = this.tokens.filter((t) => t.isActive);

    if (availableTokens.length === 0) {
      logger.warning("All tokens are currently marked as failed, resetting...");
      this.resetAllTokens();
      return this.tokens[0]?.token || null;
    }

    // Use least recently used token
    const token = this.getLeastUsedToken(availableTokens);
    token.lastUsed = new Date();

    logger.info(`Selected token ending with: ...${token.token.slice(-10)}`);
    return token.token;
  }

  private getLeastUsedToken(availableTokens: TokenStatus[]): TokenStatus {
    return availableTokens.reduce((oldest, current) => {
      const oldestTime = oldest.lastUsed?.getTime() || 0;
      const currentTime = current.lastUsed?.getTime() || 0;
      return currentTime < oldestTime ? current : oldest;
    });
  }

  markTokenFailed(token: string, errorMsg = ""): void {
    const tokenStatus = this.tokens.find((t) => t.token === token);
    if (!tokenStatus) return;

    tokenStatus.failureCount++;
    tokenStatus.isActive = false;

    logger.warning(`Token marked as failed: ...${token.slice(-10)} - ${errorMsg}`);

    // Remove token if it has failed too many times
    if (tokenStatus.failureCount >= this.maxFailures) {
      logger.error(`Token removed from pool due to repeated failures: ...${token.slice(-10)}`);
      this.tokens = this.tokens.filter((t) => t.token !== token);
    }
  }

  markTokenSuccess(token: string): void {
    const tokenStatus = this.tokens.find((t) => t.token === token);
    if (!tokenStatus) return;

    if (!tokenStatus.isActive) {
      tokenStatus.isActive = true;
      logger.info(`Token restored to active status: ...${token.slice(-10)}`);
    }

    // Reset failure count on success
    tokenStatus.failureCount = 0;
  }

  private cleanupFailedTokens(): void {
    const now = new Date();
    const recoveryThreshold = new Date(now.getTime() - this.recoveryTimeMs);

    for (const tokenStatus of this.tokens) {
      if (
        !tokenStatus.isActive &&
        tokenStatus.lastUsed &&
        tokenStatus.lastUsed < recoveryThreshold
      ) {
        tokenStatus.isActive = true;
        logger.info(`Token restored after cleanup: ...${tokenStatus.token.slice(-10)}`);
      }
    }
  }

  private resetAllTokens(): void {
    for (const tokenStatus of this.tokens) {
      tokenStatus.isActive = true;
      tokenStatus.failureCount = 0;
    }
    logger.info("All tokens reset to active status");
  }

  addToken(token: string): void {
    if (!this.tokens.find((t) => t.token === token)) {
      this.tokens.push({
        token,
        failureCount: 0,
        isActive: true,
      });
      logger.info(`New token added to pool: ...${token.slice(-10)}`);
    }
  }

  removeToken(token: string): void {
    this.tokens = this.tokens.filter((t) => t.token !== token);
    logger.info(`Token removed from pool: ...${token.slice(-10)}`);
  }

  getPoolStatus(): TokenPoolStatus {
    const activeTokens = this.tokens.filter((t) => t.isActive);
    const failedTokens = this.tokens.filter((t) => !t.isActive);

    return {
      totalTokens: this.tokens.length,
      availableTokens: activeTokens.length,
      failedTokens: failedTokens.length,
      tokenDetails: this.tokens.map((t) => ({
        tokenSuffix: t.token.slice(-10),
        status: t.isActive ? "active" : "failed",
        failureCount: t.failureCount,
        lastUsed: t.lastUsed,
      })),
    };
  }

  validateToken(token: string): boolean {
    try {
      // Simple JWT format validation
      const parts = token.split(".");
      if (parts.length !== 3) return false;

      // Try to decode the payload (basic validation)
      const payload = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
      JSON.parse(payload);
      return true;
    } catch {
      return false;
    }
  }
}

// Global token manager instance
export const tokenManager = new TokenManager();
