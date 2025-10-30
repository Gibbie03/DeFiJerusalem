import { TwitterAlert, InsertTwitterAlert } from '@shared/schema';
import { nanoid } from 'nanoid';

interface TwitterStreamRule {
  value: string;
  tag: string;
}

interface TweetData {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  entities?: {
    hashtags?: Array<{ tag: string }>;
    urls?: Array<{ expanded_url: string }>;
    mentions?: Array<{ username: string }>;
  };
}

interface TweetStreamResponse {
  data: TweetData;
  includes?: {
    users?: Array<{ id: string; username: string }>;
  };
  matching_rules?: Array<{ tag: string }>;
}

export class TwitterMonitor {
  private bearerToken: string;
  private baseUrl = 'https://api.twitter.com/2/tweets/search/stream';
  private rulesUrl = 'https://api.twitter.com/2/tweets/search/stream/rules';

  constructor(bearerToken: string) {
    this.bearerToken = bearerToken;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.bearerToken}`,
      'Content-Type': 'application/json',
      'User-Agent': 'JerusalemDeFiScanner/1.0',
    };
  }

  async setDefaultRules(): Promise<{ success: boolean; rules: TwitterStreamRule[] }> {
    const rules: TwitterStreamRule[] = [
      {
        value: '(airdrop OR airdrops OR "free tokens" OR "claim airdrop") (#crypto OR #web3 OR #DeFi) -is:retweet -is:reply lang:en has:links',
        tag: 'crypto_airdrops'
      },
      {
        value: '(migration OR "new contract" OR "token upgrade" OR "migrate tokens") -is:retweet lang:en has:links',
        tag: 'token_migrations'
      },
      {
        value: '(TGE OR "token launch" OR "now live" OR "official launch") (#crypto OR #altcoin OR #DeFi) -is:retweet has:links',
        tag: 'token_launches'
      },
      {
        value: '(snapshot OR eligibility OR "claim now" OR distribution) (#crypto OR #airdrop) -is:retweet lang:en has:links',
        tag: 'snapshot_alerts'
      },
      {
        value: '(audited OR "audit completed" OR "security audit" OR @certik OR @OpenZeppelin OR @quantstamp) -is:retweet',
        tag: 'audit_announcements'
      },
      {
        value: '(scam OR phishing OR "wallet drainer" OR "fake site" OR "be careful") (#crypto OR #DeFi) -is:retweet',
        tag: 'scam_warnings'
      }
    ];

    try {
      // First, delete existing rules
      await this.deleteAllRules();

      // Then add new rules
      const response = await fetch(this.rulesUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ add: rules })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to set rules: ${error}`);
      }

      const data = await response.json();
      return { success: true, rules: data.data || [] };
    } catch (error) {
      console.error('Error setting Twitter rules:', error);
      return { success: false, rules: [] };
    }
  }

  private async deleteAllRules(): Promise<void> {
    try {
      const response = await fetch(this.rulesUrl, {
        headers: this.getHeaders()
      });

      if (!response.ok) return;

      const data = await response.json();
      const rules = data.data || [];

      if (rules.length === 0) return;

      const ruleIds = rules.map((rule: any) => rule.id);
      await fetch(this.rulesUrl, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ delete: { ids: ruleIds } })
      });
    } catch (error) {
      console.error('Error deleting rules:', error);
    }
  }

  async getCurrentRules(): Promise<TwitterStreamRule[]> {
    try {
      const response = await fetch(this.rulesUrl, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get rules: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error getting Twitter rules:', error);
      return [];
    }
  }

  processTweet(streamData: TweetStreamResponse, blacklistedDomains: string[]): InsertTwitterAlert | null {
    try {
      const tweet = streamData.data;
      const matchedRules = streamData.matching_rules || [];
      const user = streamData.includes?.users?.find(u => u.id === tweet.author_id);

      // Extract entities
      const hashtags = tweet.entities?.hashtags?.map(h => h.tag) || [];
      const urls = tweet.entities?.urls?.map(u => u.expanded_url) || [];
      const mentions = tweet.entities?.mentions?.map(m => m.username) || [];

      // Determine alert type and category based on matched rules
      const ruleTag = matchedRules[0]?.tag || 'unknown';
      let alertType: InsertTwitterAlert['alertType'] = 'scam';
      let severity: InsertTwitterAlert['severity'] = 'MEDIUM';
      let category = ruleTag;

      if (ruleTag.includes('airdrop')) {
        alertType = 'airdrop';
        severity = 'HIGH';
      } else if (ruleTag.includes('migration')) {
        alertType = 'migration';
        severity = 'CRITICAL';
      } else if (ruleTag.includes('audit')) {
        alertType = 'audit';
        severity = 'INFO';
      } else if (ruleTag.includes('scam')) {
        alertType = 'scam';
        severity = 'CRITICAL';
      } else if (ruleTag.includes('launch')) {
        alertType = 'airdrop';
        severity = 'MEDIUM';
      }

      // Check for suspicious domains
      let isSuspicious = false;
      let blacklistedDomain: string | null = null;

      for (const url of urls) {
        try {
          const urlObj = new URL(url);
          const domain = urlObj.hostname.toLowerCase();
          
          // Check against blacklisted domains
          if (blacklistedDomains.some(bd => domain.includes(bd.toLowerCase()))) {
            isSuspicious = true;
            blacklistedDomain = domain;
            severity = 'CRITICAL';
            alertType = 'scam';
            break;
          }

          // Check for suspicious TLDs
          const suspiciousTLDs = ['.lol', '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz'];
          if (suspiciousTLDs.some(tld => domain.endsWith(tld))) {
            isSuspicious = true;
            severity = 'HIGH';
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }

      // Extract matched keywords from tweet text
      const keywords = [
        'airdrop', 'migration', 'claim', 'snapshot', 'TGE', 'launch',
        'audit', 'scam', 'phishing', 'fake', 'drainer'
      ];
      const matchedKeywords = keywords.filter(kw => 
        tweet.text.toLowerCase().includes(kw.toLowerCase())
      );

      const alert: InsertTwitterAlert = {
        tweetId: tweet.id,
        authorId: tweet.author_id,
        authorUsername: user?.username || null,
        tweetText: tweet.text,
        alertType,
        category,
        severity,
        matchedKeywords,
        extractedUrls: urls.length > 0 ? urls : null,
        hashtags: hashtags.length > 0 ? hashtags : null,
        mentions: mentions.length > 0 ? mentions : null,
        protocolMentioned: null, // Will be filled by backend when cross-referencing
        isSuspicious,
        blacklistedDomain,
        crossReferencedProtocol: null, // Will be filled by backend
        status: 'pending',
        reviewNotes: null,
        tweetCreatedAt: new Date(tweet.created_at),
      };

      return alert;
    } catch (error) {
      console.error('Error processing tweet:', error);
      return null;
    }
  }

  async *startStream(): AsyncGenerator<TweetStreamResponse> {
    const streamUrl = `${this.baseUrl}?tweet.fields=created_at,author_id,entities&expansions=author_id`;
    
    try {
      const response = await fetch(streamUrl, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Stream connection failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\r\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;

          try {
            const tweet = JSON.parse(line);
            if (tweet.data) {
              yield tweet as TweetStreamResponse;
            }
          } catch (e) {
            console.error('Failed to parse tweet:', e);
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
      throw error;
    }
  }
}
