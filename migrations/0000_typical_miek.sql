CREATE TABLE "admin_users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp,
	CONSTRAINT "admin_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "ai_learned_patterns" (
	"id" text PRIMARY KEY NOT NULL,
	"pattern" text NOT NULL,
	"severity" text NOT NULL,
	"category" text NOT NULL,
	"confidence" real NOT NULL,
	"occurrences" integer DEFAULT 1 NOT NULL,
	"examples" json DEFAULT '[]'::json NOT NULL,
	"first_seen" timestamp DEFAULT now() NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_scan_history" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_id" text NOT NULL,
	"entity_name" text NOT NULL,
	"entity_type" text NOT NULL,
	"threats" json NOT NULL,
	"severity" text NOT NULL,
	"score" real NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text,
	"telegram_chat_id" text,
	"subscription_type" text NOT NULL,
	"alert_types" json NOT NULL,
	"frequency" text DEFAULT 'immediate' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_sent" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blacklist_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"dapp_id" text NOT NULL,
	"dapp_name" text NOT NULL,
	"severity" text NOT NULL,
	"threats" json NOT NULL,
	"reason" text,
	"status" text NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL,
	"website" text,
	"twitter" text,
	"github" text,
	"legitimacy_score" real DEFAULT 0,
	"security_metrics" json,
	"last_vetted" timestamp
);
--> statement-breakpoint
CREATE TABLE "certik_audits" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol_id" text NOT NULL,
	"protocol_name" text NOT NULL,
	"security_score" real,
	"code_security_score" real,
	"market_score" real,
	"governance_score" real,
	"has_audit" boolean DEFAULT false NOT NULL,
	"audit_date" timestamp,
	"audit_status" text,
	"audit_report_url" text,
	"vulnerabilities" json,
	"risk_categories" json,
	"on_chain_monitoring" boolean DEFAULT false,
	"kyc_verified" boolean DEFAULT false,
	"bug_bounty_program" boolean DEFAULT false,
	"certik_skynet_url" text,
	"data_source" text DEFAULT 'skynet_scraper' NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contract_scans" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol_id" text,
	"contract_address" text NOT NULL,
	"chain" text NOT NULL,
	"is_honeypot" boolean,
	"cannot_buy" boolean,
	"cannot_sell" boolean,
	"buy_tax" real,
	"sell_tax" real,
	"hidden_owner" boolean,
	"is_proxy" boolean,
	"is_open_source" boolean,
	"owner_change_balance" boolean,
	"can_take_back_ownership" boolean,
	"trading_cooldown" boolean,
	"transfer_pausable" boolean,
	"holders" integer,
	"total_supply" text,
	"threats" json NOT NULL,
	"risk_score" real NOT NULL,
	"severity" text NOT NULL,
	"raw_data" json,
	"scanned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discovered_contracts" (
	"id" text PRIMARY KEY NOT NULL,
	"contract_address" text NOT NULL,
	"contract_name" text,
	"chain" text NOT NULL,
	"contract_type" text,
	"verified_at" timestamp,
	"discovered_at" timestamp DEFAULT now() NOT NULL,
	"compiler_version" text,
	"optimization" boolean,
	"source_code" text,
	"abi" json,
	"creator_address" text,
	"tx_hash" text,
	"explorer_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_at" timestamp,
	"promoted_to_protocol" boolean DEFAULT false,
	"protocol_id" text,
	"metadata" json
);
--> statement-breakpoint
CREATE TABLE "manual_audits" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol_id" text NOT NULL,
	"audit_firm" text NOT NULL,
	"audit_date" timestamp NOT NULL,
	"report_url" text,
	"findings" text,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "protocol_customizations" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol_id" text NOT NULL,
	"requestor_email" text NOT NULL,
	"requestor_name" text,
	"custom_description" text,
	"custom_website" text,
	"custom_twitter" text,
	"custom_github" text,
	"custom_audit_links" json,
	"custom_logo" text,
	"payment_amount" real DEFAULT 200 NOT NULL,
	"payment_status" text DEFAULT 'pending' NOT NULL,
	"payment_currency" text,
	"payment_tx_hash" text,
	"payment_address" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"review_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"applied_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "protocol_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"submitter_email" text NOT NULL,
	"submitter_name" text,
	"protocol_name" text NOT NULL,
	"website" text NOT NULL,
	"chains" json NOT NULL,
	"category" text NOT NULL,
	"contract_addresses" json,
	"description" text NOT NULL,
	"logo" text,
	"twitter" text,
	"github" text,
	"telegram" text,
	"discord" text,
	"audit_links" json,
	"status" text DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"security_scan_result" json,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"reviewed_by" text
);
--> statement-breakpoint
CREATE TABLE "protocol_whitelist" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol_id" text NOT NULL,
	"protocol_name" text NOT NULL,
	"reason" text NOT NULL,
	"verification_source" text NOT NULL,
	"certik_score" real,
	"defi_safety_score" real,
	"min_tvl" real,
	"exchange_listings" json,
	"added_by" text DEFAULT 'system' NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	"last_verified" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "protocol_whitelist_protocol_id_unique" UNIQUE("protocol_id")
);
--> statement-breakpoint
CREATE TABLE "protocols" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"chains" json NOT NULL,
	"category" text NOT NULL,
	"tvl" real NOT NULL,
	"volume_24h" real DEFAULT 0 NOT NULL,
	"change_24h" real NOT NULL,
	"age" integer,
	"audited" boolean NOT NULL,
	"audit_count" integer DEFAULT 0 NOT NULL,
	"audit_note" text,
	"audit_links" json,
	"security_score" real NOT NULL,
	"logo" text,
	"website" text,
	"twitter" text,
	"github" text,
	"description" text NOT NULL,
	"auto_discovered" boolean DEFAULT false NOT NULL,
	"manually_added" boolean DEFAULT false NOT NULL,
	"discovered_at" timestamp DEFAULT now() NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"sponsored_until" timestamp,
	"sponsorship_tier" text DEFAULT 'free',
	"featured_position" integer,
	"defi_security_score" real,
	"defi_audit_reports" json,
	"defi_has_multisig" boolean,
	"defi_has_timelock" boolean,
	"defi_data_fetched_at" timestamp,
	"contract_address" text,
	"contract_chain" text,
	"daily_active_wallets" integer DEFAULT 0,
	"weekly_active_wallets" integer DEFAULT 0,
	"monthly_active_wallets" integer DEFAULT 0,
	"transactions_24h" integer DEFAULT 0,
	"transactions_7d" integer DEFAULT 0,
	"contract_calls_24h" integer DEFAULT 0,
	"activity_history" json,
	"rank_by_activity" integer,
	"rank_by_tvl" integer,
	"rank_by_volume" integer
);
--> statement-breakpoint
CREATE TABLE "report_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"report_id" text NOT NULL,
	"voter_session_id" text NOT NULL,
	"vote_type" text NOT NULL,
	"voted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scammer_addresses" (
	"id" text PRIMARY KEY NOT NULL,
	"address" text NOT NULL,
	"chain" text NOT NULL,
	"address_type" text NOT NULL,
	"category" text NOT NULL,
	"severity" text NOT NULL,
	"description" text NOT NULL,
	"associated_scam" text,
	"total_stolen" real DEFAULT 0,
	"victim_count" integer DEFAULT 0,
	"first_seen" timestamp DEFAULT now() NOT NULL,
	"last_activity" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"related_addresses" json,
	"evidence_links" json,
	"reported_by" text,
	"verified_at" timestamp,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "security_scans" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol_id" text NOT NULL,
	"is_blacklisted" boolean NOT NULL,
	"severity" text NOT NULL,
	"threats" json NOT NULL,
	"score" real NOT NULL,
	"scanned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sponsor_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"protocol_id" text NOT NULL,
	"tier" text NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp NOT NULL,
	"amount" real NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invoice_url" text,
	"contact_email" text NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tutorial_videos" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"video_url" text NOT NULL,
	"thumbnail_url" text,
	"duration" integer,
	"category" text NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "twitter_alerts" (
	"id" text PRIMARY KEY NOT NULL,
	"tweet_id" text NOT NULL,
	"author_id" text NOT NULL,
	"author_username" text,
	"tweet_text" text NOT NULL,
	"alert_type" text NOT NULL,
	"category" text NOT NULL,
	"severity" text NOT NULL,
	"matched_keywords" json NOT NULL,
	"extracted_urls" json,
	"hashtags" json,
	"mentions" json,
	"protocol_mentioned" text,
	"is_suspicious" boolean DEFAULT false NOT NULL,
	"blacklisted_domain" text,
	"cross_referenced_protocol" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"review_notes" text,
	"tweet_created_at" timestamp NOT NULL,
	"detected_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	CONSTRAINT "twitter_alerts_tweet_id_unique" UNIQUE("tweet_id")
);
--> statement-breakpoint
CREATE TABLE "user_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"reporter_name" text,
	"reporter_email" text,
	"report_type" text NOT NULL,
	"target_id" text NOT NULL,
	"target_name" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"evidence" json,
	"severity" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"downvotes" integer DEFAULT 0 NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"verified_by" text,
	"verified_at" timestamp,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"admin_notes" text
);
--> statement-breakpoint
CREATE TABLE "user_reputation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_identifier" text NOT NULL,
	"reputation_score" integer DEFAULT 0 NOT NULL,
	"reports_submitted" integer DEFAULT 0 NOT NULL,
	"reports_verified" integer DEFAULT 0 NOT NULL,
	"reports_rejected" integer DEFAULT 0 NOT NULL,
	"last_active" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_endpoints" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"secret" text NOT NULL,
	"event_types" json NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_triggered" timestamp,
	"failure_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
