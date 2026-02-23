-- CreateTable
CREATE TABLE "organizations" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "api_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "session_id" TEXT NOT NULL,
    "trade_id" TEXT,
    "creator_pubkey" TEXT,
    "mpc_pubkey" TEXT,
    "solver_data" JSONB NOT NULL,
    "from_token" JSONB NOT NULL,
    "to_token" JSONB NOT NULL,
    "from_network_id" TEXT NOT NULL,
    "to_network_id" TEXT NOT NULL,
    "script_timeout" INTEGER,
    "trade_timeout" INTEGER,
    "deposit_address" TEXT,
    "deposit_tx_id" TEXT,
    "deposit_amount" TEXT,
    "extra_trade_info" JSONB,
    "is_deposited" BOOLEAN NOT NULL DEFAULT false,
    "org_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" SERIAL NOT NULL,
    "trade_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "trade_timeout" INTEGER,
    "script_timeout" INTEGER,
    "timestamp" INTEGER,
    "from_wallet_address" TEXT,
    "from_user_address" TEXT,
    "to_user_address" TEXT,
    "org_id" INTEGER,
    "processed_auto" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_events" (
    "id" SERIAL NOT NULL,
    "trade_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "tx_id" TEXT,
    "block_number" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "input_data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trade_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" SERIAL NOT NULL,
    "network_id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "network_name" TEXT NOT NULL,
    "network_symbol" TEXT NOT NULL,
    "network_type" TEXT NOT NULL DEFAULT 'EVM',
    "token_name" TEXT NOT NULL,
    "token_symbol" TEXT NOT NULL,
    "token_address" TEXT NOT NULL,
    "token_decimals" INTEGER NOT NULL,
    "token_logo_uri" TEXT NOT NULL,
    "network_logo_uri" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_pairs" (
    "id" SERIAL NOT NULL,
    "from_token_id" TEXT NOT NULL,
    "to_token_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_pairs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_api_key_key" ON "organizations"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_id_key" ON "sessions"("session_id");

-- CreateIndex
CREATE INDEX "sessions_trade_id_idx" ON "sessions"("trade_id");

-- CreateIndex
CREATE INDEX "sessions_from_network_id_is_deposited_created_at_trade_time_idx" ON "sessions"("from_network_id", "is_deposited", "created_at", "trade_timeout");

-- CreateIndex
CREATE UNIQUE INDEX "trades_trade_id_key" ON "trades"("trade_id");

-- CreateIndex
CREATE INDEX "trades_from_user_address_status_timestamp_idx" ON "trades"("from_user_address", "status", "timestamp" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "trade_events_trade_id_action_key" ON "trade_events"("trade_id", "action");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_id_key" ON "tokens"("token_id");