ALTER TABLE "certik_audits" ADD CONSTRAINT "certik_audits_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_scans" ADD CONSTRAINT "contract_scans_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "manual_audits" ADD CONSTRAINT "manual_audits_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "protocol_customizations" ADD CONSTRAINT "protocol_customizations_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_votes" ADD CONSTRAINT "report_votes_report_id_user_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."user_reports"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "security_scans" ADD CONSTRAINT "security_scans_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sponsor_payments" ADD CONSTRAINT "sponsor_payments_protocol_id_protocols_id_fk" FOREIGN KEY ("protocol_id") REFERENCES "public"."protocols"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_users_username_idx" ON "admin_users" USING btree ("username");--> statement-breakpoint
CREATE UNIQUE INDEX "ai_learned_patterns_pattern_idx" ON "ai_learned_patterns" USING btree ("pattern","severity");--> statement-breakpoint
CREATE INDEX "ai_learned_patterns_confidence_idx" ON "ai_learned_patterns" USING btree ("confidence");--> statement-breakpoint
CREATE INDEX "ai_learned_patterns_category_idx" ON "ai_learned_patterns" USING btree ("category");--> statement-breakpoint
CREATE INDEX "ai_learned_patterns_last_seen_idx" ON "ai_learned_patterns" USING btree ("last_seen");--> statement-breakpoint
CREATE INDEX "ai_scan_history_entity_id_idx" ON "ai_scan_history" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "ai_scan_history_entity_type_idx" ON "ai_scan_history" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "ai_scan_history_timestamp_idx" ON "ai_scan_history" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "alert_subscriptions_email_idx" ON "alert_subscriptions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "alert_subscriptions_telegram_chat_id_idx" ON "alert_subscriptions" USING btree ("telegram_chat_id");--> statement-breakpoint
CREATE INDEX "alert_subscriptions_subscription_type_idx" ON "alert_subscriptions" USING btree ("subscription_type");--> statement-breakpoint
CREATE UNIQUE INDEX "blacklist_entries_dapp_id_unique_idx" ON "blacklist_entries" USING btree ("dapp_id");--> statement-breakpoint
CREATE INDEX "blacklist_entries_timestamp_idx" ON "blacklist_entries" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "blacklist_entries_status_idx" ON "blacklist_entries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "certik_audits_protocol_id_idx" ON "certik_audits" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "certik_audits_security_score_idx" ON "certik_audits" USING btree ("security_score");--> statement-breakpoint
CREATE INDEX "certik_audits_fetched_at_idx" ON "certik_audits" USING btree ("fetched_at");--> statement-breakpoint
CREATE INDEX "contract_scans_protocol_id_idx" ON "contract_scans" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "contract_scans_address_idx" ON "contract_scans" USING btree ("contract_address");--> statement-breakpoint
CREATE INDEX "contract_scans_chain_idx" ON "contract_scans" USING btree ("chain");--> statement-breakpoint
CREATE INDEX "contract_scans_scanned_at_idx" ON "contract_scans" USING btree ("scanned_at");--> statement-breakpoint
CREATE INDEX "discovered_contracts_chain_idx" ON "discovered_contracts" USING btree ("chain");--> statement-breakpoint
CREATE INDEX "discovered_contracts_discovered_at_idx" ON "discovered_contracts" USING btree ("discovered_at");--> statement-breakpoint
CREATE INDEX "discovered_contracts_status_idx" ON "discovered_contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "discovered_contracts_address_idx" ON "discovered_contracts" USING btree ("contract_address");--> statement-breakpoint
CREATE UNIQUE INDEX "discovered_contracts_unique_contract_chain" ON "discovered_contracts" USING btree ("contract_address","chain");--> statement-breakpoint
CREATE INDEX "protocol_customizations_protocol_id_idx" ON "protocol_customizations" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "protocol_customizations_status_idx" ON "protocol_customizations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "protocol_customizations_payment_status_idx" ON "protocol_customizations" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "protocol_submissions_submitter_email_idx" ON "protocol_submissions" USING btree ("submitter_email");--> statement-breakpoint
CREATE INDEX "protocol_submissions_status_idx" ON "protocol_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "protocol_submissions_submitted_at_idx" ON "protocol_submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "protocol_whitelist_protocol_id_idx" ON "protocol_whitelist" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "protocols_tvl_idx" ON "protocols" USING btree ("tvl");--> statement-breakpoint
CREATE INDEX "protocols_volume24h_idx" ON "protocols" USING btree ("volume_24h");--> statement-breakpoint
CREATE INDEX "protocols_category_idx" ON "protocols" USING btree ("category");--> statement-breakpoint
CREATE INDEX "protocols_change24h_idx" ON "protocols" USING btree ("change_24h");--> statement-breakpoint
CREATE INDEX "protocols_discovered_at_idx" ON "protocols" USING btree ("discovered_at");--> statement-breakpoint
CREATE INDEX "protocols_sponsored_until_idx" ON "protocols" USING btree ("sponsored_until");--> statement-breakpoint
CREATE INDEX "protocols_sponsorship_tier_idx" ON "protocols" USING btree ("sponsorship_tier");--> statement-breakpoint
CREATE INDEX "protocols_daily_active_wallets_idx" ON "protocols" USING btree ("daily_active_wallets");--> statement-breakpoint
CREATE INDEX "protocols_rank_by_activity_idx" ON "protocols" USING btree ("rank_by_activity");--> statement-breakpoint
CREATE INDEX "report_votes_report_id_idx" ON "report_votes" USING btree ("report_id");--> statement-breakpoint
CREATE UNIQUE INDEX "report_votes_unique_vote_idx" ON "report_votes" USING btree ("report_id","voter_session_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scammer_addresses_address_chain_idx" ON "scammer_addresses" USING btree ("address","chain");--> statement-breakpoint
CREATE INDEX "scammer_addresses_chain_idx" ON "scammer_addresses" USING btree ("chain");--> statement-breakpoint
CREATE INDEX "scammer_addresses_category_idx" ON "scammer_addresses" USING btree ("category");--> statement-breakpoint
CREATE INDEX "scammer_addresses_is_active_idx" ON "scammer_addresses" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "scammer_addresses_added_at_idx" ON "scammer_addresses" USING btree ("added_at");--> statement-breakpoint
CREATE UNIQUE INDEX "security_scans_protocol_id_unique_idx" ON "security_scans" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "security_scans_scanned_at_idx" ON "security_scans" USING btree ("scanned_at");--> statement-breakpoint
CREATE INDEX "sponsor_payments_protocol_id_idx" ON "sponsor_payments" USING btree ("protocol_id");--> statement-breakpoint
CREATE INDEX "sponsor_payments_status_idx" ON "sponsor_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "twitter_alerts_tweet_id_idx" ON "twitter_alerts" USING btree ("tweet_id");--> statement-breakpoint
CREATE INDEX "twitter_alerts_alert_type_idx" ON "twitter_alerts" USING btree ("alert_type");--> statement-breakpoint
CREATE INDEX "twitter_alerts_category_idx" ON "twitter_alerts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "twitter_alerts_severity_idx" ON "twitter_alerts" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "twitter_alerts_status_idx" ON "twitter_alerts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "twitter_alerts_detected_at_idx" ON "twitter_alerts" USING btree ("detected_at");--> statement-breakpoint
CREATE INDEX "user_reports_report_type_idx" ON "user_reports" USING btree ("report_type");--> statement-breakpoint
CREATE INDEX "user_reports_status_idx" ON "user_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "user_reports_submitted_at_idx" ON "user_reports" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "user_reports_target_id_idx" ON "user_reports" USING btree ("target_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_reputation_user_identifier_idx" ON "user_reputation" USING btree ("user_identifier");--> statement-breakpoint
CREATE INDEX "user_reputation_reputation_score_idx" ON "user_reputation" USING btree ("reputation_score");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_endpoints_url_idx" ON "webhook_endpoints" USING btree ("url");--> statement-breakpoint
CREATE INDEX "webhook_endpoints_active_idx" ON "webhook_endpoints" USING btree ("active");